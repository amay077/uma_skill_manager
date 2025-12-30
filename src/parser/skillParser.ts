import type { Skill, SupportCard, SkillType, ParseResult } from '../types/index.js';
import { parseCondition } from './conditionParser.js';
import { parseEffectParameters } from './effectParser.js';

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
 * 評価点・人気・発動タイプ行をパースする
 * 例: "評価点240、人気:スピード30、確定発動"
 */
function parseEvaluationLine(line: string): {
  evaluationPoint: number;
  popularity?: string;
  triggerType?: string;
} {
  let evaluationPoint = 0;
  let popularity: string | undefined;
  let triggerType: string | undefined;

  // 評価点
  const evalMatch = line.match(/評価点(\d+)/);
  if (evalMatch) {
    evaluationPoint = parseInt(evalMatch[1], 10);
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

  return { evaluationPoint, popularity, triggerType };
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

    // 2行目: サポカ名・種別
    const { supportCard, type, baseSkillName } = parseSupportCardLine(lines[1]);

    // 3行目: 効果説明
    const description = lines[2].trim();

    // 4行目: 評価点・人気・発動タイプ
    let evaluationPoint = 0;
    let popularity: string | undefined;
    let triggerType: string | undefined;

    if (lines.length >= 4) {
      const evalResult = parseEvaluationLine(lines[3]);
      evaluationPoint = evalResult.evaluationPoint;
      popularity = evalResult.popularity;
      triggerType = evalResult.triggerType;
    }

    // 発動条件式を探す (-> で始まる行)
    let conditionRaw: string | undefined;
    let conditionLineIndex = -1;
    for (let i = 4; i < lines.length; i++) {
      if (lines[i].trim().startsWith('->')) {
        conditionRaw = lines[i].trim();
        conditionLineIndex = i;
        break;
      }
    }

    // 効果パラメータ行 (最終行、または条件行の次)
    let effectLine = '';
    if (conditionLineIndex >= 0 && conditionLineIndex + 1 < lines.length) {
      effectLine = lines[conditionLineIndex + 1];
    } else if (lines.length > 4) {
      effectLine = lines[lines.length - 1];
    }

    const { parameters, conditionDescription } = parseEffectParameters(effectLine);
    const condition = conditionRaw ? parseCondition(conditionRaw) : undefined;

    const skill: Skill = {
      name,
      supportCard,
      type,
      baseSkillName,
      description,
      evaluationPoint,
      popularity,
      triggerType,
      conditionRaw,
      condition,
      effectParameters: parameters,
      conditionDescription,
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
