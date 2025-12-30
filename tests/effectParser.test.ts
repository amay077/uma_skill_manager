import { describe, it, expect } from 'vitest';
import { parseEffectParameters } from '../src/parser/effectParser.js';

describe('parseEffectParameters', () => {
  it('should parse targetSpeed and duration', () => {
    const result = parseEffectParameters('「距離割合50～60」、目標速度1500、持続6.0');
    expect(result.parameters.targetSpeed).toBe(1500);
    expect(result.parameters.duration).toBe(6.0);
    expect(result.conditionDescription).toBe('距離割合50～60');
  });

  it('should parse acceleration', () => {
    const result = parseEffectParameters('「...」、目標速度1500、加速2000、持続5.0');
    expect(result.parameters.targetSpeed).toBe(1500);
    expect(result.parameters.acceleration).toBe(2000);
    expect(result.parameters.duration).toBe(5.0);
  });

  it('should parse hpRecovery', () => {
    const result = parseEffectParameters('「条件」、体力350、目標速度1500');
    expect(result.parameters.hpRecovery).toBe(350);
    expect(result.parameters.targetSpeed).toBe(1500);
  });

  it('should parse hpRecovery with 体力回復', () => {
    const result = parseEffectParameters('「条件」、体力回復100');
    expect(result.parameters.hpRecovery).toBe(100);
  });

  it('should handle missing condition description', () => {
    const result = parseEffectParameters('目標速度1500、持続6.0');
    expect(result.parameters.targetSpeed).toBe(1500);
    expect(result.parameters.duration).toBe(6.0);
    expect(result.conditionDescription).toBeUndefined();
  });
});
