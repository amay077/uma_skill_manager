import type { Condition, AndConditionGroup, SingleCondition } from '../types/index.js';

/**
 * 単一条件式をパースする
 * 例: "distance_rate>=50" -> { variable: "distance_rate", operator: ">=", value: 50 }
 */
export function parseSingleCondition(expr: string): SingleCondition | null {
  // 演算子の優先順位: >=, <=, ==, !=, >, <
  const operatorPattern = /(>=|<=|==|!=|>|<)/;
  const match = expr.match(operatorPattern);

  if (!match) {
    return null;
  }

  const operator = match[1];
  const parts = expr.split(operatorPattern);

  if (parts.length < 3) {
    return null;
  }

  const variable = parts[0].trim();
  const valueStr = parts[2].trim();
  const value = parseFloat(valueStr);

  if (isNaN(value)) {
    return null;
  }

  return { variable, operator, value };
}

/**
 * AND 条件グループをパースする
 * 例: "distance_rate>=50&distance_rate<=60" -> AndConditionGroup
 */
export function parseAndGroup(expr: string): AndConditionGroup {
  const conditions: SingleCondition[] = [];
  const parts = expr.split('&');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed) {
      const condition = parseSingleCondition(trimmed);
      if (condition) {
        conditions.push(condition);
      }
    }
  }

  return { type: 'and', conditions };
}

/**
 * 発動条件式全体をパースする
 * 例: "->distance_rate>=50&order_rate>50@distance_rate>=60" -> Condition
 */
export function parseCondition(rawCondition: string): Condition | undefined {
  // -> プレフィックスを除去
  let expr = rawCondition.trim();
  if (expr.startsWith('->')) {
    expr = expr.substring(2);
  }

  if (!expr) {
    return undefined;
  }

  // @ で OR グループに分割
  const orParts = expr.split('@');
  const groups: AndConditionGroup[] = [];

  for (const orPart of orParts) {
    const trimmed = orPart.trim();
    if (trimmed) {
      const group = parseAndGroup(trimmed);
      if (group.conditions.length > 0) {
        groups.push(group);
      }
    }
  }

  if (groups.length === 0) {
    return undefined;
  }

  return { type: 'or', groups };
}
