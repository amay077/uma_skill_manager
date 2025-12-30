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
 * 統計情報を取得
 * @param dbPath データベースパス
 * @returns 統計情報
 */
export function getStatistics(dbPath: string = DEFAULT_DB_PATH): {
  totalSkills: number;
  totalSupportCards: number;
  skillsByType: { type: string; count: number }[];
  avgEvaluationPoint: number;
} {
  const db = getDatabase(dbPath);

  try {
    const totalSkills = (db.prepare('SELECT COUNT(*) as count FROM skills').get() as { count: number }).count;
    const totalSupportCards = (db.prepare('SELECT COUNT(*) as count FROM support_cards').get() as { count: number }).count;
    const skillsByType = db.prepare('SELECT type, COUNT(*) as count FROM skills GROUP BY type').all() as { type: string; count: number }[];
    const avgEvaluationPoint = (db.prepare('SELECT AVG(evaluation_point) as avg FROM skills').get() as { avg: number }).avg;

    return {
      totalSkills,
      totalSupportCards,
      skillsByType,
      avgEvaluationPoint: Math.round(avgEvaluationPoint * 100) / 100,
    };
  } finally {
    db.close();
  }
}
