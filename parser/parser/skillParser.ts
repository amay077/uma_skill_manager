import type {
  Skill,
  SupportCard,
  SkillType,
  SkillSubType,
  ParseResult,
  EffectVariant,
  EffectParameter,
} from '../types/index.js';
import { parseCondition } from './conditionParser.js';
import { parseEffectParameters, hasNegativeParameter } from './effectParser.js';

/**
 * サポカ名と種別を含む行をパースする
 * 例: "[レッドストライフ]ゴールドシップ 固有"
 * 例: "[衣装名]キャラ名 進化(元スキル名)"
 */
function parseSupportCardLine(line: string): {
  supportCard: SupportCard | null;
  type: SkillType;
  baseSkillName?: string;
} {
  // サポカ名パターン: [衣装名]キャラ名
  const supportCardMatch = line.match(/^\[([^\]]+)\]([^\s]+)/);

  let supportCard: SupportCard | null = null;
  if (supportCardMatch) {
    supportCard = {
      costumeName: supportCardMatch[1],
      characterName: supportCardMatch[2],
      fullName: `[${supportCardMatch[1]}]${supportCardMatch[2]}`,
    };
  }

  // 種別の判定
  let type: SkillType = 'normal';
  let baseSkillName: string | undefined;

  if (line.includes('固有')) {
    type = 'unique';
  } else {
    // 進化(元スキル名) パターン
    const evolutionMatch = line.match(/進化\(([^)]+)\)/);
    if (evolutionMatch) {
      type = 'evolution';
      baseSkillName = evolutionMatch[1];
    }
  }

  return { supportCard, type, baseSkillName };
}

/**
 * 評価点・人気・発動タイプ・SP行をパースする
 * 例: "評価点240、人気:スピード30、確定発動"
 * 例: "評価点508、SP180(合計360)、人気:スタミナ60"（金スキル）
 * 例: "評価点217、SP180、人気:スタミナ20"（通常スキル）
 * 例: "評価点633、進化元SP360、人気:スタミナ60"（進化スキル）
 */
function parseEvaluationLine(line: string): {
  evaluationPoint: number;
  popularity?: string;
  triggerType?: string;
  spCost?: number;
  spTotal?: number;
  evolutionBaseSp?: number;
} {
  let evaluationPoint = 0;
  let popularity: string | undefined;
  let triggerType: string | undefined;
  let spCost: number | undefined;
  let spTotal: number | undefined;
  let evolutionBaseSp: number | undefined;

  // 評価点
  const evalMatch = line.match(/評価点(\d+)/);
  if (evalMatch) {
    evaluationPoint = parseInt(evalMatch[1], 10);
  }

  // SP値（金スキル: SP180(合計360)、通常: SP200）
  const spTotalMatch = line.match(/SP(\d+)\(合計(\d+)\)/);
  if (spTotalMatch) {
    spCost = parseInt(spTotalMatch[1], 10);
    spTotal = parseInt(spTotalMatch[2], 10);
  } else {
    const spOnlyMatch = line.match(/、SP(\d+)、/);
    if (spOnlyMatch) {
      spCost = parseInt(spOnlyMatch[1], 10);
    }
  }

  // 進化元SP
  const evolutionSpMatch = line.match(/進化元SP(\d+)/);
  if (evolutionSpMatch) {
    evolutionBaseSp = parseInt(evolutionSpMatch[1], 10);
  }

  // 人気
  const popularityMatch = line.match(/人気:([^、]+)/);
  if (popularityMatch) {
    popularity = popularityMatch[1].trim();
  }

  // 発動タイプ（最後の部分）
  const parts = line.split('、');
  const lastPart = parts[parts.length - 1]?.trim();
  if (lastPart && !lastPart.startsWith('評価点') && !lastPart.startsWith('人気')) {
    triggerType = lastPart;
  }

  return { evaluationPoint, popularity, triggerType, spCost, spTotal, evolutionBaseSp };
}

/**
 * スキル詳細種別（subType）を決定する
 * - unique: 固有スキル（type='unique'）※継承固有の判定は DB インポート時に行う
 * - inherited_unique: 継承固有スキル（同名の固有スキルが存在する場合、DB インポート時に設定）
 * - gold: 金スキル（type='normal' かつ SP合計表記あり）
 * - normal: 通常スキル（type='normal' かつ SP値のみ）
 * - evolution: 進化スキル（type='evolution'）
 */
function determineSubType(
  type: SkillType,
  _evaluationPoint: number,
  spTotal?: number
): SkillSubType {
  switch (type) {
    case 'unique':
      // パース時点では一律 unique、継承固有の判定は DB インポート時に同名スキルの存在で行う
      return 'unique';
    case 'evolution':
      return 'evolution';
    case 'normal':
    default:
      // SP合計表記がある場合は金スキル、そうでなければ通常スキル
      return spTotal !== undefined ? 'gold' : 'normal';
  }
}

/**
 * 条件行と効果行のペアを抽出
 */
interface ConditionEffectPair {
  conditionRaw: string;
  effectLine: string;
}

