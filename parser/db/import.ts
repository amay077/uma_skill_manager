/**
 * JSON → SQLite インポート処理
 */
import type Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Skill, SupportCard, AndConditionGroup, SingleCondition, EffectParameter, EffectVariant } from '../types/index.js';
import { initializeDatabase, closeDatabase, DEFAULT_DB_PATH } from './connection.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** デフォルトの入力 JSON パス */
export const DEFAULT_JSON_PATH = join(__dirname, '../../output/skills.json');

/**
 * JSON ファイルからスキルデータを読み込む
 * @param jsonPath JSON ファイルパス
 * @returns スキル配列
 */
export function loadSkillsFromJson(jsonPath: string = DEFAULT_JSON_PATH): Skill[] {
  if (!existsSync(jsonPath)) {
    throw new Error(`入力ファイルが見つかりません: ${jsonPath}`);
  }

  try {
    const content = readFileSync(jsonPath, 'utf-8');
    return JSON.parse(content) as Skill[];
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`JSON パースエラー: ${error.message}`);
    }
    throw error;
  }
}

/**
 * サポートカードをインポート（重複除去）
 * @param db Database インスタンス
 * @param skills スキル配列
 * @returns サポートカード名 → ID のマップ
 */
function importSupportCards(
  db: Database.Database,
  skills: Skill[]
): Map<string, number> {
  const supportCardMap = new Map<string, number>();

  // 重複除去したサポートカードを抽出
  const uniqueSupportCards = new Map<string, SupportCard>();
  for (const skill of skills) {
    if (skill.supportCard) {
      uniqueSupportCards.set(skill.supportCard.fullName, skill.supportCard);
    }
  }

  const insertStmt = db.prepare(`
    INSERT INTO support_cards (costume_name, character_name, full_name)
    VALUES (?, ?, ?)
  `);

  for (const [fullName, sc] of uniqueSupportCards) {
    const result = insertStmt.run(sc.costumeName, sc.characterName, sc.fullName);
    supportCardMap.set(fullName, result.lastInsertRowid as number);
  }

  return supportCardMap;
}

/**
 * スキルをインポート
 * @param db Database インスタンス
 * @param skills スキル配列
 * @param supportCardMap サポートカード名 → ID のマップ
 * @returns スキルインデックス → ID のマップ
 */
function importSkills(
  db: Database.Database,
  skills: Skill[],
  supportCardMap: Map<string, number>
): Map<number, number> {
  const skillIdMap = new Map<number, number>();

  const insertStmt = db.prepare(`
    INSERT INTO skills (
      name, support_card_id, type, sub_type, base_skill_name, sp_cost, sp_total,
      description, evaluation_point, popularity, trigger_type, condition_raw, condition_description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    const supportCardId = skill.supportCard
      ? supportCardMap.get(skill.supportCard.fullName) ?? null
      : null;

    const result = insertStmt.run(
      skill.name,
      supportCardId,
      skill.type,
      skill.subType,
      skill.baseSkillName ?? null,
      skill.spCost ?? null,
      skill.spTotal ?? null,
      skill.description,
      skill.evaluationPoint,
      skill.popularity ?? null,
      skill.triggerType ?? null,
      skill.conditionRaw ?? null,
      skill.conditionDescription ?? null
    );

    skillIdMap.set(i, result.lastInsertRowid as number);
  }

  return skillIdMap;
}

/**
 * 発動条件をインポート
 * @param db Database インスタンス
 * @param skills スキル配列
 * @param skillIdMap スキルインデックス → ID のマップ
 */
function importSkillConditions(
  db: Database.Database,
  skills: Skill[],
  skillIdMap: Map<number, number>
): void {
  const insertStmt = db.prepare(`
    INSERT INTO skill_conditions (skill_id, group_index, condition_index, variable, operator, value)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    const skillId = skillIdMap.get(i);
    if (!skillId || !skill.condition) continue;

    for (let groupIdx = 0; groupIdx < skill.condition.groups.length; groupIdx++) {
      const group: AndConditionGroup = skill.condition.groups[groupIdx];
      for (let condIdx = 0; condIdx < group.conditions.length; condIdx++) {
        const cond: SingleCondition = group.conditions[condIdx];
        insertStmt.run(skillId, groupIdx, condIdx, cond.variable, cond.operator, cond.value);
      }
    }
  }
}

