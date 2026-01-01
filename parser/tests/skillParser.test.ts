import { describe, it, expect } from 'vitest';
import { parseSkillData } from '../parser/skillParser.js';

describe('parseSkillData', () => {
  it('should parse unique skill', () => {
    const input = `波乱注意砲！
[レッドストライフ]ゴールドシップ 固有
レース中間付近で後方にいるとロングスパートをかけて速度をわずかに上げ続ける
評価点240、人気:スピード30、確定発動
->distance_rate>=50&distance_rate<=60&order_rate>50
「距離割合50～60、順位率50より大」、目標速度1500、持続6.0`;

    const result = parseSkillData(input);

    expect(result.skills).toHaveLength(1);
    expect(result.failedBlocks).toBe(0);

    const skill = result.skills[0];
    expect(skill.name).toBe('波乱注意砲！');
    expect(skill.supportCard?.costumeName).toBe('レッドストライフ');
    expect(skill.supportCard?.characterName).toBe('ゴールドシップ');
    expect(skill.type).toBe('unique');
    expect(skill.evaluationPoint).toBe(240);
    expect(skill.popularity).toBe('スピード30');
    expect(skill.triggerType).toBe('確定発動');
    expect(skill.effectParameters.targetSpeed).toBe(1500);
    expect(skill.effectParameters.duration).toBe(6.0);
    expect(skill.condition?.type).toBe('or');
    expect(skill.condition?.groups[0].conditions).toHaveLength(3);
  });

  it('should parse evolution skill', () => {
    const input = `進化スキル名
[衣装名]キャラ名 進化(元スキル)
効果説明文
評価点100、人気:パワー20、確定発動
->phase>=2
「条件」、目標速度1000`;

    const result = parseSkillData(input);

    expect(result.skills).toHaveLength(1);
    const skill = result.skills[0];
    expect(skill.type).toBe('evolution');
    expect(skill.baseSkillName).toBe('元スキル');
  });

  it('should parse normal skill (no support card)', () => {
    const input = `通常スキル
レア
効果説明
評価点50、ランダム発動
->phase==1
「条件」、目標速度500`;

    const result = parseSkillData(input);

    expect(result.skills).toHaveLength(1);
    const skill = result.skills[0];
    expect(skill.type).toBe('normal');
    expect(skill.supportCard).toBeNull();
  });

  it('should handle multiple skills', () => {
    const input = `スキル1
[衣装1]キャラ1 固有
説明1
評価点100

スキル2
[衣装2]キャラ2 固有
説明2
評価点200`;

    const result = parseSkillData(input);

    expect(result.skills).toHaveLength(2);
    expect(result.supportCards).toHaveLength(2);
    expect(result.skills[0].name).toBe('スキル1');
    expect(result.skills[1].name).toBe('スキル2');
  });

  it('should extract unique support cards', () => {
    const input = `スキル1
[衣装A]キャラA 固有
説明1
評価点100

スキル2
[衣装A]キャラA 固有
説明2
評価点200`;

    const result = parseSkillData(input);

    expect(result.skills).toHaveLength(2);
    expect(result.supportCards).toHaveLength(1); // 重複除去
    expect(result.supportCards[0].fullName).toBe('[衣装A]キャラA');
  });

  it('should handle empty input', () => {
    const result = parseSkillData('');
    expect(result.skills).toHaveLength(0);
    expect(result.supportCards).toHaveLength(0);
  });

  it('should skip invalid blocks with warning', () => {
    const input = `不正なブロック

正常なスキル
[衣装]キャラ 固有
説明
評価点100`;

    const result = parseSkillData(input);

    expect(result.skills).toHaveLength(1);
    expect(result.failedBlocks).toBe(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.skills[0].name).toBe('正常なスキル');
  });

  it('should parse effectVariants for single effect', () => {
    const input = `波乱注意砲！
[レッドストライフ]ゴールドシップ 固有
レース中間付近で後方にいるとロングスパートをかけて速度をわずかに上げ続ける
評価点240、人気:スピード30、確定発動
->distance_rate>=50&distance_rate<=60&order_rate>50
「距離割合50～60、順位率50より大」、目標速度1500、持続6.0`;

    const result = parseSkillData(input);
    const skill = result.skills[0];

    expect(skill.effectVariants).toBeDefined();
    expect(skill.effectVariants).toHaveLength(1);
    expect(skill.effectVariants![0].variantIndex).toBe(0);
    expect(skill.effectVariants![0].effectOrder).toBe(0);
    expect(skill.effectVariants![0].isDemerit).toBe(false);
    expect(skill.effectVariants![0].effectParameters.targetSpeed).toBe(1500);
  });

  it('should parse chained activation (A->B format)', () => {
    const input = `全力Vサインッ！
[Go To Winning!]ウイニングチケット 固有
最終コーナー以降に競り合っていると最終直線で前方にいる時強い気持ちが湧き速度が少し上がる
評価点240、人気:スピード30、確定発動
is_finalcorner==1&blocked_side_continuetime>=2->is_last_straight==1&order<=5
「最終コーナー以降、横ブロック継続>=2」の後「最終直線、順位<=5」、目標速度2500、持続5.0`;

    const result = parseSkillData(input);
    const skill = result.skills[0];

    expect(skill.effectVariants).toBeDefined();
    expect(skill.effectVariants![0].triggerConditionRaw).toBe('is_finalcorner==1&blocked_side_continuetime>=2');
    expect(skill.effectVariants![0].activationConditionRaw).toBe('is_last_straight==1&order<=5');
  });

  it('should parse normal skill without support card (コーナー巧者○ format)', () => {
    const input = `コーナー巧者○
コーナーが得意になり速度がわずかに上がる
評価点217、SP180、人気:スピード20
->all_corner_random==1
「全コーナーからランダム」、目標速度1500、持続2.4`;

    const result = parseSkillData(input);

    expect(result.skills).toHaveLength(1);
    expect(result.failedBlocks).toBe(0);

    const skill = result.skills[0];
    expect(skill.name).toBe('コーナー巧者○');
    expect(skill.supportCard).toBeNull();
    expect(skill.type).toBe('normal');
    expect(skill.description).toBe('コーナーが得意になり速度がわずかに上がる');
    expect(skill.evaluationPoint).toBe(217);
    expect(skill.popularity).toBe('スピード20');

    // effectVariants が正しく生成されること
    expect(skill.effectVariants).toBeDefined();
    expect(skill.effectVariants).toHaveLength(1);
    expect(skill.effectVariants![0].activationConditionRaw).toBe('all_corner_random==1');
    expect(skill.effectVariants![0].effectParameters.targetSpeed).toBe(1500);
    expect(skill.effectVariants![0].effectParameters.duration).toBe(2.4);
  });

  it('should always generate at least one effectVariant for skills with condition/effect lines', () => {
    // サポカありスキル
    const inputWithSupport = `テストスキル
[衣装]キャラ 固有
説明文
評価点100
->phase==1
「条件」、目標速度1000`;

    const resultWithSupport = parseSkillData(inputWithSupport);
    expect(resultWithSupport.skills[0].effectVariants).toBeDefined();
    expect(resultWithSupport.skills[0].effectVariants!.length).toBeGreaterThanOrEqual(1);

    // サポカなしスキル
    const inputWithoutSupport = `テストスキル2
説明文
評価点100
->phase==1
「条件」、目標速度1000`;

    const resultWithoutSupport = parseSkillData(inputWithoutSupport);
    expect(resultWithoutSupport.skills[0].effectVariants).toBeDefined();
    expect(resultWithoutSupport.skills[0].effectVariants!.length).toBeGreaterThanOrEqual(1);
  });
});
