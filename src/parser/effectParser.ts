import type { EffectParameter } from '../types/index.js';

/**
 * 効果パラメータ行をパースする
 * 例: "「条件説明」、目標速度1500、加速2000、持続6.0"
 */
export function parseEffectParameters(line: string): {
  parameters: EffectParameter;
  conditionDescription?: string;
} {
  const parameters: EffectParameter = {};
  let conditionDescription: string | undefined;

  // 「」で囲まれた条件説明を抽出
  const descMatch = line.match(/「([^」]+)」/);
  if (descMatch) {
    conditionDescription = descMatch[1];
  }

  // パラメータパターン
  const patterns: { pattern: RegExp; key: keyof EffectParameter }[] = [
    { pattern: /目標速度(\d+(?:\.\d+)?)/, key: 'targetSpeed' },
    { pattern: /加速(\d+(?:\.\d+)?)/, key: 'acceleration' },
    { pattern: /持続(\d+(?:\.\d+)?)/, key: 'duration' },
    { pattern: /体力(\d+(?:\.\d+)?)/, key: 'hpRecovery' },
    { pattern: /体力回復(\d+(?:\.\d+)?)/, key: 'hpRecovery' },
  ];

  for (const { pattern, key } of patterns) {
    const match = line.match(pattern);
    if (match) {
      parameters[key] = parseFloat(match[1]);
    }
  }

  return { parameters, conditionDescription };
}
