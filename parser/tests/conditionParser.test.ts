import { describe, it, expect } from 'vitest';
import { parseSingleCondition, parseAndGroup, parseCondition } from '../parser/conditionParser.js';

describe('parseSingleCondition', () => {
  it('should parse >= condition', () => {
    const result = parseSingleCondition('distance_rate>=50');
    expect(result).toEqual({
      variable: 'distance_rate',
      operator: '>=',
      value: 50,
    });
  });

  it('should parse <= condition', () => {
    const result = parseSingleCondition('order_rate<=60');
    expect(result).toEqual({
      variable: 'order_rate',
      operator: '<=',
      value: 60,
    });
  });

  it('should parse == condition', () => {
    const result = parseSingleCondition('phase==2');
    expect(result).toEqual({
      variable: 'phase',
      operator: '==',
      value: 2,
    });
  });

  it('should parse > condition', () => {
    const result = parseSingleCondition('order_rate>50');
    expect(result).toEqual({
      variable: 'order_rate',
      operator: '>',
      value: 50,
    });
  });

  it('should return null for invalid expression', () => {
    const result = parseSingleCondition('invalid');
    expect(result).toBeNull();
  });
});

describe('parseAndGroup', () => {
  it('should parse multiple AND conditions', () => {
    const result = parseAndGroup('distance_rate>=50&distance_rate<=60&order_rate>50');
    expect(result.type).toBe('and');
    expect(result.conditions).toHaveLength(3);
    expect(result.conditions[0]).toEqual({
      variable: 'distance_rate',
      operator: '>=',
      value: 50,
    });
    expect(result.conditions[1]).toEqual({
      variable: 'distance_rate',
      operator: '<=',
      value: 60,
    });
    expect(result.conditions[2]).toEqual({
      variable: 'order_rate',
      operator: '>',
      value: 50,
    });
  });

  it('should parse single condition as AND group', () => {
    const result = parseAndGroup('distance_rate>=50');
    expect(result.type).toBe('and');
    expect(result.conditions).toHaveLength(1);
  });
});

describe('parseCondition', () => {
  it('should parse condition with -> prefix', () => {
    const result = parseCondition('->distance_rate>=50&order_rate>50');
    expect(result).toBeDefined();
    expect(result?.type).toBe('or');
    expect(result?.groups).toHaveLength(1);
    expect(result?.groups[0].conditions).toHaveLength(2);
  });

  it('should parse OR conditions', () => {
    const result = parseCondition('->order>=3&order_rate<=50@order>=3&remain_distance<=200');
    expect(result).toBeDefined();
    expect(result?.type).toBe('or');
    expect(result?.groups).toHaveLength(2);
    expect(result?.groups[0].conditions).toHaveLength(2);
    expect(result?.groups[1].conditions).toHaveLength(2);
  });

  it('should return undefined for empty condition', () => {
    const result = parseCondition('');
    expect(result).toBeUndefined();
  });
});