/**
 * 効果パラメータをインポート
 * @param db Database インスタンス
 * @param skills スキル配列
 * @param skillIdMap スキルインデックス → ID のマップ
 */
function importEffectParameters(
  db: Database.Database,
  skills: Skill[],
  skillIdMap: Map<number, number>
): void {
  const insertStmt = db.prepare(`
    INSERT INTO effect_parameters (skill_id, parameter_key, parameter_value)
    VALUES (?, ?, ?)
  `);

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    const skillId = skillIdMap.get(i);
    if (!skillId) continue;

    const params: EffectParameter = skill.effectParameters;
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && typeof value === 'number') {
        insertStmt.run(skillId, key, value);
      }
    }
  }
}

/**
 * 継承固有スキルの事後修正
 * 同名の固有スキル（type='unique'）が存在する normal スキルを inherited_unique に修正
 * @param db Database インスタンス
 * @returns 修正した件数
 */
function fixInheritedUniqueSkills(db: Database.Database): number {
  // 同名の unique スキルが存在する normal スキルを inherited_unique に変更
  const result = db.prepare(`
    UPDATE skills
    SET type = 'unique', sub_type = 'inherited_unique'
    WHERE type = 'normal'
      AND name IN (
        SELECT name FROM skills WHERE type = 'unique'
      )
  `).run();

  return result.changes;
}

// ============================================
// ビットフラグパース関数
// ============================================

/**
 * 作戦条件をパース（4桁ビットフラグ）
 * @param conditionRaw 条件文字列
 * @returns 4桁のビットフラグ文字列（逃げ/先行/差し/追込）
 */
function parseRunningStyleFlags(conditionRaw: string | null): string {
  if (!conditionRaw) return '1111';

  const flags = ['0', '0', '0', '0'];
  const matches = conditionRaw.matchAll(/running_style==(\d)/g);
  for (const match of matches) {
    const style = parseInt(match[1], 10);
    if (style >= 1 && style <= 4) {
      flags[style - 1] = '1';
    }
  }

  // 1つもマッチしなければ全作戦対応
  return flags.includes('1') ? flags.join('') : '1111';
}

/**
 * 距離条件をパース（4桁ビットフラグ）
 * @param conditionRaw 条件文字列
 * @returns 4桁のビットフラグ文字列（短距離/マイル/中距離/長距離）
 */
function parseDistanceFlags(conditionRaw: string | null): string {
  if (!conditionRaw) return '1111';

  // distance_type==N パターンを優先（1=短距離, 2=マイル, 3=中距離, 4=長距離）
  const distTypeFlags = ['0', '0', '0', '0'];
  const distTypeMatches = conditionRaw.matchAll(/distance_type==(\d)/g);
  for (const match of distTypeMatches) {
    const distType = parseInt(match[1], 10);
    if (distType >= 1 && distType <= 4) {
      distTypeFlags[distType - 1] = '1';
    }
  }
  // distance_type が1つ以上マッチした場合はそれを返す
  if (distTypeFlags.includes('1')) {
    return distTypeFlags.join('');
  }

  // 距離境界値
  const SHORT_MAX = 1599;
  const MILE_MIN = 1600;
  const MILE_MAX = 1999;
  const MIDDLE_MIN = 2000;
  const MIDDLE_MAX = 2499;
  const LONG_MIN = 2500;

  // デフォルトは全距離対応
  let flags = [true, true, true, true]; // [短距離, マイル, 中距離, 長距離]

  // course_distance の条件をパース
  // course_distance<N → N未満
  const ltMatch = conditionRaw.match(/course_distance<(\d+)(?!=)/);
  if (ltMatch) {
    const val = parseInt(ltMatch[1], 10);
    if (val <= MILE_MIN) flags = [true, false, false, false];
    else if (val <= MIDDLE_MIN) flags = [true, true, false, false];
    else if (val <= LONG_MIN) flags = [true, true, true, false];
  }

  // course_distance<=N → N以下
  const lteMatch = conditionRaw.match(/course_distance<=(\d+)/);
  if (lteMatch) {
    const val = parseInt(lteMatch[1], 10);
    if (val < MILE_MIN) flags = [true, false, false, false];
    else if (val < MIDDLE_MIN) flags = [true, true, false, false];
    else if (val < LONG_MIN) flags = [true, true, true, false];
  }

  // course_distance>N → N超過
  const gtMatch = conditionRaw.match(/course_distance>(\d+)(?!=)/);
  if (gtMatch) {
    const val = parseInt(gtMatch[1], 10);
    if (val >= MIDDLE_MAX) flags = [false, false, false, true];
    else if (val >= MILE_MAX) flags = [false, false, true, true];
    else if (val >= SHORT_MAX) flags = [false, true, true, true];
  }

  // course_distance>=N → N以上
  const gteMatch = conditionRaw.match(/course_distance>=(\d+)/);
  if (gteMatch) {
    const val = parseInt(gteMatch[1], 10);
    if (val > MIDDLE_MAX) flags = [false, false, false, true];
    else if (val > MILE_MAX) flags = [false, false, true, true];
    else if (val > SHORT_MAX) flags = [false, true, true, true];
  }

  return flags.map(f => f ? '1' : '0').join('');
}

