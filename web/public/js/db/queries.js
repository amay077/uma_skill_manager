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

  // デメリット除外
  if (options.excludeDemerit) {
    conditions.push('sev.is_demerit = 0');
  }

  // 作戦条件
  if (options.runningStyle && options.runningStyle !== 'any') {
    const styleCondition = buildRunningStyleCondition(options.runningStyle);
    if (styleCondition) conditions.push(styleCondition);
  }

  // 距離条件
  if (options.distanceType && options.distanceType !== 'any') {
    const distCondition = buildDistanceTypeCondition(options.distanceType);
    if (distCondition) conditions.push(distCondition);
  }

  // バ場条件
  if (options.groundType && options.groundType !== 'any') {
    const groundCondition = buildGroundTypeCondition(options.groundType);
    if (groundCondition) conditions.push(groundCondition);
  }

  // フェーズ条件
  if (options.phase && options.phase !== 'any') {
    const phaseCondition = buildPhaseCondition(options.phase);
    if (phaseCondition) conditions.push(phaseCondition);
  }

  // 効果種別条件
  if (options.effectType && options.effectType !== 'any') {
    const effectCondition = buildEffectTypeCondition(options.effectType);
    if (effectCondition) conditions.push(effectCondition);
  }

  // 順位条件
  if (options.orderRange && options.orderRange !== 'any') {
    const orderCondition = buildOrderRangeCondition(options.orderRange);
    if (orderCondition) conditions.push(orderCondition);
  }

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
      sev.order_flags
    FROM skills s
    JOIN skill_effect_variants sev ON s.id = sev.skill_id
    LEFT JOIN support_cards sc ON s.support_card_id = sc.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY s.evaluation_point DESC, s.name
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
  if (options.type) {
    conditions.push(`s.type = '${escapeSql(options.type)}'`);
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
  if (options.runningStyle && options.runningStyle !== 'any') {
    const cond = buildRunningStyleCondition(options.runningStyle);
    if (cond) conditions.push(cond);
  }
  if (options.distanceType && options.distanceType !== 'any') {
    const cond = buildDistanceTypeCondition(options.distanceType);
    if (cond) conditions.push(cond);
  }
  if (options.groundType && options.groundType !== 'any') {
    const cond = buildGroundTypeCondition(options.groundType);
    if (cond) conditions.push(cond);
  }
  if (options.phase && options.phase !== 'any') {
    const cond = buildPhaseCondition(options.phase);
    if (cond) conditions.push(cond);
  }
  if (options.effectType && options.effectType !== 'any') {
    const cond = buildEffectTypeCondition(options.effectType);
    if (cond) conditions.push(cond);
  }
  if (options.orderRange && options.orderRange !== 'any') {
    const cond = buildOrderRangeCondition(options.orderRange);
    if (cond) conditions.push(cond);
  }

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
 * 作戦条件を生成
 */
function buildRunningStyleCondition(style) {
  const styleIndex = { nige: 1, senkou: 2, sashi: 3, oikomi: 4 };
  const idx = styleIndex[style];
  if (!idx) return null;
  return `SUBSTR(sev.running_style_flags, ${idx}, 1) = '1'`;
}

/**
 * 距離条件を生成
 */
function buildDistanceTypeCondition(dist) {
  const distIndex = { short: 1, mile: 2, middle: 3, long: 4 };
  const idx = distIndex[dist];
  if (!idx) return null;
  return `SUBSTR(sev.distance_flags, ${idx}, 1) = '1'`;
}

/**
 * バ場条件を生成
 */
function buildGroundTypeCondition(ground) {
  const groundIndex = { turf: 1, dirt: 2 };
  const idx = groundIndex[ground];
  if (!idx) return null;
  return `SUBSTR(sev.ground_flags, ${idx}, 1) = '1'`;
}

/**
 * フェーズ条件を生成
 */
function buildPhaseCondition(phase) {
  const phaseIndex = { early: 1, mid: 2, late: 3 };
  const idx = phaseIndex[phase];
  if (!idx) return null;
  return `SUBSTR(sev.phase_flags, ${idx}, 1) = '1'`;
}

/**
 * 効果種別条件を生成
 */
function buildEffectTypeCondition(effectType) {
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
}

/**
 * 順位条件を生成
 */
function buildOrderRangeCondition(orderRange) {
  const positions = {
    top1: [1],
    top2: [1, 2],
    top4: [1, 2, 3, 4],
    top6: [1, 2, 3, 4, 5, 6],
    mid: [4, 5, 6],
    back: [6, 7, 8, 9],
  };

  const pos = positions[orderRange];
  if (!pos) return null;

  const checks = pos.map(p => `SUBSTR(sev.order_flags, ${p}, 1) = '1'`).join(' OR ');
  return `(${checks})`;
}
