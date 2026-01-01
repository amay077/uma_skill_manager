#!/usr/bin/env npx tsx
/**
 * スキル検索 CLI
 *
 * 使用例:
 *   npx tsx parser/cli/search.ts --running-style nige --phase non_late --effect speed
 *   npx tsx parser/cli/search.ts --sub-type normal,unique --order top4 --ground turf
 */
import { parseArgs } from 'node:util';
import { writeFileSync } from 'node:fs';
import { advancedSearch, type AdvancedSearchOptions } from '../db/queries.js';

// CLI 引数の定義
const { values } = parseArgs({
  options: {
    'running-style': { type: 'string', short: 'r' },
    'distance': { type: 'string', short: 'd' },
    'phase': { type: 'string', short: 'p' },
    'effect': { type: 'string', short: 'e' },
    'order': { type: 'string', short: 'o' },
    'ground': { type: 'string', short: 'g' },
    'type': { type: 'string', short: 't' },
    'sub-type': { type: 'string', short: 's' },
    'name': { type: 'string', short: 'n' },
    'exclude-demerit': { type: 'boolean' },
    'limit': { type: 'string', short: 'l' },
    'format': { type: 'string', short: 'f' },
    'sort': { type: 'string' },
    'output': { type: 'string', short: 'O' },
    'help': { type: 'boolean', short: 'h' },
  },
  strict: false,
});

// ヘルプ表示
if (values.help) {
  console.log(`
スキル検索 CLI

使用法:
  npx tsx scripts/search.ts [オプション]

オプション:
  -r, --running-style <value>  作戦 (nige|senkou|sashi|oikomi|none|any)
  -d, --distance <value>       距離 (short|mile|middle|long|none|any)
  -p, --phase <value>          発動タイミング (early|mid|late|corner|straight|non_late|any)
  -e, --effect <value>         効果種別 (speed|accel|stamina|position|debuff|any)
  -o, --order <value>          順位条件 (top1|top2|top4|top6|mid|back|any)
  -g, --ground <value>         バ場 (turf|dirt|none|any)
  -t, --type <value>           スキル種別 (unique|evolution|normal|any)
  -s, --sub-type <value>       スキル詳細種別 (unique|inherited_unique|gold|normal|evolution|any)
                               カンマ区切りで複数指定可: normal,unique
  -n, --name <value>           スキル名（部分一致）
      --exclude-demerit        デメリットスキルを除外
  -l, --limit <value>          結果件数の上限 (デフォルト: 200)
  -f, --format <value>         出力形式 (table|json|simple) (デフォルト: table)
      --sort <value>           ソート順 (effect|eval|name) (デフォルト: effect)
  -O, --output <path>          ファイル出力 (例: docs/result.md → docs/result-YYYYMMDDHHmm.md)
  -h, --help                   このヘルプを表示

使用例:
  # 逃げ用・終盤以外・速度スキル（チャンミ4位以内）
  npx tsx scripts/search.ts -r nige -p non_late -e speed -o top4

  # 白スキル＋固有スキルを検索
  npx tsx scripts/search.ts -s normal,unique --exclude-demerit

  # JSON形式で出力
  npx tsx scripts/search.ts -r nige -f json

  # ファイルに出力（タイムスタンプ付き）
  npx tsx scripts/search.ts -r nige -O docs/skill-search.md
  # → docs/skill-search-202412301830.md に出力
`);
  process.exit(0);
}

// 検索オプションの構築
const options: AdvancedSearchOptions = {
  limit: values.limit ? parseInt(values.limit, 10) : 200,
};

if (values['running-style']) {
  options.runningStyle = values['running-style'] as AdvancedSearchOptions['runningStyle'];
}
if (values.distance) {
  options.distanceType = values.distance as AdvancedSearchOptions['distanceType'];
}
if (values.phase) {
  options.phase = values.phase as AdvancedSearchOptions['phase'];
}
if (values.effect) {
  options.effectType = values.effect as AdvancedSearchOptions['effectType'];
}
if (values.order) {
  options.orderRange = values.order as AdvancedSearchOptions['orderRange'];
}
if (values.ground) {
  options.groundType = values.ground as AdvancedSearchOptions['groundType'];
}
if (values.type) {
  options.skillType = values.type as AdvancedSearchOptions['skillType'];
}
if (values['sub-type']) {
  const subTypes = values['sub-type'].split(',').map(s => s.trim());
  options.skillSubType = subTypes.length === 1
    ? subTypes[0] as AdvancedSearchOptions['skillSubType']
    : subTypes as AdvancedSearchOptions['skillSubType'];
}
if (values.name) {
  options.name = values.name;
}
if (values['exclude-demerit']) {
  options.excludeDemerit = true;
}

// 検索実行
const results = advancedSearch(options);

