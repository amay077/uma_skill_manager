/**
 * クエリユーティリティ
 */
import type Database from 'better-sqlite3';
import { getDatabase, DEFAULT_DB_PATH } from './connection.js';

/**
 * スキル検索結果
 */
export interface SkillSearchResult {
  id: number;
  name: string;
  type: string;
  base_skill_name: string | null;
  description: string;
  evaluation_point: number;
  popularity: string | null;
  trigger_type: string | null;
  condition_raw: string | null;
  condition_description: string | null;
  support_card_id: number | null;
  costume_name: string | null;
  character_name: string | null;
  support_card_full_name: string | null;
  effect_params: string | null;
}

/**
 * 条件検索結果
 */
export interface ConditionSearchResult {
  skill_id: number;
  skill_name: string;
  skill_type: string;
  description: string;
  group_index: number;
  condition_index: number;
  variable: string;
  operator: string;
  value: number;
}

/**
 * サポカスキル一覧結果
 */
export interface SupportCardSkillResult {
  support_card_id: number;
  costume_name: string;
  character_name: string;
  full_name: string;
  skill_id: number;
  skill_name: string;
  skill_type: string;
  evaluation_point: number;
  description: string;
}

/**
 * スキル検索オプション
 */
export interface SkillSearchOptions {
  /** スキル名（部分一致） */
  name?: string;
  /** スキル種別 */
  type?: 'unique' | 'evolution' | 'normal';
  /** サポカキャラ名（部分一致） */
  characterName?: string;
  /** 最小評価点 */
  minEvaluationPoint?: number;
  /** 最大評価点 */
  maxEvaluationPoint?: number;
}

/**
 * 条件検索オプション
 */
export interface ConditionSearchOptions {
  /** 変数名 */
  variable?: string;
  /** 演算子 */
  operator?: string;
  /** 最小値 */
  minValue?: number;
  /** 最大値 */
  maxValue?: number;
}

/**
 * 効果パラメータ検索オプション
 */
export interface EffectParameterSearchOptions {
  /** パラメータ名 */
  parameterKey?: string;
  /** 最小値 */
  minValue?: number;
  /** 最大値 */
  maxValue?: number;
}

/**
 * スキルを検索
 * @param options 検索オプション
 * @param dbPath データベースパス
 * @returns 検索結果
 */
export function searchSkills(
  options: SkillSearchOptions = {},
  dbPath: string = DEFAULT_DB_PATH
): SkillSearchResult[] {
  const db = getDatabase(dbPath);

  try {
    let sql = 'SELECT * FROM skill_full_view WHERE 1=1';
    const params: (string | number)[] = [];

    if (options.name) {
      sql += ' AND name LIKE ?';
      params.push(`%${options.name}%`);
    }

    if (options.type) {
      sql += ' AND type = ?';
      params.push(options.type);
    }

    if (options.characterName) {
      sql += ' AND character_name LIKE ?';
      params.push(`%${options.characterName}%`);
    }

    if (options.minEvaluationPoint !== undefined) {
      sql += ' AND evaluation_point >= ?';
      params.push(options.minEvaluationPoint);
    }

    if (options.maxEvaluationPoint !== undefined) {
      sql += ' AND evaluation_point <= ?';
      params.push(options.maxEvaluationPoint);
    }

    sql += ' ORDER BY evaluation_point DESC, name';

    return db.prepare(sql).all(...params) as SkillSearchResult[];
  } finally {
    db.close();
  }
}

/**
 * 条件式でスキルを検索
 * @param options 検索オプション
 * @param dbPath データベースパス
 * @returns 検索結果
 */
