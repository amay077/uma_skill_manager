#!/usr/bin/env npx tsx
/**
 * スキル検索 CLI
 *
 * 使用例:
 *   npx tsx scripts/search.ts --running-style nige --phase non_late --effect speed
 *   npx tsx scripts/search.ts --sub-type normal,unique --order top4 --ground turf
 */
import { parseArgs } from 'node:util';
import { writeFileSync } from 'node:fs';
import { advancedSearch, type AdvancedSearchOptions } from '../src/db/queries.js';

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
  -r, --running-style <value>  作戦 (nige|senkou|sashi|oikomi|any)
  -d, --distance <value>       距離 (short|mile|middle|long|any)
  -p, --phase <value>          発動タイミング (early|mid|late|corner|straight|non_late|any)
  -e, --effect <value>         効果種別 (speed|accel|stamina|position|debuff|any)
  -o, --order <value>          順位条件 (top1|top2|top4|top6|mid|back|any)
  -g, --ground <value>         バ場 (turf|dirt|any)
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
  options.skillName = values.name;
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
    accel: map.targetAccel ?? map.currentAccel ?? null,
    heal: map.heal ?? null,
    duration: map.duration ?? null,
  };
}

// ソート
const sortBy = values.sort || 'effect';
uniqueResults.sort((a, b) => {
  if (sortBy === 'effect') {
    const epA = parseEffectParams(a.effect_params);
    const epB = parseEffectParams(b.effect_params);
    const scoreA = (epA.speed ?? 0) * (epA.duration ?? 0);
    const scoreB = (epB.speed ?? 0) * (epB.duration ?? 0);
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
  nige: '逃げ', senkou: '先行', sashi: '差し', oikomi: '追込', any: '指定なし'
};
const distanceTypeMap: Record<string, string> = {
  short: '短距離', mile: 'マイル', middle: '中距離', long: '長距離', any: '指定なし'
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
const groundTypeMap: Record<string, string> = { turf: '芝', dirt: 'ダート', any: '指定なし' };
const subTypeDisplayMap: Record<string, string> = {
  unique: '固有', inherited_unique: '継承固有', gold: '金', normal: '白', evolution: '進化'
};

// 順位条件を抽出
function extractOrderCondition(raw: string | null): string {
  if (!raw) return '-';
  const orderMatch = raw.match(/order(?:_rate)?[<>=]+\d+/g);
  if (!orderMatch) return '-';
  const conds = orderMatch.map(m => {
    if (m.includes('order_rate')) {
      const val = m.match(/\d+/)?.[0];
      if (m.includes('<=')) {
        return `チャンミ〜${Math.ceil(Number(val) / 100 * 12)}位/LoH〜${Math.ceil(Number(val) / 100 * 15)}位`;
      }
      if (m.includes('>=')) {
        return `チャンミ${Math.ceil(Number(val) / 100 * 12)}位〜/LoH${Math.ceil(Number(val) / 100 * 15)}位〜`;
      }
    }
    if (m.includes('order==')) return `順位==${m.match(/\d+/)?.[0]}`;
    if (m.includes('order>=')) return `順位>=${m.match(/\d+/)?.[0]}`;
    if (m.includes('order<=')) return `順位<=${m.match(/\d+/)?.[0]}`;
    return m;
  });
  return conds.join(', ');
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
const outputPath = values.output;
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
  output(`| 作戦 | ${label}${options.runningStyle !== 'any' ? ' または 無条件' : ''} |`);
}
if (options.distanceType) {
  const label = distanceTypeMap[options.distanceType] || options.distanceType;
  output(`| 距離 | ${label}${options.distanceType !== 'any' ? '（スキル自体に距離制限がないもの）' : ''} |`);
}
if (options.phase) {
  output(`| フェーズ | ${phaseMap[options.phase] || options.phase} |`);
}
if (options.groundType) {
  output(`| バ場 | ${groundTypeMap[options.groundType] || options.groundType} |`);
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
output('| No | スキル名 | 種別 | 順位条件 | その他発動条件 | 速度 | 加速 | 回復 | 持続 | 評価点 |');
output('|---:|----------|------|----------|----------------|-----:|-----:|-----:|-----:|-------:|');

let no = 0;
for (const r of uniqueResults) {
  no++;
  const ep = parseEffectParams(r.effect_params);
  const orderCond = extractOrderCondition(r.activation_condition_raw);
  const otherCond = r.activation_condition_description || '-';
  const subType = subTypeDisplayMap[r.skill_sub_type] || r.skill_sub_type;
  output(
    `| ${no} | ${r.skill_name} | ${subType} | ${orderCond} | ${otherCond} | ` +
    `${ep.speed ?? '-'} | ${ep.accel ?? '-'} | ${ep.heal ?? '-'} | ${ep.duration ?? '-'} | ${r.evaluation_point} |`
  );
}

flushOutput();
