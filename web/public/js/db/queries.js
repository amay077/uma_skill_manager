/**
 * クエリ関数モジュール
 */

import { query } from './init.js';

/**
 * 基本スキル検索
 * @param {object} options - 検索オプション
 * @returns {Promise<Array>} 検索結果
 */
export async function searchSkills(options = {}) {
  const conditions = ['1=1'];
  const params = [];

  // スキル名
  if (options.name) {
    conditions.push(`s.name LIKE '%${escapeSql(options.name)}%'`);
  }

  // スキル種別
  if (options.type) {
    conditions.push(`s.type = '${escapeSql(options.type)}'`);
  }

  // 評価点範囲
  if (options.minEvaluationPoint !== undefined && options.minEvaluationPoint !== '') {
    conditions.push(`s.evaluation_point >= ${parseInt(options.minEvaluationPoint, 10)}`);
  }
  if (options.maxEvaluationPoint !== undefined && options.maxEvaluationPoint !== '') {
    conditions.push(`s.evaluation_point <= ${parseInt(options.maxEvaluationPoint, 10)}`);
  }

  const sql = `
    SELECT
      s.id,
      s.name,
      s.type,
      s.sub_type,
      s.description,
      s.evaluation_point,
      s.condition_raw,
      s.condition_description,
      sc.full_name AS support_card_full_name
    FROM skills s
    LEFT JOIN support_cards sc ON s.support_card_id = sc.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY s.evaluation_point DESC, s.name
    LIMIT ${options.limit || 1000}
    OFFSET ${options.offset || 0}
  `;

  return query(sql);
}

/**
 * スキル件数を取得
 * @param {object} options - 検索オプション
 * @returns {Promise<number>} 件数
 */
export async function countSkills(options = {}) {
  const conditions = ['1=1'];

  if (options.name) {
    conditions.push(`s.name LIKE '%${escapeSql(options.name)}%'`);
  }
  if (options.type) {
    conditions.push(`s.type = '${escapeSql(options.type)}'`);
  }
  if (options.minEvaluationPoint !== undefined && options.minEvaluationPoint !== '') {
    conditions.push(`s.evaluation_point >= ${parseInt(options.minEvaluationPoint, 10)}`);
  }
  if (options.maxEvaluationPoint !== undefined && options.maxEvaluationPoint !== '') {
    conditions.push(`s.evaluation_point <= ${parseInt(options.maxEvaluationPoint, 10)}`);
  }

  const sql = `
    SELECT COUNT(*) as count
    FROM skills s
    WHERE ${conditions.join(' AND ')}
  `;

  const result = await query(sql);
  return result[0]?.count || 0;
}

/**
 * 詳細スキル検索（効果バリアントベース）
 * @param {object} options - 検索オプション
 * @returns {Promise<Array>} 検索結果
 */
export async function advancedSearch(options = {}) {
  const conditions = ['1=1'];

  // スキル名
  if (options.name) {
    conditions.push(`s.name LIKE '%${escapeSql(options.name)}%'`);
  }

  // スキル種別（配列対応）
  const typeCondition = buildTypeCondition(options.types);
  if (typeCondition) {
    conditions.push(typeCondition);
  }

  // 評価点範囲
  if (options.minEvaluationPoint !== undefined && options.minEvaluationPoint !== '') {
    conditions.push(`s.evaluation_point >= ${parseInt(options.minEvaluationPoint, 10)}`);
  }
  if (options.maxEvaluationPoint !== undefined && options.maxEvaluationPoint !== '') {
    conditions.push(`s.evaluation_point <= ${parseInt(options.maxEvaluationPoint, 10)}`);
  }

  // デメリット除外
  if (options.excludeDemerit) {
    conditions.push('sev.is_demerit = 0');
  }

  // 作戦条件（ビットフラグ）
  const styleCondition = buildBitFlagCondition(options.runningStyles, 'running_style_flags', 4);
  if (styleCondition) conditions.push(styleCondition);

  // 距離条件（ビットフラグ）
  const distCondition = buildBitFlagCondition(options.distances, 'distance_flags', 4);
  if (distCondition) conditions.push(distCondition);

  // バ場条件（ビットフラグ）
  const groundCondition = buildBitFlagCondition(options.grounds, 'ground_flags', 2);
  if (groundCondition) conditions.push(groundCondition);

  // フェーズ条件（ビットフラグ）
  const phaseCondition = buildBitFlagCondition(options.phases, 'phase_flags', 3);
  if (phaseCondition) conditions.push(phaseCondition);

  // 効果種別条件（配列対応、OR検索）
  const effectCondition = buildEffectTypesCondition(options.effectTypes);
  if (effectCondition) conditions.push(effectCondition);

  // 順位条件（個別チェックボックス対応）
  const orderCondition = buildOrdersCondition(options.orders);
  if (orderCondition) conditions.push(orderCondition);

  const sql = `
    SELECT DISTINCT
      s.id,
      s.name,
      s.type,
      s.sub_type,
      s.description,
      s.evaluation_point,
      s.condition_raw,
      s.condition_description,
      sc.full_name AS support_card_full_name,
      sev.running_style_flags,
      sev.distance_flags,
      sev.ground_flags,
      sev.phase_flags,
      sev.order_flags,
      (
        SELECT GROUP_CONCAT(vp.parameter_key || ':' || vp.parameter_value, ',')
        FROM variant_parameters vp
        WHERE vp.variant_id = sev.id
      ) AS effect_params,
      COALESCE(
        (SELECT vp1.parameter_value FROM variant_parameters vp1 WHERE vp1.variant_id = sev.id AND vp1.parameter_key = 'targetSpeed'),
        (SELECT vp2.parameter_value FROM variant_parameters vp2 WHERE vp2.variant_id = sev.id AND vp2.parameter_key = 'currentSpeed'),
        (SELECT vp3.parameter_value FROM variant_parameters vp3 WHERE vp3.variant_id = sev.id AND vp3.parameter_key = 'acceleration'),
        (SELECT vp4.parameter_value FROM variant_parameters vp4 WHERE vp4.variant_id = sev.id AND vp4.parameter_key = 'hpRecovery'),
        0
      ) AS effect_value,
      COALESCE((SELECT vp5.parameter_value FROM variant_parameters vp5 WHERE vp5.variant_id = sev.id AND vp5.parameter_key = 'duration'), 1) AS effect_duration
    FROM skills s
    JOIN skill_effect_variants sev ON s.id = sev.skill_id
    LEFT JOIN support_cards sc ON s.support_card_id = sc.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY (effect_value * effect_duration) DESC, s.evaluation_point DESC, s.name
    LIMIT ${options.limit || 1000}
    OFFSET ${options.offset || 0}
  `;

  return query(sql);
}