/**
 * バ場条件をパース（2桁ビットフラグ）
 * @param conditionRaw 条件文字列
 * @returns 2桁のビットフラグ文字列（芝/ダート）
 */
function parseGroundFlags(conditionRaw: string | null): string {
  if (!conditionRaw) return '11';

  const flags = ['0', '0'];
  const matches = conditionRaw.matchAll(/ground_type==(\d)/g);
  for (const match of matches) {
    const ground = parseInt(match[1], 10);
    if (ground >= 1 && ground <= 2) {
      flags[ground - 1] = '1';
    }
  }

  // 1つもマッチしなければ全バ場対応
  return flags.includes('1') ? flags.join('') : '11';
}

/**
 * 順位条件をパース（9桁ビットフラグ）
 * @param triggerConditionRaw trigger_condition_raw の値
 * @param activationConditionRaw activation_condition_raw の値
 * @returns 9桁のビットフラグ文字列（1位〜9位）
 */
function parseOrderFlags(
  triggerConditionRaw: string | null,
  activationConditionRaw: string | null
): string {
  // デフォルトは全順位対応
  const flags = [true, true, true, true, true, true, true, true, true];

  const parseFromCondition = (conditionRaw: string) => {
    // order==N パターン（N位限定で発動）
    const orderEqMatch = conditionRaw.match(/order==(\d+)/);
    if (orderEqMatch) {
      const val = parseInt(orderEqMatch[1], 10);
      for (let i = 0; i < 9; i++) {
        flags[i] = (i + 1) === val;
      }
      return;
    }

    // order>=N パターン（N位以降で発動）
    const orderGteMatch = conditionRaw.match(/order>=(\d+)/);
    if (orderGteMatch) {
      const val = parseInt(orderGteMatch[1], 10);
      for (let i = 0; i < val - 1 && i < 9; i++) {
        flags[i] = false;
      }
    }

    // order<=N パターン（N位以内で発動）
    const orderLteMatch = conditionRaw.match(/order<=(\d+)/);
    if (orderLteMatch) {
      const val = parseInt(orderLteMatch[1], 10);
      for (let i = val; i < 9; i++) {
        flags[i] = false;
      }
    }

    // order_rate>=N パターン → 9人立て換算
    const orderRateGteMatch = conditionRaw.match(/order_rate>=(\d+)/);
    if (orderRateGteMatch) {
      const rate = parseInt(orderRateGteMatch[1], 10);
      const converted = Math.ceil(rate / 100 * 9);
      for (let i = 0; i < converted - 1 && i < 9; i++) {
        flags[i] = false;
      }
    }

    // order_rate<=N パターン → 9人立て換算
    const orderRateLteMatch = conditionRaw.match(/order_rate<=(\d+)/);
    if (orderRateLteMatch) {
      const rate = parseInt(orderRateLteMatch[1], 10);
      const converted = Math.ceil(rate / 100 * 9);
      for (let i = converted; i < 9; i++) {
        flags[i] = false;
      }
    }

    // order_rate>N パターン → 9人立て換算
    const orderRateGtMatch = conditionRaw.match(/order_rate>(\d+)(?!=)/);
    if (orderRateGtMatch) {
      const rate = parseInt(orderRateGtMatch[1], 10);
      const converted = Math.ceil((rate + 1) / 100 * 9);
      for (let i = 0; i < converted - 1 && i < 9; i++) {
        flags[i] = false;
      }
    }

    // order_rate_inN_continue パターン → 上位N%維持で発動
    const orderRateInMatch = conditionRaw.match(/order_rate_in(\d+)_continue/);
    if (orderRateInMatch) {
      const rate = parseInt(orderRateInMatch[1], 10);
      const converted = Math.ceil(rate / 100 * 9);
      for (let i = converted; i < 9; i++) {
        flags[i] = false;
      }
    }

    // order_rate_outN_continue パターン → N%より後ろを維持で発動
    const orderRateOutMatch = conditionRaw.match(/order_rate_out(\d+)_continue/);
    if (orderRateOutMatch) {
      const rate = parseInt(orderRateOutMatch[1], 10);
      const converted = Math.ceil(rate / 100 * 9) + 1;
      for (let i = 0; i < converted - 1 && i < 9; i++) {
        flags[i] = false;
      }
    }
  };

  if (triggerConditionRaw) {
    parseFromCondition(triggerConditionRaw);
  }
  if (activationConditionRaw) {
    parseFromCondition(activationConditionRaw);
  }

  return flags.map(f => f ? '1' : '0').join('');
}

