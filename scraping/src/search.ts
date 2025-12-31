/**
 * ウマ娘 DB スキル検索 CLI
 *
 * Usage:
 *   npx tsx src/search.ts --skill "しゃかりき"
 *   npx tsx src/search.ts --skill "しゃかりき" --skill "アオハル点火・速"
 *   npx tsx src/search.ts --skill "しゃかりき" --interactive
 *   npx tsx src/search.ts --skill "しゃかりき" --no-headless
 */

import { UmaDbClient } from './uma-db/client.js';
import type { SearchOptions, SkillSearchResult } from './uma-db/types.js';
import { outputMarkdown } from './utils/output.js';
import * as path from 'path';

/** CLI 引数をパース */
function parseArgs(): SearchOptions {
  const args = process.argv.slice(2);
  const options: SearchOptions = {
    skills: [],
    whiteFactor: 30,
    g1Wins: 0,
    limit: 100,
    headless: true,
    interactive: false,
    outputDir: 'results',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--skill':
      case '-s':
        if (nextArg && !nextArg.startsWith('-')) {
          options.skills.push(nextArg);
          i++;
        }
        break;

      case '--white-factor':
      case '-w':
        if (nextArg && !nextArg.startsWith('-')) {
          options.whiteFactor = parseInt(nextArg, 10);
          i++;
        }
        break;

      case '--g1-wins':
      case '-g':
        if (nextArg && !nextArg.startsWith('-')) {
          options.g1Wins = parseInt(nextArg, 10);
          i++;
        }
        break;

      case '--limit':
      case '-l':
        if (nextArg && !nextArg.startsWith('-')) {
          options.limit = parseInt(nextArg, 10);
          i++;
        }
        break;

      case '--no-headless':
        options.headless = false;
        break;

      case '--headless':
        options.headless = true;
        break;

      case '--interactive':
      case '-i':
        options.interactive = true;
        options.headless = false; // インタラクティブモードではヘッドレス無効
        break;

      case '--output':
      case '-o':
        if (nextArg && !nextArg.startsWith('-')) {
          options.outputDir = nextArg;
          i++;
        }
        break;

      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

/** ヘルプを表示 */
function printHelp(): void {
  console.log(`
ウマ娘 DB スキル検索 CLI

Usage:
  npx tsx src/search.ts [options]

Options:
  --skill, -s <name>      検索するスキル名（複数指定可）
  --white-factor, -w <n>  白因子合計数の下限（デフォルト: 30）
  --g1-wins, -g <n>       G1 勝数の下限（デフォルト: 0）
  --limit, -l <n>         検索結果の上限（デフォルト: 100）
  --no-headless           ブラウザを表示する
  --headless              ヘッドレスモード（デフォルト）
  --interactive, -i       インタラクティブモード（Enter 待機）
  --output, -o <dir>      出力ディレクトリ（デフォルト: results）
  --help, -h              ヘルプを表示

Examples:
  # 単一スキル検索
  npx tsx src/search.ts --skill "しゃかりき"

  # 複数スキル検索
  npx tsx src/search.ts --skill "しゃかりき" --skill "アオハル点火・速"

  # インタラクティブモード（ブラウザで条件確認後に検索）
  npx tsx src/search.ts --skill "しゃかりき" --interactive

  # ブラウザを表示して実行
  npx tsx src/search.ts --skill "しゃかりき" --no-headless
`);
}

/** メイン処理 */
async function main(): Promise<void> {
  const options = parseArgs();

  // スキル指定がない場合はエラー
  if (options.skills.length === 0) {
    console.error('エラー: 検索するスキルを指定してください（--skill オプション）');
    console.error('詳細は --help を参照してください');
    process.exit(1);
  }

  console.log('='.repeat(50));
  console.log('ウマ娘 DB スキル検索');
  console.log('='.repeat(50));
  console.log(`検索スキル: ${options.skills.join(', ')}`);
  console.log(`ヘッドレスモード: ${options.headless ? 'ON' : 'OFF'}`);
  console.log(`インタラクティブモード: ${options.interactive ? 'ON' : 'OFF'}`);
  console.log('');

  const client = new UmaDbClient(options);
  const skillResults: SkillSearchResult[] = [];

  try {
    // ブラウザ起動
    await client.launch();

    // 検索条件設定
    await client.setSearchConditions();

    // インタラクティブモード: ユーザー入力待機
    await client.waitForUserInput();

    // 各スキルを検索
    for (const skill of options.skills) {
      const result = await client.searchSkill(skill);
      skillResults.push(result);
    }

    // 結果を Markdown 出力
    const outputDir = path.resolve(process.cwd(), options.outputDir ?? 'results');
    const outputPath = outputMarkdown(skillResults, options, outputDir);

    console.log('');
    console.log('='.repeat(50));
    console.log('検索完了');
    console.log(`出力ファイル: ${outputPath}`);
    console.log('='.repeat(50));
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  } finally {
    // ブラウザ終了
    await client.close();
  }
}

// 実行
main();