/**
 * ブロックから条件行と効果行のペアを抽出する
 */
function extractConditionEffectPairs(lines: string[], startIndex: number): ConditionEffectPair[] {
  const pairs: ConditionEffectPair[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    // 条件行は -> で始まるか、変数名+比較演算子 で始まる（変数名は英小文字・数字・アンダースコアを含む）
    if (line.startsWith('->') || /^[a-z_][a-z0-9_]*(==|>=|<=|!=|>|<)/.test(line)) {
      const conditionRaw = line;
      // 次の行が効果行（「」で始まる）
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.startsWith('「')) {
          pairs.push({ conditionRaw, effectLine: nextLine });
          i++; // 効果行をスキップ
        }
      }
    }
  }

  return pairs;
}

/**
 * 条件式を連続発動条件（A->B）に分離する
 */
function splitChainedCondition(conditionRaw: string): {
  triggerConditionRaw?: string;
  activationConditionRaw: string;
} {
  // -> で始まる場合は先頭の -> を除去
  let cleaned = conditionRaw.startsWith('->') ? conditionRaw.slice(2) : conditionRaw;

  // A->B 形式の分離
  const arrowIndex = cleaned.indexOf('->');
  if (arrowIndex > 0) {
    return {
      triggerConditionRaw: cleaned.slice(0, arrowIndex),
      activationConditionRaw: cleaned.slice(arrowIndex + 2),
    };
  }

  return { activationConditionRaw: cleaned };
}

/**
 * 効果バリアントを生成する
 */
function createEffectVariants(pairs: ConditionEffectPair[]): EffectVariant[] {
  const variants: EffectVariant[] = [];
  let currentEffectOrder = 0;
  let variantIndex = 0;

  for (const pair of pairs) {
    const { triggerConditionRaw, activationConditionRaw } = splitChainedCondition(pair.conditionRaw);
    const { parameters, conditionDescription } = parseEffectParameters(pair.effectLine);

    // is_activate_other_skill_detail==1 が含まれている場合は多段発動
    const isSubsequentActivation = activationConditionRaw.includes('is_activate_other_skill_detail==1');

    if (isSubsequentActivation) {
      currentEffectOrder++;
    }

    // activationConditionRaw から is_activate_other_skill_detail 条件を除去してパース
    let cleanedCondition = activationConditionRaw
      .replace(/&?is_activate_other_skill_detail==1&?/g, '')
      .replace(/^&|&$/g, '');

    // 空になった場合は undefined
    const activationCondition = cleanedCondition ? parseCondition('->' + cleanedCondition) : undefined;

    const variant: EffectVariant = {
      variantIndex: isSubsequentActivation ? 0 : variantIndex,
      effectOrder: currentEffectOrder,
      isDemerit: hasNegativeParameter(parameters),
      triggerConditionRaw,
      activationConditionRaw,
      activationCondition,
      activationConditionDescription: conditionDescription,
      effectParameters: parameters,
    };

    variants.push(variant);

    if (!isSubsequentActivation) {
      variantIndex++;
    }
  }

  // 条件分岐効果のバリアントインデックスを再計算（同一 effectOrder 内で）
  const orderGroups = new Map<number, EffectVariant[]>();
  for (const v of variants) {
    const group = orderGroups.get(v.effectOrder) || [];
    group.push(v);
    orderGroups.set(v.effectOrder, group);
  }

  for (const group of orderGroups.values()) {
    // 効果の大きさでソート（targetSpeed + currentSpeed の合計で比較）
    group.sort((a, b) => {
      const aTotal = (a.effectParameters.targetSpeed || 0) + (a.effectParameters.currentSpeed || 0);
      const bTotal = (b.effectParameters.targetSpeed || 0) + (b.effectParameters.currentSpeed || 0);
      return bTotal - aTotal; // 降順
    });

    // variantIndex を振り直す
    for (let i = 0; i < group.length; i++) {
      group[i].variantIndex = i;
    }
  }

  return variants;
}

/**
 * 2行目がサポカ行かどうかを判定する
 * サポカ行の特徴: [衣装名]キャラ名 パターン、または 固有/進化 キーワードを含む
 */
function isSupportCardLine(line: string): boolean {
  // [衣装名]キャラ名 パターン
  if (/^\[.+\]/.test(line)) {
    return true;
  }
  // 固有/進化 キーワードを含む
  if (line.includes('固有') || line.includes('進化')) {
    return true;
  }
  return false;
}

/**
 * スキルブロックをパースする
 */