/**
 * 詳細検索の件数を取得
 * @param {object} options - 検索オプション
 * @returns {Promise<number>} 件数
 */
export async function countAdvancedSearch(options = {}) {
  const conditions = ['1=1'];

  if (options.name) {
    conditions.push(`s.name LIKE '%${escapeSql(options.name)}%'`);
  }
  const typeCondition = buildTypeCondition(options.types);
  if (typeCondition) {
    conditions.push(typeCondition);
  }
  if (options.minEvaluationPoint !== undefined && options.minEvaluationPoint !== '') {
    conditions.push(`s.evaluation_point >= ${parseInt(options.minEvaluationPoint, 10)}`);
  }
  if (options.maxEvaluationPoint !== undefined && options.maxEvaluationPoint !== '') {
    conditions.push(`s.evaluation_point <= ${parseInt(options.maxEvaluationPoint, 10)}`);
  }
  if (options.excludeDemerit) {
    conditions.push('sev.is_demerit = 0');
  }

  const styleCondition = buildBitFlagCondition(options.runningStyles, 'running_style_flags', 4);
  if (styleCondition) conditions.push(styleCondition);

  const distCondition = buildBitFlagCondition(options.distances, 'distance_flags', 4);
  if (distCondition) conditions.push(distCondition);

  const groundCondition = buildBitFlagCondition(options.grounds, 'ground_flags', 2);
  if (groundCondition) conditions.push(groundCondition);

  const phaseCondition = buildBitFlagCondition(options.phases, 'phase_flags', 3);
  if (phaseCondition) conditions.push(phaseCondition);

  const effectCondition = buildEffectTypesCondition(options.effectTypes);
  if (effectCondition) conditions.push(effectCondition);

  const orderCondition = buildOrdersCondition(options.orders);
  if (orderCondition) conditions.push(orderCondition);

  const sql = `
    SELECT COUNT(DISTINCT s.id) as count
    FROM skills s
    JOIN skill_effect_variants sev ON s.id = sev.skill_id
    WHERE ${conditions.join(' AND ')}
  `;

  const result = await query(sql);
  return result[0]?.count || 0;
}

/**
 * スキルの効果バリアント情報を取得
 * @param {number} skillId - スキル ID
 * @returns {Promise<Array>} バリアント情報
 */
export async function getSkillVariants(skillId) {
  const sql = `
    SELECT
      sev.variant_index,
      sev.effect_order,
      sev.is_demerit,
      sev.running_style_flags,
      sev.distance_flags,
      sev.ground_flags,
      sev.phase_flags,
      sev.order_flags,
      sev.activation_condition_raw,
      sev.activation_condition_description
    FROM skill_effect_variants sev
    WHERE sev.skill_id = ${parseInt(skillId, 10)}
    ORDER BY sev.effect_order, sev.variant_index
  `;

  return query(sql);
}

// ヘルパー関数

/**
 * SQL インジェクション対策
 */
function escapeSql(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/'/g, "''");
}