export function searchByCondition(
  options: ConditionSearchOptions = {},
  dbPath: string = DEFAULT_DB_PATH
): ConditionSearchResult[] {
  const db = getDatabase(dbPath);

  try {
    let sql = 'SELECT * FROM condition_search_view WHERE 1=1';
    const params: (string | number)[] = [];

    if (options.variable) {
      sql += ' AND variable = ?';
      params.push(options.variable);
    }

    if (options.operator) {
      sql += ' AND operator = ?';
      params.push(options.operator);
    }

    if (options.minValue !== undefined) {
      sql += ' AND value >= ?';
      params.push(options.minValue);
    }

    if (options.maxValue !== undefined) {
      sql += ' AND value <= ?';
      params.push(options.maxValue);
    }

    sql += ' ORDER BY skill_name, group_index, condition_index';

    return db.prepare(sql).all(...params) as ConditionSearchResult[];
  } finally {
    db.close();
  }
}

/**
 * 効果パラメータでスキルを検索
 * @param options 検索オプション
 * @param dbPath データベースパス
 * @returns 検索結果（スキルID と一致するパラメータ）
 */
export function searchByEffectParameter(
  options: EffectParameterSearchOptions = {},
  dbPath: string = DEFAULT_DB_PATH
): SkillSearchResult[] {
  const db = getDatabase(dbPath);

  try {
    let sql = `
      SELECT DISTINCT sfv.*
      FROM skill_full_view sfv
      JOIN effect_parameters ep ON sfv.id = ep.skill_id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (options.parameterKey) {
      sql += ' AND ep.parameter_key = ?';
      params.push(options.parameterKey);
    }

    if (options.minValue !== undefined) {
      sql += ' AND ep.parameter_value >= ?';
      params.push(options.minValue);
    }

    if (options.maxValue !== undefined) {
      sql += ' AND ep.parameter_value <= ?';
      params.push(options.maxValue);
    }

    sql += ' ORDER BY sfv.evaluation_point DESC, sfv.name';

    return db.prepare(sql).all(...params) as SkillSearchResult[];
  } finally {
    db.close();
  }
}

/**
 * サポカごとのスキル一覧を取得
 * @param characterName キャラ名（部分一致）
 * @param dbPath データベースパス
 * @returns 検索結果
 */
export function getSkillsBySupportCard(
  characterName?: string,
  dbPath: string = DEFAULT_DB_PATH
): SupportCardSkillResult[] {
  const db = getDatabase(dbPath);

  try {
    let sql = 'SELECT * FROM support_card_skills_view WHERE 1=1';
    const params: string[] = [];

    if (characterName) {
      sql += ' AND character_name LIKE ?';
      params.push(`%${characterName}%`);
    }

    sql += ' ORDER BY character_name, costume_name, skill_name';

    return db.prepare(sql).all(...params) as SupportCardSkillResult[];
  } finally {
    db.close();
  }
}

/**
 * 効果バリアント検索結果
 */
export interface VariantSearchResult {
  skill_id: number;
  skill_name: string;
  skill_type: string;
  variant_id: number;
  variant_index: number;
  effect_order: number;
  is_demerit: number;
  trigger_condition_raw: string | null;
  activation_condition_raw: string | null;
  activation_condition_description: string | null;
  effect_params: string | null;
}

/**
 * 効果バリアント検索オプション
 */
export interface VariantSearchOptions {
  /** スキル名（部分一致） */
  name?: string;
  /** スキル種別 */
  type?: 'unique' | 'evolution' | 'normal';
  /** デメリット除外 */
  excludeDemerit?: boolean;
  /** 特定の発動順序のみ（0=1回目、1=2回目...） */
  effectOrder?: number;
  /** 多段発動のみ（effect_order >= 1 を持つスキル） */
  multiStageOnly?: boolean;
  /** パラメータ名 */
  parameterKey?: string;
  /** パラメータ最小値 */
  minValue?: number;
  /** パラメータ最大値 */
  maxValue?: number;
}

/**
 * 効果バリアントを検索
 * @param options 検索オプション
 * @param dbPath データベースパス
 * @returns 検索結果
 */
export function searchVariants(
  options: VariantSearchOptions = {},
  dbPath: string = DEFAULT_DB_PATH
): VariantSearchResult[] {
  const db = getDatabase(dbPath);

  try {
    let sql = 'SELECT * FROM skill_variants_view WHERE 1=1';
    const params: (string | number)[] = [];

    if (options.name) {
      sql += ' AND skill_name LIKE ?';
      params.push(`%${options.name}%`);
    }

    if (options.type) {
      sql += ' AND skill_type = ?';
      params.push(options.type);
    }

    if (options.excludeDemerit) {
      sql += ' AND is_demerit = 0';
    }

    if (options.effectOrder !== undefined) {
      sql += ' AND effect_order = ?';
      params.push(options.effectOrder);
    }

    if (options.parameterKey) {
      sql += ' AND effect_params LIKE ?';
      params.push(`%${options.parameterKey}%`);
    }

    sql += ' ORDER BY skill_name, effect_order, variant_index';

    let results = db.prepare(sql).all(...params) as VariantSearchResult[];

    // 多段発動のみフィルタリング（SQLで直接やると複雑なのでJS側で処理）
    if (options.multiStageOnly) {
      const multiStageSkillIds = new Set(
        results
          .filter(r => r.effect_order >= 1)
          .map(r => r.skill_id)
      );
      results = results.filter(r => multiStageSkillIds.has(r.skill_id));
    }

    return results;
  } finally {
    db.close();
  }
}

/**
 * 多段発動スキルを検索（effect_order >= 1 を持つスキル）
 * @param dbPath データベースパス
 * @returns 多段発動スキルのID一覧
 */
export function findMultiStageSkills(
  dbPath: string = DEFAULT_DB_PATH
): { skill_id: number; skill_name: string; max_effect_order: number }[] {
  const db = getDatabase(dbPath);

  try {
    const sql = `
      SELECT
        s.id AS skill_id,
        s.name AS skill_name,
        MAX(sev.effect_order) AS max_effect_order
      FROM skills s
      JOIN skill_effect_variants sev ON s.id = sev.skill_id
      GROUP BY s.id
      HAVING MAX(sev.effect_order) >= 1
      ORDER BY max_effect_order DESC, s.name
    `;

    return db.prepare(sql).all() as { skill_id: number; skill_name: string; max_effect_order: number }[];
  } finally {
    db.close();
  }
}

/**
 * デメリット効果を含むスキルを検索
 * @param dbPath データベースパス
 * @returns デメリット効果を含むスキル一覧
 */
export function findSkillsWithDemerit(
  dbPath: string = DEFAULT_DB_PATH
): VariantSearchResult[] {
  const db = getDatabase(dbPath);

  try {
    const sql = `
      SELECT * FROM skill_variants_view
      WHERE is_demerit = 1
      ORDER BY skill_name, effect_order, variant_index
    `;

    return db.prepare(sql).all() as VariantSearchResult[];
  } finally {
    db.close();
  }
}

// =============================================================================
// 高度なスキル検索（スキル検索スキル用）
// =============================================================================

/**
 * 作戦タイプ
 */
export type RunningStyle = 'nige' | 'senkou' | 'sashi' | 'oikomi' | 'none' | 'any';

/**
 * 距離タイプ
 */
export type DistanceType = 'short' | 'mile' | 'middle' | 'long' | 'none' | 'any';

/**
 * 発動フェーズ
 */
export type PhaseType = 'early' | 'mid' | 'late' | 'corner' | 'straight' | 'non_late' | 'any';

/**
 * 効果種別
 */
export type EffectType = 'speed' | 'accel' | 'stamina' | 'position' | 'debuff' | 'any';

/**
 * 順位条件（チャンミ換算）
 */
export type OrderRange = 'top1' | 'top2' | 'top4' | 'top6' | 'mid' | 'back' | 'any';

/**
 * スキルタイプ（大分類）
 */
export type SkillType = 'unique' | 'evolution' | 'normal' | 'any';

/**
 * スキル詳細タイプ（小分類）
 */
export type SkillSubTypeValue = 'unique' | 'inherited_unique' | 'gold' | 'normal' | 'evolution';
export type SkillSubType = SkillSubTypeValue | SkillSubTypeValue[] | 'any';

/**
 * バ場タイプ
 */
export type GroundType = 'turf' | 'dirt' | 'none' | 'any';

/**
 * 高度なスキル検索オプション
 */
export interface AdvancedSearchOptions {
  /** 作戦 */
  runningStyle?: RunningStyle;
  /** 距離 */
  distanceType?: DistanceType;
  /** 発動位置 */
  phase?: PhaseType;
  /** 効果種別 */
  effectType?: EffectType;
  /** 順位条件（チャンミ換算） */
  orderRange?: OrderRange;
  /** スキルタイプ（大分類） */
  skillType?: SkillType;
  /** スキル詳細タイプ（小分類） */
  skillSubType?: SkillSubType;
  /** バ場 */
  groundType?: GroundType;
  /** デメリット除外 */
  excludeDemerit?: boolean;
  /** スキル名（部分一致） */
  name?: string;
  /** 結果の上限 */
  limit?: number;
}

/**
 * 高度なスキル検索結果
 */
export interface AdvancedSearchResult {
  skill_id: number;
  skill_name: string;
  skill_type: string;
  skill_sub_type: string;
  description: string;
  evaluation_point: number;
  sp_cost: number | null;
  sp_total: number | null;
  support_card_full_name: string | null;
  variant_id: number;
  variant_index: number;
  effect_order: number;
  is_demerit: number;
  activation_condition_raw: string | null;
  activation_condition_description: string | null;
  running_style_flags: string;
  distance_flags: string;
  ground_flags: string;
  order_flags: string;
  phase_flags: string;
  effect_params: string | null;
}

/**
 * 作戦条件を生成（ビットフラグ方式）
 * スキル内のすべてのバリアントが指定作戦に対応している必要がある
 */
function buildRunningStyleCondition(style: RunningStyle): string | null {
  if (style === 'any') return null;

  // 作戦条件なしスキルのみ（全作戦対応 = 1111）
  if (style === 'none') {
    // スキル内のすべてのバリアントが 1111 であるスキルのみ
    return `s.id NOT IN (
      SELECT DISTINCT sev2.skill_id
      FROM skill_effect_variants sev2
      WHERE sev2.running_style_flags != '1111'
    )`;
  }

  // ビット位置: 1=逃げ, 2=先行, 3=差し, 4=追込
  const styleIndex: Record<Exclude<RunningStyle, 'any' | 'none'>, number> = {
    nige: 1,
    senkou: 2,
    sashi: 3,
    oikomi: 4,
  };

  const idx = styleIndex[style];
  // 指定作戦のビットが 0 のバリアントを持つスキルを除外
  return `s.id NOT IN (
    SELECT DISTINCT sev2.skill_id
    FROM skill_effect_variants sev2
    WHERE SUBSTR(sev2.running_style_flags, ${idx}, 1) = '0'
  )`;
}

/**
 * 距離条件を生成（ビットフラグ方式）
 * スキル内のすべてのバリアントが指定距離に対応している必要がある
 */
function buildDistanceTypeCondition(dist: DistanceType): string | null {
  if (dist === 'any') return null;

  // 距離条件なしスキルのみ（全距離対応 = 1111）
  if (dist === 'none') {
    return `s.id NOT IN (
      SELECT DISTINCT sev2.skill_id
      FROM skill_effect_variants sev2
      WHERE sev2.distance_flags != '1111'
    )`;
  }

  // ビット位置: 1=短距離, 2=マイル, 3=中距離, 4=長距離
  const distIndex: Record<Exclude<DistanceType, 'any' | 'none'>, number> = {
    short: 1,
    mile: 2,
    middle: 3,
    long: 4,
  };

  const idx = distIndex[dist];
  // 指定距離のビットが 0 のバリアントを持つスキルを除外
  return `s.id NOT IN (
    SELECT DISTINCT sev2.skill_id
    FROM skill_effect_variants sev2
    WHERE SUBSTR(sev2.distance_flags, ${idx}, 1) = '0'
  )`;
}

/**
 * フェーズ条件を生成（ビットフラグ方式）
 * phase_flags: 3桁（序盤/中盤/終盤）
 * スキル内のすべてのバリアントが指定フェーズに対応している必要がある
 */
function buildPhaseCondition(phase: PhaseType): string | null {
  if (phase === 'any') return null;

  // ビット位置: 1=序盤, 2=中盤, 3=終盤
  const phaseIndex: Record<string, number> = {
    early: 1,
    mid: 2,
    late: 3,
  };

  switch (phase) {
    case 'early':
    case 'mid':
    case 'late': {
      const idx = phaseIndex[phase];
      // 指定フェーズのビットが 0 のバリアントを持つスキルを除外
      return `s.id NOT IN (
        SELECT DISTINCT sev2.skill_id
        FROM skill_effect_variants sev2
        WHERE SUBSTR(sev2.phase_flags, ${idx}, 1) = '0'
      )`;
    }

    case 'non_late':
      // 終盤以外 = 序盤または中盤で発動可能（終盤ビットが0でもOK）
      // ただし終盤のみのスキル（001）は除外
      return `s.id NOT IN (
        SELECT DISTINCT sev2.skill_id
        FROM skill_effect_variants sev2
        WHERE sev2.phase_flags = '001'
      )`;

    case 'corner':
      // コーナー条件を含む
      return `(
        activation_condition_raw LIKE '%corner!=%'
        OR activation_condition_raw LIKE '%all_corner_random%'
        OR activation_condition_raw LIKE '%corner==%'
      )`;

    case 'straight':
      // 直線条件を含む
      return `(
        activation_condition_raw LIKE '%corner==0%'
        OR activation_condition_raw LIKE '%straight_random%'
      )`;

    default:
      return null;
  }
}

/**
 * 効果種別条件を生成
 */
function buildEffectTypeCondition(effectType: EffectType): string | null {
  if (effectType === 'any') return null;

  switch (effectType) {
    case 'speed':
      return `(
        effect_params LIKE '%targetSpeed%'
        OR effect_params LIKE '%currentSpeed%'
      )`;

    case 'accel':
      return `effect_params LIKE '%acceleration%'`;

    case 'stamina':
      return `effect_params LIKE '%hpRecovery%'`;

    case 'position':
      return `(
        effect_params LIKE '%positionKeep%'
        OR effect_params LIKE '%temptationDecay%'
      )`;

    case 'debuff':
      // デメリット効果
      return `is_demerit = 1`;

    default:
      return null;
  }
}

/**
 * 順位条件を生成（9人立てチャンミ換算、ビットフラグ方式）
 * スキル内のすべてのバリアントが指定順位に対応している必要がある
 */
function buildOrderRangeCondition(orderRange: OrderRange): string | null {
  if (orderRange === 'any') return null;

  // 指定順位に対応するビットパターン
  // order_flags: 9桁（1位〜9位）
  // topN: 1位〜N位のいずれかで発動可能であればOK
  const topPositions: Record<string, number[]> = {
    top1: [1],        // 1位のみ
    top2: [1, 2],     // 1〜2位
    top4: [1, 2, 3, 4],     // 1〜4位
    top6: [1, 2, 3, 4, 5, 6], // 1〜6位
  };

  if (orderRange in topPositions) {
    const positions = topPositions[orderRange];
    // 指定順位のいずれかでも発動できないバリアントを持つスキルを除外
    // つまり、指定順位すべてのビットが0のバリアントがあればNG
    const positionChecks = positions.map(p => `SUBSTR(sev2.order_flags, ${p}, 1) = '1'`).join(' OR ');
    return `s.id NOT IN (
      SELECT DISTINCT sev2.skill_id
      FROM skill_effect_variants sev2
      WHERE NOT (${positionChecks})
    )`;
  }

  switch (orderRange) {
    case 'mid':
      // 中団（4〜6位付近）- 4〜6位のいずれかで発動可能
      return `s.id NOT IN (
        SELECT DISTINCT sev2.skill_id
        FROM skill_effect_variants sev2
        WHERE NOT (
          SUBSTR(sev2.order_flags, 4, 1) = '1'
          OR SUBSTR(sev2.order_flags, 5, 1) = '1'
          OR SUBSTR(sev2.order_flags, 6, 1) = '1'
        )
      )`;

    case 'back':
      // 後方（6位以降）- 6〜9位のいずれかで発動可能
      return `s.id NOT IN (
        SELECT DISTINCT sev2.skill_id
        FROM skill_effect_variants sev2
        WHERE NOT (
          SUBSTR(sev2.order_flags, 6, 1) = '1'
          OR SUBSTR(sev2.order_flags, 7, 1) = '1'
          OR SUBSTR(sev2.order_flags, 8, 1) = '1'
          OR SUBSTR(sev2.order_flags, 9, 1) = '1'
        )
      )`;

    default:
      return null;
  }
}

/**
 * バ場条件を生成（ビットフラグ方式）
 * スキル内のすべてのバリアントが指定バ場に対応している必要がある
 */
function buildGroundTypeCondition(groundType: GroundType): string | null {
  if (groundType === 'any') return null;

  // バ場条件なしスキルのみ（全バ場対応 = 11）
  if (groundType === 'none') {
    return `s.id NOT IN (
      SELECT DISTINCT sev2.skill_id
      FROM skill_effect_variants sev2
      WHERE sev2.ground_flags != '11'
    )`;
  }

  // ビット位置: 1=芝, 2=ダート
  const groundIndex: Record<Exclude<GroundType, 'any' | 'none'>, number> = {
    turf: 1,
    dirt: 2,
  };

  const idx = groundIndex[groundType];
  // 指定バ場のビットが 0 のバリアントを持つスキルを除外
  return `s.id NOT IN (
    SELECT DISTINCT sev2.skill_id
    FROM skill_effect_variants sev2
    WHERE SUBSTR(sev2.ground_flags, ${idx}, 1) = '0'
  )`;
}

/**
 * 高度なスキル検索
 * @param options 検索オプション
 * @param dbPath データベースパス
 * @returns 検索結果
 */
export function advancedSearch(
  options: AdvancedSearchOptions = {},
  dbPath: string = DEFAULT_DB_PATH
): AdvancedSearchResult[] {
  const db = getDatabase(dbPath);

  try {
    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];

    // スキル名
    if (options.name) {
      conditions.push('s.name LIKE ?');
      params.push(`%${options.name}%`);
    }

    // スキルタイプ（大分類）
    if (options.skillType && options.skillType !== 'any') {
      conditions.push('s.type = ?');
      params.push(options.skillType);
    }

    // スキル詳細タイプ（小分類）- 配列対応
    if (options.skillSubType && options.skillSubType !== 'any') {
      const subTypes = Array.isArray(options.skillSubType)
        ? options.skillSubType
        : [options.skillSubType];
      const placeholders = subTypes.map(() => '?').join(', ');
      conditions.push(`s.sub_type IN (${placeholders})`);
      params.push(...subTypes);
    }

    // デメリット除外
    if (options.excludeDemerit) {
      conditions.push('sev.is_demerit = 0');
    }

    // 作戦条件
    const runningStyleCond = buildRunningStyleCondition(options.runningStyle || 'any');
    if (runningStyleCond) conditions.push(runningStyleCond);

    // 距離条件
    const distanceTypeCond = buildDistanceTypeCondition(options.distanceType || 'any');
    if (distanceTypeCond) conditions.push(distanceTypeCond);

    // フェーズ条件
    const phaseCond = buildPhaseCondition(options.phase || 'any');
    if (phaseCond) conditions.push(phaseCond);

    // 効果種別条件
    const effectTypeCond = buildEffectTypeCondition(options.effectType || 'any');
    if (effectTypeCond) conditions.push(effectTypeCond);

    // 順位条件
    const orderRangeCond = buildOrderRangeCondition(options.orderRange || 'any');
    if (orderRangeCond) conditions.push(orderRangeCond);

    // バ場条件
    const groundTypeCond = buildGroundTypeCondition(options.groundType || 'any');
    if (groundTypeCond) conditions.push(groundTypeCond);

    const sql = `
      SELECT
        s.id AS skill_id,
        s.name AS skill_name,
        s.type AS skill_type,
        s.sub_type AS skill_sub_type,
        s.description,
        s.evaluation_point,
        s.sp_cost,
        s.sp_total,
        sc.full_name AS support_card_full_name,
        sev.id AS variant_id,
        sev.variant_index,
        sev.effect_order,
        sev.is_demerit,
        sev.activation_condition_raw,
        sev.activation_condition_description,
        sev.running_style_flags,
        sev.distance_flags,
        sev.ground_flags,
        sev.order_flags,
        sev.phase_flags,
        (
          SELECT GROUP_CONCAT(vp.parameter_key || ':' || vp.parameter_value, ', ')
          FROM variant_parameters vp
          WHERE vp.variant_id = sev.id
        ) AS effect_params
      FROM skills s
      JOIN skill_effect_variants sev ON s.id = sev.skill_id
      LEFT JOIN support_cards sc ON s.support_card_id = sc.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY s.id, sev.id
      ORDER BY s.evaluation_point DESC, s.name, sev.effect_order, sev.variant_index
      ${options.limit ? `LIMIT ${options.limit}` : ''}
    `;

    return db.prepare(sql).all(...params) as AdvancedSearchResult[];
  } finally {
    db.close();
  }
}

/**
 * 統計情報を取得
 * @param dbPath データベースパス
 * @returns 統計情報
 */
export function getStatistics(dbPath: string = DEFAULT_DB_PATH): {
  totalSkills: number;
  totalSupportCards: number;
  skillsByType: { type: string; count: number }[];
  avgEvaluationPoint: number;
  totalVariants: number;
  multiStageSkillCount: number;
  demeritVariantCount: number;
} {
  const db = getDatabase(dbPath);

  try {
    const totalSkills = (db.prepare('SELECT COUNT(*) as count FROM skills').get() as { count: number }).count;
    const totalSupportCards = (db.prepare('SELECT COUNT(*) as count FROM support_cards').get() as { count: number }).count;
    const skillsByType = db.prepare('SELECT type, COUNT(*) as count FROM skills GROUP BY type').all() as { type: string; count: number }[];
    const avgEvaluationPoint = (db.prepare('SELECT AVG(evaluation_point) as avg FROM skills').get() as { avg: number }).avg;
    const totalVariants = (db.prepare('SELECT COUNT(*) as count FROM skill_effect_variants').get() as { count: number }).count;
    const multiStageSkillCount = (db.prepare(`
      SELECT COUNT(DISTINCT skill_id) as count
      FROM skill_effect_variants
      WHERE effect_order >= 1
    `).get() as { count: number }).count;
    const demeritVariantCount = (db.prepare('SELECT COUNT(*) as count FROM skill_effect_variants WHERE is_demerit = 1').get() as { count: number }).count;

    return {
      totalSkills,
      totalSupportCards,
      skillsByType,
      avgEvaluationPoint: Math.round(avgEvaluationPoint * 100) / 100,
      totalVariants,
      multiStageSkillCount,
      demeritVariantCount,
    };
  } finally {
    db.close();
  }
}