/**
 * フェーズフラグをパース
 * ビット位置: 1=序盤, 2=中盤, 3=終盤
 * フェーズ定義: 序盤 0-33%, 中盤 33-66%, 終盤 66-100%
 */
function parsePhaseFlags(conditionRaw: string | null): string {
  if (!conditionRaw) return '111'; // 条件なし = 全フェーズ対応

  // 序盤・中盤・終盤のフラグ（true = 発動可能）
  let early = true;
  let mid = true;
  let late = true;

  // 終盤限定パターン（これらがあれば序盤・中盤では発動しない）
  const lateOnlyPatterns = [
    /phase>=2/,
    /phase==2/,
    /phase==3/,
    /phase_random==2/,
    /is_finalcorner/,
    /is_last_straight/,
    /is_lastspurt/,
    /change_order_up_end_after/, // 終盤追い抜き
  ];

  // distance_rate による終盤判定（66%以上で発動開始）
  const distanceRateLatePattern = /distance_rate>=(\d+)/g;
  const distanceRateMatches = [...conditionRaw.matchAll(distanceRateLatePattern)];
  for (const match of distanceRateMatches) {
    const rate = parseInt(match[1], 10);
    if (rate >= 66) {
      // 66%以上で発動 = 終盤のみ
      early = false;
      mid = false;
    } else if (rate >= 33) {
      // 33%以上で発動 = 序盤では発動しない
      early = false;
    }
  }

  // remain_distance による終盤判定（残り400m以下は終盤相当）
  const remainDistancePattern = /remain_distance<=(\d+)/g;
  const remainMatches = [...conditionRaw.matchAll(remainDistancePattern)];
  for (const match of remainMatches) {
    const dist = parseInt(match[1], 10);
    if (dist <= 400) {
      // 残り400m以下 = 終盤のみ
      early = false;
      mid = false;
    }
  }

  // 終盤限定パターンのチェック
  for (const pattern of lateOnlyPatterns) {
    if (pattern.test(conditionRaw)) {
      early = false;
      mid = false;
      break;
    }
  }

  // 序盤限定パターン
  if (/phase==0/.test(conditionRaw) || /phase_random==0/.test(conditionRaw)) {
    mid = false;
    late = false;
  }

  // 中盤限定パターン
  if (/phase==1/.test(conditionRaw) || /phase_random==1/.test(conditionRaw)) {
    early = false;
    late = false;
  }

  // phase_firsthalf_random のパターン
  // ==1, ==2: 中盤前半/後半ランダム → 中盤のみ
  if (/phase_firsthalf_random==[12]/.test(conditionRaw)) {
    early = false;
    late = false;
  }
  // ==3: 終盤前半ランダム → 終盤のみ
  if (/phase_firsthalf_random==3/.test(conditionRaw)) {
    early = false;
    mid = false;
  }

  // phase_laterhalf_random のパターン
  // ==0: 序盤後半ランダム → 序盤のみ
  if (/phase_laterhalf_random==0/.test(conditionRaw)) {
    mid = false;
    late = false;
  }
  // ==1: 中盤後半ランダム → 中盤のみ
  if (/phase_laterhalf_random==1/.test(conditionRaw)) {
    early = false;
    late = false;
  }

  // phase_firsthalf のパターン（非ランダム）
  // ==1: 中盤前半 → 中盤のみ
  if (/phase_firsthalf==1/.test(conditionRaw)) {
    early = false;
    late = false;
  }

  // phase_laterhalf のパターン（非ランダム）
  // ==0: 序盤後半 → 序盤のみ
  if (/phase_laterhalf==0/.test(conditionRaw)) {
    mid = false;
    late = false;
  }

  // distance_rate による序盤・中盤判定
  const distanceRateEarlyPattern = /distance_rate<=(\d+)/g;
  const earlyMatches = [...conditionRaw.matchAll(distanceRateEarlyPattern)];
  for (const match of earlyMatches) {
    const rate = parseInt(match[1], 10);
    if (rate <= 33) {
      // 33%以下で終了 = 序盤のみ
      mid = false;
      late = false;
    } else if (rate <= 66) {
      // 66%以下で終了 = 終盤では発動しない
      late = false;
    }
  }

  return `${early ? '1' : '0'}${mid ? '1' : '0'}${late ? '1' : '0'}`;
}