// 重複排除（skill_id でユニーク化）
const seen = new Set<number>();
const uniqueResults = results.filter(r => {
  if (seen.has(r.skill_id)) return false;
  seen.add(r.skill_id);
  return true;
});

// 効果パラメータのパース
function parseEffectParams(params: string | null): {
  speed: number | null;
  accel: number | null;
  heal: number | null;
  duration: number | null;
} {
  if (!params) return { speed: null, accel: null, heal: null, duration: null };
  const map: Record<string, number> = {};
  params.split(', ').forEach(p => {
    const [key, val] = p.split(':');
    map[key] = Number(val);
  });
  return {
    speed: map.targetSpeed ?? map.currentSpeed ?? null,
    accel: map.acceleration ?? null,
    heal: map.hpRecovery ?? null,
    duration: map.duration ?? null,
  };
}

// ソート
const sortBy = values.sort || 'effect';
uniqueResults.sort((a, b) => {
  if (sortBy === 'effect') {
    const epA = parseEffectParams(a.effect_params);
    const epB = parseEffectParams(b.effect_params);
    // 加速スキルのみ指定時は加速×持続、それ以外は速度×持続
    const useAccel = options.effectType === 'accel';
    const valueA = useAccel ? (epA.accel ?? 0) : (epA.speed ?? 0);
    const valueB = useAccel ? (epB.accel ?? 0) : (epB.speed ?? 0);
    const scoreA = valueA * (epA.duration ?? 0);
    const scoreB = valueB * (epB.duration ?? 0);
    return scoreB - scoreA;
  }
  if (sortBy === 'eval') {
    return b.evaluation_point - a.evaluation_point;
  }
  if (sortBy === 'name') {
    return a.skill_name.localeCompare(b.skill_name, 'ja');
  }
  return 0;
});

// 日本語変換マップ
const runningStyleMap: Record<string, string> = {
  nige: '逃げ', senkou: '先行', sashi: '差し', oikomi: '追込', none: '作戦フリー', any: '指定なし'
};
const distanceTypeMap: Record<string, string> = {
  short: '短距離', mile: 'マイル', middle: '中距離', long: '長距離', none: '距離フリー', any: '指定なし'
};
const phaseMap: Record<string, string> = {
  early: '序盤', mid: '中盤', late: '終盤', corner: 'コーナー',
  straight: '直線', non_late: '終盤以外', any: '指定なし'
};
const effectTypeMap: Record<string, string> = {
  speed: '速度', accel: '加速', stamina: 'スタミナ',
  position: '位置取り', debuff: 'デバフ', any: '指定なし'
};
const orderRangeMap: Record<string, string> = {
  top1: '1位', top2: '1〜2位', top4: '1〜4位', top6: '1〜6位',
  mid: '中団', back: '後方', any: '指定なし'
};
const groundTypeMap: Record<string, string> = { turf: '芝', dirt: 'ダート', none: 'バ場フリー', any: '指定なし' };
const subTypeDisplayMap: Record<string, string> = {
  unique: '固有', inherited_unique: '継承固有', gold: '金', normal: '白', evolution: '進化'
};

// 順位条件を抽出（order_flags から生成）
function formatOrderCondition(orderFlags: string): string {
  if (!orderFlags || orderFlags === '111111111') return '-';

  // 1が立っている位置を収集
  const positions: number[] = [];
  for (let i = 0; i < orderFlags.length && i < 9; i++) {
    if (orderFlags[i] === '1') {
      positions.push(i + 1);
    }
  }

  if (positions.length === 0) return '-';
  if (positions.length === 9) return '-';

  // 連続している場合は範囲表示
  const min = Math.min(...positions);
  const max = Math.max(...positions);

  // すべて連続しているか確認
  const isContiguous = positions.length === max - min + 1;

  if (isContiguous) {
    if (min === max) return `${min}位`;
    if (min === 1) return `1〜${max}位`;
    if (max === 9) return `${min}位〜`;
    return `${min}〜${max}位`;
  }

  // 連続していない場合は個別表示（最大3つまで）
  if (positions.length <= 3) {
    return positions.map(p => `${p}位`).join('/');
  }

  return `${min}〜${max}位`;
}