function parseSkillBlock(lines: string[], blockStartLine: number): {
  skill: Skill | null;
  warning?: string;
} {
  if (lines.length < 3) {
    return {
      skill: null,
      warning: `スキルブロック[行${blockStartLine}]のパースに失敗: 行数不足`,
    };
  }

  try {
    // 1行目: スキル名
    const name = lines[0].trim();
    if (!name) {
      return {
        skill: null,
        warning: `スキルブロック[行${blockStartLine}]のパースに失敗: スキル名が空`,
      };
    }

    // 2行目がサポカ行かどうかで解析オフセットを決定
    const hasSupportCardLine = isSupportCardLine(lines[1]);
    const offset = hasSupportCardLine ? 0 : -1;

    // 2行目: サポカ名・種別（サポカ行がある場合のみ）
    let supportCard: SupportCard | null = null;
    let type: SkillType = 'normal';
    let baseSkillName: string | undefined;

    if (hasSupportCardLine) {
      const parsed = parseSupportCardLine(lines[1]);
      supportCard = parsed.supportCard;
      type = parsed.type;
      baseSkillName = parsed.baseSkillName;
    }

    // 効果説明行（サポカあり: 3行目、なし: 2行目）
    const descriptionIndex = 2 + offset;
    const description = descriptionIndex >= 0 && descriptionIndex < lines.length
      ? lines[descriptionIndex].trim()
      : '';

    // 評価点・人気・発動タイプ・SP行（サポカあり: 4行目、なし: 3行目）
    let evaluationPoint = 0;
    let popularity: string | undefined;
    let triggerType: string | undefined;
    let spCost: number | undefined;
    let spTotal: number | undefined;

    const evalLineIndex = 3 + offset;
    if (evalLineIndex >= 0 && evalLineIndex < lines.length) {
      const evalResult = parseEvaluationLine(lines[evalLineIndex]);
      evaluationPoint = evalResult.evaluationPoint;
      popularity = evalResult.popularity;
      triggerType = evalResult.triggerType;
      spCost = evalResult.spCost;
      spTotal = evalResult.spTotal;
    }

    // スキル詳細種別を決定
    const subType = determineSubType(type, evaluationPoint, spTotal);

    // 条件行と効果行のペアを抽出（サポカあり: 5行目以降、なし: 4行目以降）
    const pairStartIndex = 4 + offset;
    const pairs = extractConditionEffectPairs(lines, pairStartIndex);

    // 効果バリアントを生成
    let effectVariants = createEffectVariants(pairs);

    // 条件/効果ペアがない場合でも最低限のデフォルト effectVariant を生成
    if (effectVariants.length === 0) {
      effectVariants = [{
        variantIndex: 0,
        effectOrder: 0,
        isDemerit: false,
        triggerConditionRaw: undefined,
        activationConditionRaw: undefined,
        activationCondition: undefined,
        activationConditionDescription: undefined,
        effectParameters: {},
      }];
    }

    // 後方互換性: 最大効果（variantIndex=0, effectOrder=0）を effectParameters として設定
    const primaryVariant = effectVariants.find((v) => v.variantIndex === 0 && v.effectOrder === 0);
    const effectParameters: EffectParameter = primaryVariant?.effectParameters || {};
    const conditionDescription = primaryVariant?.activationConditionDescription;
    const conditionRaw = primaryVariant?.activationConditionRaw
      ? (primaryVariant.triggerConditionRaw
          ? `${primaryVariant.triggerConditionRaw}->${primaryVariant.activationConditionRaw}`
          : `->${primaryVariant.activationConditionRaw}`)
      : undefined;
    const condition = conditionRaw ? parseCondition(conditionRaw) : undefined;

    const skill: Skill = {
      name,
      supportCard,
      type,
      subType,
      baseSkillName,
      spCost,
      spTotal,
      description,
      evaluationPoint,
      popularity,
      triggerType,
      conditionRaw,
      condition,
      effectParameters,
      conditionDescription,
      effectVariants,
    };

    return { skill };
  } catch (error) {
    return {
      skill: null,
      warning: `スキルブロック[行${blockStartLine}]のパースに失敗: ${error instanceof Error ? error.message : '不明なエラー'}`,
    };
  }
}

/**
 * テキストファイル全体をパースする
 */
export function parseSkillData(content: string): ParseResult {
  const skills: Skill[] = [];
  const supportCardMap = new Map<string, SupportCard>();
  const warnings: string[] = [];
  let failedBlocks = 0;

  // 空行で分割してブロックに分ける
  const lines = content.split('\n');
  const blocks: { lines: string[]; startLine: number }[] = [];
  let currentBlock: string[] = [];
  let blockStartLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '') {
      if (currentBlock.length > 0) {
        blocks.push({ lines: currentBlock, startLine: blockStartLine });
        currentBlock = [];
      }
      blockStartLine = i + 2; // 次のブロックの開始行（1-indexed）
    } else {
      currentBlock.push(line);
    }
  }

  // 最後のブロックを追加
  if (currentBlock.length > 0) {
    blocks.push({ lines: currentBlock, startLine: blockStartLine });
  }

  // 各ブロックをパース
  for (const block of blocks) {
    const { skill, warning } = parseSkillBlock(block.lines, block.startLine);

    if (skill) {
      skills.push(skill);

      // サポートカード一覧に追加
      if (skill.supportCard) {
        supportCardMap.set(skill.supportCard.fullName, skill.supportCard);
      }
    } else if (warning) {
      warnings.push(warning);
      failedBlocks++;
    }
  }

  const supportCards = Array.from(supportCardMap.values());

  return { skills, supportCards, warnings, failedBlocks };
}