/**
 * 全ビットフラグをパース
 */
function parseAllFlags(
  triggerConditionRaw: string | null,
  activationConditionRaw: string | null
): {
  runningStyleFlags: string;
  distanceFlags: string;
  groundFlags: string;
  orderFlags: string;
  phaseFlags: string;
} {
  // trigger と activation の両方から条件を解析
  const combinedCondition = [triggerConditionRaw, activationConditionRaw]
    .filter(Boolean)
    .join('&');

  return {
    runningStyleFlags: parseRunningStyleFlags(combinedCondition || null),
    distanceFlags: parseDistanceFlags(combinedCondition || null),
    groundFlags: parseGroundFlags(combinedCondition || null),
    orderFlags: parseOrderFlags(triggerConditionRaw, activationConditionRaw),
    phaseFlags: parsePhaseFlags(activationConditionRaw),
  };
}

/**
 * 効果バリアントをインポート
 * @param db Database インスタンス
 * @param skills スキル配列
 * @param skillIdMap スキルインデックス → ID のマップ
 */
function importEffectVariants(
  db: Database.Database,
  skills: Skill[],
  skillIdMap: Map<number, number>
): void {
  const insertVariantStmt = db.prepare(`
    INSERT INTO skill_effect_variants (
      skill_id, variant_index, trigger_condition_raw, activation_condition_raw,
      activation_condition_description, effect_order, is_demerit,
      running_style_flags, distance_flags, ground_flags, order_flags, phase_flags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertParamStmt = db.prepare(`
    INSERT INTO variant_parameters (variant_id, parameter_key, parameter_value)
    VALUES (?, ?, ?)
  `);

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    const skillId = skillIdMap.get(i);
    if (!skillId || !skill.effectVariants) continue;

    for (const variant of skill.effectVariants) {
      // 全ビットフラグをパース（作戦・距離・バ場・順位・フェーズ）
      const flags = parseAllFlags(
        variant.triggerConditionRaw ?? null,
        variant.activationConditionRaw ?? null
      );

      const result = insertVariantStmt.run(
        skillId,
        variant.variantIndex,
        variant.triggerConditionRaw ?? null,
        variant.activationConditionRaw ?? null,
        variant.activationConditionDescription ?? null,
        variant.effectOrder,
        variant.isDemerit ? 1 : 0,
        flags.runningStyleFlags,
        flags.distanceFlags,
        flags.groundFlags,
        flags.orderFlags,
        flags.phaseFlags
      );

      const variantId = result.lastInsertRowid as number;

      // バリアントのパラメータをインポート
      for (const [key, value] of Object.entries(variant.effectParameters)) {
        if (value !== undefined && typeof value === 'number') {
          insertParamStmt.run(variantId, key, value);
        }
      }
    }
  }
}

/**
 * インポート結果
 */
export interface ImportResult {
  /** インポートしたサポートカード数 */
  supportCardCount: number;
  /** インポートしたスキル数 */
  skillCount: number;
  /** インポートした条件数 */
  conditionCount: number;
  /** インポートしたパラメータ数 */
  parameterCount: number;
  /** インポートしたバリアント数 */
  variantCount: number;
  /** インポートしたバリアントパラメータ数 */
  variantParameterCount: number;
  /** 継承固有スキルとして修正した件数 */
  inheritedUniqueFixedCount: number;
}

/**
 * JSON からデータベースにインポート
 * @param jsonPath JSON ファイルパス
 * @param dbPath データベースファイルパス
 * @param force 既存データを削除して再作成するか
 * @returns インポート結果
 */
export function importToDatabase(
  jsonPath: string = DEFAULT_JSON_PATH,
  dbPath: string = DEFAULT_DB_PATH,
  force: boolean = true
): ImportResult {
  const skills = loadSkillsFromJson(jsonPath);

  const db = initializeDatabase(dbPath, force);

  try {
    // トランザクション内で全件インポート
    const result = db.transaction(() => {
      const supportCardMap = importSupportCards(db, skills);
      const skillIdMap = importSkills(db, skills, supportCardMap);
      importSkillConditions(db, skills, skillIdMap);
      importEffectParameters(db, skills, skillIdMap);
      importEffectVariants(db, skills, skillIdMap);

      // 継承固有スキルの事後修正
      const inheritedUniqueFixedCount = fixInheritedUniqueSkills(db);

      // 件数を取得
      const supportCardCount = db.prepare('SELECT COUNT(*) as count FROM support_cards').get() as { count: number };
      const skillCount = db.prepare('SELECT COUNT(*) as count FROM skills').get() as { count: number };
      const conditionCount = db.prepare('SELECT COUNT(*) as count FROM skill_conditions').get() as { count: number };
      const parameterCount = db.prepare('SELECT COUNT(*) as count FROM effect_parameters').get() as { count: number };
      const variantCount = db.prepare('SELECT COUNT(*) as count FROM skill_effect_variants').get() as { count: number };
      const variantParameterCount = db.prepare('SELECT COUNT(*) as count FROM variant_parameters').get() as { count: number };

      return {
        supportCardCount: supportCardCount.count,
        skillCount: skillCount.count,
        conditionCount: conditionCount.count,
        parameterCount: parameterCount.count,
        variantCount: variantCount.count,
        variantParameterCount: variantParameterCount.count,
        inheritedUniqueFixedCount,
      };
    })();

    return result;
  } finally {
    closeDatabase(db);
  }
}

// CLI エントリーポイント
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const jsonPath = args.find(a => a.startsWith('--input='))?.split('=')[1] ?? DEFAULT_JSON_PATH;
  const dbPath = args.find(a => a.startsWith('--output='))?.split('=')[1] ?? DEFAULT_DB_PATH;
  const force = args.includes('--force');

  try {
    console.log('インポートを開始します...');
    console.log(`入力: ${jsonPath}`);
    console.log(`出力: ${dbPath}`);

    const result = importToDatabase(jsonPath, dbPath, force);

    console.log('\nインポート完了:');
    console.log(`  サポートカード: ${result.supportCardCount} 件`);
    console.log(`  スキル: ${result.skillCount} 件`);
    console.log(`  発動条件: ${result.conditionCount} 件`);
    console.log(`  効果パラメータ: ${result.parameterCount} 件`);
    console.log(`  効果バリアント: ${result.variantCount} 件`);
    console.log(`  バリアントパラメータ: ${result.variantParameterCount} 件`);
    console.log(`  継承固有スキル修正: ${result.inheritedUniqueFixedCount} 件`);
  } catch (error) {
    console.error('エラー:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
