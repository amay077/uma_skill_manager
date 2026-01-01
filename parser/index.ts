import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { parseSkillData } from './parser/index.js';
import type { ParseResult } from './types/index.js';

interface CliOptions {
  input: string;
  output?: string;
  supportCardsOutput?: string;
}

/**
 * コマンドライン引数をパースする
 */
function parseArgs(args: string[]): CliOptions | null {
  const options: Partial<CliOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--input' || arg === '-i') {
      options.input = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--support-cards' || arg === '-s') {
      options.supportCardsOutput = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  if (!options.input) {
    return null;
  }

  return options as CliOptions;
}

/**
 * ヘルプメッセージを表示
 */
function printHelp(): void {
  console.log(`
Uma Skill Parser

使用方法:
  npx tsx src/index.ts --input <ファイルパス> [オプション]

オプション:
  -i, --input <path>         入力ファイルパス (必須)
  -o, --output <path>        スキルデータの出力先 JSON ファイル
  -s, --support-cards <path> サポートカード一覧の出力先 JSON ファイル
  -h, --help                 このヘルプを表示

例:
  npx tsx src/index.ts --input assets/umasim_skill.txt
  npx tsx src/index.ts -i assets/umasim_skill.txt -o output/skills.json -s output/support_cards.json
`);
}

/**
 * メイン処理
 */
function main(): void {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (!options) {
    console.error('エラー: --input オプションで入力ファイルを指定してください');
    console.error('詳細は --help を参照してください');
    process.exit(1);
  }

  // パスを解決（相対パス・絶対パス対応）
  const inputPath = resolve(options.input);

  // ファイル存在チェック
  if (!existsSync(inputPath)) {
    console.error(`ファイルが見つかりません: ${inputPath}`);
    process.exit(1);
  }

  // ファイル読み込み
  let content: string;
  try {
    content = readFileSync(inputPath, 'utf-8');
  } catch (error) {
    console.error(`ファイル読み込みエラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    process.exit(1);
  }

  // 空ファイルチェック
  if (content.trim() === '') {
    console.warn('スキルデータが見つかりませんでした');
    const emptyResult: ParseResult = {
      skills: [],
      supportCards: [],
      warnings: [],
      failedBlocks: 0,
    };
    outputResults(emptyResult, options);
    return;
  }

  // パース実行
  const result = parseSkillData(content);

  // 警告を出力
  for (const warning of result.warnings) {
    console.warn(warning);
  }

  // 結果のサマリーを表示
  console.log(`パース完了:`);
  console.log(`  スキル数: ${result.skills.length}`);
  console.log(`  サポートカード数: ${result.supportCards.length}`);
  if (result.failedBlocks > 0) {
    console.log(`  失敗したブロック: ${result.failedBlocks}`);
  }

  // 結果を出力
  outputResults(result, options);
}

/**
 * 結果を出力する
 */
function outputResults(result: ParseResult, options: CliOptions): void {
  // スキルデータの出力
  if (options.output) {
    const outputPath = resolve(options.output);
    try {
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, JSON.stringify(result.skills, null, 2), 'utf-8');
      console.log(`スキルデータを出力しました: ${outputPath}`);
    } catch (error) {
      console.error(`スキルデータの出力に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  // サポートカード一覧の出力
  if (options.supportCardsOutput) {
    const outputPath = resolve(options.supportCardsOutput);
    try {
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, JSON.stringify(result.supportCards, null, 2), 'utf-8');
      console.log(`サポートカード一覧を出力しました: ${outputPath}`);
    } catch (error) {
      console.error(`サポートカード一覧の出力に失敗: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }
}

// 実行
main();