/**
 * 種別条件を生成（sub_type ベース）
 * 全チェック ON = 全チェック OFF → 全種別検索（条件なし）
 * 一部チェック → OR 検索
 * @param {Array<string>} subTypes - 種別配列 ['evolution', 'unique', 'inherited_unique', 'gold', 'normal']
 * @returns {string|null} SQL 条件
 */
function buildTypeCondition(subTypes) {
  // 全 5 種類チェック ON = 全チェック OFF → 条件なし
  if (!subTypes || subTypes.length === 0 || subTypes.length === 5) {
    return null;
  }

  // sub_type で判定
  const escaped = subTypes.map(t => `'${escapeSql(t)}'`).join(', ');
  return `s.sub_type IN (${escaped})`;
}

/**
 * ビットフラグ条件を生成（統一ロジック）
 * 全チェック ON = 全チェック OFF → 条件なし（全スキル対象）
 * 一部チェック → チェックされたビット位置が 1 のスキルを OR 検索
 * @param {Array<string>} values - 選択された値の配列
 * @param {string} flagColumn - フラグカラム名
 * @param {number} flagLength - フラグの桁数
 * @returns {string|null} SQL 条件
 */
function buildBitFlagCondition(values, flagColumn, flagLength) {
  // 値のインデックスマッピング
  const indexMaps = {
    running_style_flags: { nige: 1, senkou: 2, sashi: 3, oikomi: 4 },
    distance_flags: { short: 1, mile: 2, middle: 3, long: 4 },
    ground_flags: { turf: 1, dirt: 2 },
    phase_flags: { early: 1, mid: 2, late: 3 },
  };

  const indexMap = indexMaps[flagColumn];
  if (!indexMap) return null;

  // 全チェック ON = 全チェック OFF → 条件なし（全スキル対象）
  if (!values || values.length === 0 || values.length === flagLength) {
    return null;
  }

  // 一部チェック → チェックされたビット位置が 1 のスキルを OR 検索
  const orConditions = values.map(v => {
    const idx = indexMap[v];
    if (!idx) return null;
    return `SUBSTR(sev.${flagColumn}, ${idx}, 1) = '1'`;
  }).filter(Boolean);

  if (orConditions.length === 0) return null;
  return `(${orConditions.join(' OR ')})`;
}

/**
 * 効果種別条件を生成（配列対応、OR検索）
 * 全チェック ON = 全チェック OFF → 全効果種別検索（条件なし）
 * 一部チェック → OR 検索
 * @param {Array<string>} effectTypes - 効果種別配列
 * @returns {string|null} SQL 条件
 */
function buildEffectTypesCondition(effectTypes) {
  if (!effectTypes || effectTypes.length === 0 || effectTypes.length === 5) {
    // 全チェック ON = 全チェック OFF → 条件なし
    return null;
  }

  const orConditions = effectTypes.map(effectType => {
    switch (effectType) {
      case 'speed':
        return `EXISTS (
          SELECT 1 FROM variant_parameters vp
          WHERE vp.variant_id = sev.id
          AND (vp.parameter_key LIKE '%targetSpeed%' OR vp.parameter_key LIKE '%currentSpeed%')
        )`;
      case 'accel':
        return `EXISTS (
          SELECT 1 FROM variant_parameters vp
          WHERE vp.variant_id = sev.id
          AND vp.parameter_key LIKE '%acceleration%'
        )`;
      case 'stamina':
        return `EXISTS (
          SELECT 1 FROM variant_parameters vp
          WHERE vp.variant_id = sev.id
          AND vp.parameter_key LIKE '%hpRecovery%'
        )`;
      case 'position':
        return `EXISTS (
          SELECT 1 FROM variant_parameters vp
          WHERE vp.variant_id = sev.id
          AND (vp.parameter_key LIKE '%positionKeep%' OR vp.parameter_key LIKE '%temptationDecay%')
        )`;
      case 'debuff':
        return 'sev.is_demerit = 1';
      default:
        return null;
    }
  }).filter(Boolean);

  if (orConditions.length === 0) return null;
  return `(${orConditions.join(' OR ')})`;
}

/**
 * 順位条件を生成（個別チェックボックス対応）
 * 全チェック ON = 全チェック OFF → 条件なし（全スキル対象）
 * 一部チェック → チェックされた順位のビット位置が 1 のスキルを OR 検索
 * @param {Array<string>} orders - 順位配列 ['1', '2', '3', ...]
 * @returns {string|null} SQL 条件
 */
function buildOrdersCondition(orders) {
  // 全チェック ON = 全チェック OFF → 条件なし（全スキル対象）
  if (!orders || orders.length === 0 || orders.length === 9) {
    return null;
  }

  // 一部チェック → チェックされた順位のビット位置が 1 のスキルを OR 検索
  const orConditions = orders.map(o => {
    const pos = parseInt(o, 10);
    if (pos < 1 || pos > 9) return null;
    return `SUBSTR(sev.order_flags, ${pos}, 1) = '1'`;
  }).filter(Boolean);

  if (orConditions.length === 0) return null;
  return `(${orConditions.join(' OR ')})`;
}
