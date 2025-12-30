---
name: skill-search
description: ウマ娘のスキルデータベースから条件に合うスキルを検索する。作戦、距離、発動タイミング、効果種別などの条件でフィルタリング可能。
allowed-tools: "Read,Bash"
---

# スキル検索スキル

ウマ娘のスキルデータベースから条件に合うスキルを検索する。

## 使用方法

```
/skill-search [オプション]
```

## パラメータ

| パラメータ | 値 | 説明 |
|-----------|-----|------|
| `--running-style` | `nige` / `senkou` / `sashi` / `oikomi` | 作戦（指定作戦 + 条件なしスキル） |
| `--distance` | `short` / `mile` / `middle` / `long` | 距離（指定距離 + 条件なしスキル） |
| `--phase` | `early` / `mid` / `late` / `corner` / `straight` / `non_late` | 発動タイミング |
| `--effect` | `speed` / `accel` / `stamina` / `position` / `debuff` | 効果種別 |
| `--order` | `top1` / `top2` / `top4` / `top6` / `mid` / `back` | 順位条件（チャンミ12人換算） |
| `--ground` | `turf` / `dirt` | バ場 |
| `--type` | `unique` / `evolution` / `normal` | スキル種別 |
| `--name` | 文字列 | スキル名（部分一致） |
| `--exclude-demerit` | - | デメリットスキルを除外 |
| `--limit` | 数値 | 結果件数の上限（デフォルト: 50） |

## 順位条件の換算

チャンミ12人立てでの順位率換算:

| 値 | 順位 | 順位率 |
|----|------|--------|
| `top1` | 1位 | ~8.3% |
| `top2` | 1-2位 | ~16.7% |
| `top4` | 1-4位 | ~33.3% |
| `top6` | 1-6位 | ~50% |
| `mid` | 4-8位 | 30-70% |
| `back` | 6位以降 | 50%~ |

## 使用例

### 逃げ用・終盤以外・速度スキル（チャンミ4位以内）

```
/skill-search --running-style nige --phase non_late --effect speed --order top4
```

### コーナースキルを検索

```
/skill-search --phase corner --effect speed
```

### 固有スキルのみ

```
/skill-search --type unique --limit 20
```

### 名前で検索

```
/skill-search --name コーナー
```

## 実装

検索を実行するには、以下のコマンドを実行:

```bash
npx tsx -e "
import { advancedSearch } from './src/db/index.js';

// 検索オプション
const options = {
  runningStyle: 'nige',      // 作戦
  distanceType: 'any',       // 距離
  phase: 'non_late',         // 発動タイミング
  effectType: 'speed',       // 効果種別
  orderRange: 'top4',        // 順位条件
  groundType: 'turf',        // バ場
  skillType: 'any',          // スキル種別（大分類）
  skillSubType: 'normal',    // スキル詳細種別（小分類）
  excludeDemerit: true,      // デメリット除外
  limit: 200,                // 上限
};

const results = advancedSearch(options);

// 日本語変換マップ
const runningStyleMap = { nige: '逃げ', senkou: '先行', sashi: '差し', oikomi: '追込', any: '指定なし' };
const distanceTypeMap = { short: '短距離', mile: 'マイル', middle: '中距離', long: '長距離', any: '指定なし' };
const phaseMap = { early: '序盤', mid: '中盤', late: '終盤', corner: 'コーナー', straight: '直線', non_late: '終盤以外', any: '指定なし' };
const effectTypeMap = { speed: '速度', accel: '加速', stamina: 'スタミナ', position: '位置取り', debuff: 'デバフ', any: '指定なし' };
const orderRangeMap = { top1: '1 位', top2: '1〜2 位', top4: '1〜4 位', top6: '1〜6 位', mid: '中団', back: '後方', any: '指定なし' };
const groundTypeMap = { turf: '芝', dirt: 'ダート', any: '指定なし' };
const skillTypeMap = { unique: '固有スキルのみ', evolution: '進化スキルのみ', normal: '通常スキルのみ', any: '指定なし' };
const skillSubTypeMap = { unique: '固有のみ', inherited_unique: '継承固有のみ', gold: '金スキルのみ', normal: '白スキルのみ', evolution: '進化のみ', any: '指定なし' };
const subTypeDisplayMap = { unique: '固有', inherited_unique: '継承固有', gold: '金', normal: '白', evolution: '進化' };

// effect_params をパースして値を抽出
function parseEffectParams(params) {
  if (!params) return { speed: '-', accel: '-', heal: '-', duration: '-' };
  const map = {};
  params.split(', ').forEach(p => {
    const [key, val] = p.split(':');
    map[key] = Number(val);
  });
  return {
    speed: map.targetSpeed || map.currentSpeed || '-',
    accel: map.targetAccel || map.currentAccel || '-',
    heal: map.heal || '-',
    duration: map.duration || '-',
  };
}

// 順位条件を抽出
function extractOrderCondition(raw) {
  if (!raw) return '-';
  const orderMatch = raw.match(/order(?:_rate)?[<>=]+\\d+/g);
  if (!orderMatch) return '-';
  // 簡易変換
  const conds = orderMatch.map(m => {
    if (m.includes('order_rate')) {
      const val = m.match(/\\d+/)?.[0];
      if (m.includes('<=')) return \`チャンミ〜\${Math.ceil(Number(val) / 100 * 12)}/LoH〜\${Math.ceil(Number(val) / 100 * 15)}\`;
      if (m.includes('>=')) return \`チャンミ\${Math.ceil(Number(val) / 100 * 12)}〜/LoH\${Math.ceil(Number(val) / 100 * 15)}〜\`;
    }
    if (m.includes('order==')) return \`順位==\${m.match(/\\d+/)?.[0]}\`;
    if (m.includes('order>=')) return \`順位>=\${m.match(/\\d+/)?.[0]}\`;
    if (m.includes('order<=')) return \`順位<=\${m.match(/\\d+/)?.[0]}\`;
    return m;
  });
  return conds.join(', ');
}

// 検索条件を出力
console.log('# スキル検索結果');
console.log('');
console.log('## 検索条件');
console.log('');
console.log('| 項目 | 条件 |');
console.log('|------|------|');
console.log(\`| 作戦 | \${runningStyleMap[options.runningStyle] || options.runningStyle}\${options.runningStyle !== 'any' ? ' または 無条件' : ''} |\`);
console.log(\`| 距離 | \${distanceTypeMap[options.distanceType] || options.distanceType}\${options.distanceType !== 'any' ? '（スキル自体に距離制限がないもの）' : ''} |\`);
console.log(\`| フェーズ | \${phaseMap[options.phase] || options.phase} |\`);
console.log(\`| バ場 | \${groundTypeMap[options.groundType] || options.groundType} |\`);
console.log(\`| 順位条件 | \${orderRangeMap[options.orderRange] || options.orderRange}\${options.orderRange !== 'any' ? '（チャンミ換算）' : ''} |\`);
console.log(\`| スキル種別 | \${skillSubTypeMap[options.skillSubType] || skillTypeMap[options.skillType] || '指定なし'} |\`);
console.log(\`| 効果種別 | \${effectTypeMap[options.effectType] || options.effectType}\${options.effectType !== 'any' ? 'スキルのみ' : ''} |\`);
console.log('');
console.log(\`**該当件数: \${results.length} 件**\`);
console.log('');
console.log('---');
console.log('');
console.log('## 検索結果');
console.log('');
console.log('| No | スキル名 | 種別 | 順位条件 | その他発動条件 | 速度 | 加速 | 回復 | 持続 | 評価点 |');
console.log('|---:|----------|------|----------|----------------|-----:|-----:|-----:|-----:|-------:|');

// 重複排除（skill_id でユニーク化）
const seen = new Set();
let no = 0;
for (const r of results) {
  if (seen.has(r.skill_id)) continue;
  seen.add(r.skill_id);
  no++;
  const ep = parseEffectParams(r.effect_params);
  const orderCond = extractOrderCondition(r.activation_condition_raw);
  const otherCond = r.activation_condition_description || '-';
  const subType = subTypeDisplayMap[r.skill_sub_type] || r.skill_sub_type;
  console.log(\`| \${no} | \${r.skill_name} | \${subType} | \${orderCond} | \${otherCond} | \${ep.speed} | \${ep.accel} | \${ep.heal} | \${ep.duration} | \${r.evaluation_point} |\`);
}
"
```

## 注意事項

- 各パラメータで値を指定すると、**その条件に一致 + 条件指定なし** のスキルが返される
- 例: `--running-style nige` → 逃げ専用スキル + 全作戦対応スキル
- `phase: non_late` は「終盤条件を含まない」スキルを返す（序盤/中盤限定ではない）