// タイムスタンプ生成（YYYYMMDDHHmm）
function getTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${y}${m}${d}${h}${min}`;
}

// 出力先の決定（--output 指定時はファイル出力）
// -O のみ指定（値なし）の場合はデフォルトパスを使用
const outputPath = values.output === true
  ? 'results/skill-search.md'
  : (typeof values.output === 'string' ? values.output : undefined);
let outputLines: string[] = [];

function output(line: string): void {
  if (outputPath) {
    outputLines.push(line);
  } else {
    console.log(line);
  }
}

function flushOutput(): void {
  if (outputPath) {
    // ファイル名にタイムスタンプを付与
    const ext = outputPath.lastIndexOf('.') > 0
      ? outputPath.slice(outputPath.lastIndexOf('.'))
      : '';
    const base = ext
      ? outputPath.slice(0, outputPath.lastIndexOf('.'))
      : outputPath;
    const finalPath = `${base}-${getTimestamp()}${ext}`;

    writeFileSync(finalPath, outputLines.join('\n') + '\n', 'utf-8');
    console.log(`出力: ${finalPath}`);
  }
}

// 出力形式
const format = values.format || 'table';

if (format === 'json') {
  const jsonOutput = JSON.stringify(uniqueResults, null, 2);
  if (outputPath) {
    outputLines.push(jsonOutput);
    flushOutput();
  } else {
    console.log(jsonOutput);
  }
  process.exit(0);
}

if (format === 'simple') {
  for (const r of uniqueResults) {
    const ep = parseEffectParams(r.effect_params);
    output(`${r.skill_name} (${subTypeDisplayMap[r.skill_sub_type] || r.skill_sub_type})`);
    output(`  速度:${ep.speed ?? '-'} 加速:${ep.accel ?? '-'} 持続:${ep.duration ?? '-'} 評価:${r.evaluation_point}`);
    output(`  条件: ${r.activation_condition_description || '-'}`);
    output('');
  }
  output(`合計: ${uniqueResults.length} 件`);
  flushOutput();
  process.exit(0);
}

// table 形式（デフォルト）
output('# スキル検索結果');
output('');
output('## 検索条件');
output('');
output('| 項目 | 条件 |');
output('|------|------|');

if (options.runningStyle) {
  const label = runningStyleMap[options.runningStyle] || options.runningStyle;
  const suffix = options.runningStyle === 'none' ? '（作戦条件なしスキルのみ）'
    : options.runningStyle !== 'any' ? '（作戦条件なし含む）'
    : '';
  output(`| 作戦 | ${label}${suffix} |`);
}
if (options.distanceType) {
  const label = distanceTypeMap[options.distanceType] || options.distanceType;
  const suffix = options.distanceType === 'none' ? '（距離条件なしスキルのみ）'
    : options.distanceType !== 'any' ? '（距離条件なし含む）'
    : '';
  output(`| 距離 | ${label}${suffix} |`);
}
if (options.phase) {
  output(`| フェーズ | ${phaseMap[options.phase] || options.phase} |`);
}
if (options.groundType) {
  const label = groundTypeMap[options.groundType] || options.groundType;
  const suffix = options.groundType === 'none' ? '（バ場条件なしスキルのみ）'
    : options.groundType !== 'any' ? '（バ場条件なし含む）'
    : '';
  output(`| バ場 | ${label}${suffix} |`);
}
if (options.orderRange) {
  const label = orderRangeMap[options.orderRange] || options.orderRange;
  output(`| 順位条件 | ${label}${options.orderRange !== 'any' ? '（チャンミ換算）' : ''} |`);
}
if (options.skillSubType) {
  const subTypes = Array.isArray(options.skillSubType) ? options.skillSubType : [options.skillSubType];
  const labels = subTypes.map(t => subTypeDisplayMap[t] || t).join(' + ');
  output(`| スキル種別 | ${labels} |`);
}
if (options.effectType) {
  const label = effectTypeMap[options.effectType] || options.effectType;
  output(`| 効果種別 | ${label}${options.effectType !== 'any' ? 'スキルのみ' : ''} |`);
}
if (options.skillName) {
  output(`| スキル名 | ${options.skillName}（部分一致） |`);
}
if (options.excludeDemerit) {
  output('| デメリット | 除外 |');
}

output('');
output(`**該当件数: ${uniqueResults.length} 件**`);
output('');
output('---');
output('');
output('## 検索結果');
output('');
output('| No | スキル名 | 種別 | 順位条件 | 条件文 | 速度 | 加速 | 回復 | 持続 | 評価点 |');
output('|---:|----------|------|----------|--------|-----:|-----:|-----:|-----:|-------:|');

let no = 0;
for (const r of uniqueResults) {
  no++;
  const ep = parseEffectParams(r.effect_params);
  const orderCond = formatOrderCondition(r.order_flags);
  const condText = r.description || '-';
  const subType = subTypeDisplayMap[r.skill_sub_type] || r.skill_sub_type;
  output(
    `| ${no} | ${r.skill_name} | ${subType} | ${orderCond} | ${condText} | ` +
    `${ep.speed ?? '-'} | ${ep.accel ?? '-'} | ${ep.heal ?? '-'} | ${ep.duration ?? '-'} | ${r.evaluation_point} |`
  );
}

flushOutput();
