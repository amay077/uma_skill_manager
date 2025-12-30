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
 * 同名の固有スキル（評価点 >= 300）が存在する normal スキルを inherited_unique に修正
 * @param db Database インスタンス
 * @returns 修正した件数
 */
function fixInheritedUniqueSkills(db: Database.Database): number {
  const result = db.prepare(`
    UPDATE skills
    SET type = 'unique', sub_type = 'inherited_unique'
    WHERE type = 'normal'
      AND name IN (
        SELECT name FROM skills
        WHERE type = 'unique' AND evaluation_point >= 300
      )
  `).run();

  return result.changes;
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
      activation_condition_description, effect_order, is_demerit
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
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
      const result = insertVariantStmt.run(
        skillId,
        variant.variantIndex,
        variant.triggerConditionRaw ?? null,
        variant.activationConditionRaw ?? null,
        variant.activationConditionDescription ?? null,
        variant.effectOrder,
        variant.isDemerit ? 1 : 0
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
