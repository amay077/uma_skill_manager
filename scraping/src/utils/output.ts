/**
 * Markdown 出力ユーティリティ
 */

import * as fs from 'fs';
import * as path from 'path';
import type { SearchOptions, SkillSearchResult, SearchResult, FactorInfo } from '../uma-db/types.js';

/**
 * 因子情報を文字列に変換
 */
function formatFactorInfo(factor: FactorInfo): string {
  const parts: string[] = [];
  if (factor.daihyo.length > 0) {
    parts.push(factor.daihyo.join(', '));
  }
  if (factor.so.length > 0) {
    parts.push(factor.so.join(', '));
  }
  return parts.join(' / ') || '-';
}

/**
 * 検索結果を Markdown テーブル形式に変換（スキルごとの結果用、シンプル版）
 */
function resultToMarkdownTable(results: SearchResult[], searchSkills: string[]): string {
  if (results.length === 0) {
    return '*検索結果がありません*';
  }

  // ヘッダー行（# とユーザー ID とスキル値のみ）
  const skillHeaders = searchSkills.map((s) => s).join(' | ');
  const header = `| # | ユーザーID | ${skillHeaders} |`;

  // 区切り行
  const separatorParts = ['---', '---'];
  searchSkills.forEach(() => separatorParts.push('---'));
  const separator = `| ${separatorParts.join(' | ')} |`;

  // データ行
  const rows = results.map((result, index) => {
    const skillValues = searchSkills.map((skill) => result.searchSkillValues[skill] || '-').join(' | ');
    return `| ${index + 1} | ${result.userId} | ${skillValues} |`;
  });

  return [header, separator, ...rows].join('\n');
}

/**
 * 検索結果を Markdown ファイルに出力
 */
export function outputMarkdown(
  skillResults: SkillSearchResult[],
  options: SearchOptions,
  outputDir: string
): string {
  // JST (UTC+9) でタイムスタンプを生成
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const timestamp = jst.getUTCFullYear().toString() +
    (jst.getUTCMonth() + 1).toString().padStart(2, '0') +
    jst.getUTCDate().toString().padStart(2, '0') +
    jst.getUTCHours().toString().padStart(2, '0') +
    jst.getUTCMinutes().toString().padStart(2, '0') +
    jst.getUTCSeconds().toString().padStart(2, '0');
  const filename = `skill-search-${timestamp}.md`;
  const filepath = path.join(outputDir, filename);

  // 出力ディレクトリがなければ作成
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const lines: string[] = [];

  // タイトル
  lines.push('# ウマ娘 DB スキル検索結果');
  lines.push('');

  // 検索条件
  lines.push('## 検索条件');
  lines.push('');
  lines.push(`- **検索日時**: ${new Date().toLocaleString('ja-JP')}`);
  lines.push(`- **検索スキル**: ${options.skills.join(', ')}`);
  lines.push(`- **白因子合計数下限**: ${options.whiteFactor ?? 30}`);
  lines.push(`- **G1 勝数下限**: ${options.g1Wins ?? 0}`);
  lines.push(`- **検索件数上限**: ${options.limit ?? 100}`);
  lines.push('');

  // ユーザー別サマリ（スキル数に関係なく常に表示、スキル毎の結果より先に表示）
  lines.push('## ユーザー別サマリ');
  lines.push('');
  lines.push(generateUserSummary(skillResults));
  lines.push('');

  // スキルごとの結果
  for (const skillResult of skillResults) {
    lines.push(`## ${skillResult.skillName}`);
    lines.push('');
    lines.push(`**検索結果**: ${skillResult.totalCount} 件（取得: ${skillResult.results.length} 件）`);
    lines.push('');
    lines.push(resultToMarkdownTable(skillResult.results, [skillResult.skillName]));
    lines.push('');
  }

  const content = lines.join('\n');
  fs.writeFileSync(filepath, content, 'utf-8');

  console.log(`結果を ${filepath} に出力しました`);
  return filepath;
}

/**
 * ユーザーデータ（サマリ用）
 */
interface UserSummaryData {
  skills: Record<string, string>;
  blueFactor: FactorInfo;
  redFactor: FactorInfo;
  greenFactor: FactorInfo;
  whiteFactorCount: number;
  daihyoCount: number;
}

/**
 * ユーザー別サマリを生成
 */
function generateUserSummary(skillResults: SkillSearchResult[]): string {
  // ユーザー ID をキーにして結果をマージ
  const userMap = new Map<string, UserSummaryData>();

  for (const skillResult of skillResults) {
    for (const result of skillResult.results) {
      if (!userMap.has(result.userId)) {
        userMap.set(result.userId, {
          skills: {},
          blueFactor: result.blueFactor,
          redFactor: result.redFactor,
          greenFactor: result.greenFactor,
          whiteFactorCount: result.whiteFactorCount,
          daihyoCount: result.daihyoCount,
        });
      }
      const userData = userMap.get(result.userId)!;
      userData.skills[skillResult.skillName] = result.searchSkillValues[skillResult.skillName] || '-';
      // 後から取得した結果で更新（同じユーザーなら同じ値のはず）
      userData.blueFactor = result.blueFactor;
      userData.redFactor = result.redFactor;
      userData.greenFactor = result.greenFactor;
      userData.whiteFactorCount = result.whiteFactorCount;
      userData.daihyoCount = result.daihyoCount;
    }
  }

  if (userMap.size === 0) {
    return '*データがありません*';
  }

  const skillNames = skillResults.map((r) => r.skillName);

  // ヘッダー行
  const header = `| ユーザーID | 青因子（代表/祖） | 赤因子（代表/祖） | 緑因子（代表/祖） | 白因子数 | 代表因子数 | ${skillNames.join(' | ')} |`;

  // 区切り行
  const separatorParts = ['---', '---', '---', '---', '---', '---'];
  skillNames.forEach(() => separatorParts.push('---'));
  const separator = `| ${separatorParts.join(' | ')} |`;

  // データ行（検索スキルの因子数合計の降順でソート）
  const rows: string[] = [];
  const entries = Array.from(userMap.entries());

  // スキル値から因子数を計算する関数
  // 例: "2（代表2）" → 2 + 2 = 4, "3" → 3, "-" → 0
  const calcSkillTotal = (skillValue: string): number => {
    if (skillValue === '-' || !skillValue) return 0;
    let total = 0;
    // 基本値を抽出（先頭の数字）
    const baseMatch = skillValue.match(/^(\d+)/);
    if (baseMatch) {
      total += parseInt(baseMatch[1], 10);
    }
    // 代表値を抽出（「代表N」の N）
    const daihyoMatch = skillValue.match(/代表(\d+)/);
    if (daihyoMatch) {
      total += parseInt(daihyoMatch[1], 10);
    }
    return total;
  };

  // ソート: 検索スキルの因子数合計の降順
  entries.sort(([, a], [, b]) => {
    const aTotal = Object.values(a.skills).reduce((sum, v) => sum + calcSkillTotal(v), 0);
    const bTotal = Object.values(b.skills).reduce((sum, v) => sum + calcSkillTotal(v), 0);
    return bTotal - aTotal;
  });

  for (const [userId, userData] of entries) {
    const values = skillNames.map((name) => userData.skills[name] || '-').join(' | ');
    rows.push(`| ${userId} | ${formatFactorInfo(userData.blueFactor)} | ${formatFactorInfo(userData.redFactor)} | ${formatFactorInfo(userData.greenFactor)} | ${userData.whiteFactorCount} | ${userData.daihyoCount} | ${values} |`);
  }

  return [header, separator, ...rows].join('\n');
}
