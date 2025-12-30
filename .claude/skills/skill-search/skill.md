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

const results = advancedSearch({
  runningStyle: 'nige',      // 作戦
  distanceType: 'long',      // 距離
  phase: 'non_late',         // 発動タイミング
  effectType: 'speed',       // 効果種別
  orderRange: 'top4',        // 順位条件
  groundType: 'turf',        // バ場
  skillType: 'any',          // スキル種別
  excludeDemerit: true,      // デメリット除外
  limit: 50,                 // 上限
});

console.table(results.map(r => ({
  name: r.skill_name,
  type: r.skill_type,
  eval: r.evaluation_point,
  condition: r.activation_condition_description || r.activation_condition_raw?.slice(0, 30),
  effect: r.effect_params?.slice(0, 40),
})));
"
```

## 注意事項

- 各パラメータで値を指定すると、**その条件に一致 + 条件指定なし** のスキルが返される
- 例: `--running-style nige` → 逃げ専用スキル + 全作戦対応スキル
- `phase: non_late` は「終盤条件を含まない」スキルを返す（序盤/中盤限定ではない）
