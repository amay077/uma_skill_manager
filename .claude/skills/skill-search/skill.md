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
| `-r, --running-style` | `nige` / `senkou` / `sashi` / `oikomi` / `none` | 作戦（指定作戦 + 条件なしスキル、`none` は作戦フリーのみ） |
| `-d, --distance` | `short` / `mile` / `middle` / `long` / `none` | 距離（指定距離 + 条件なしスキル、`none` は距離フリーのみ） |
| `-p, --phase` | `early` / `mid` / `late` / `corner` / `straight` / `non_late` | 発動タイミング |
| `-e, --effect` | `speed` / `accel` / `stamina` / `position` / `debuff` | 効果種別 |
| `-o, --order` | `top1` / `top2` / `top4` / `top6` / `mid` / `back` | 順位条件（チャンミ12人換算） |
| `-g, --ground` | `turf` / `dirt` / `none` | バ場（指定バ場 + 条件なしスキル、`none` はバ場フリーのみ） |
| `-t, --type` | `unique` / `evolution` / `normal` | スキル種別 |
| `-s, --sub-type` | `unique` / `inherited_unique` / `gold` / `normal` / `evolution` | スキル詳細種別（カンマ区切り可） |
| `-n, --name` | 文字列 | スキル名（部分一致） |
| `--exclude-demerit` | - | デメリットスキルを除外 |
| `-l, --limit` | 数値 | 結果件数の上限（デフォルト: 200） |
| `-f, --format` | `table` / `json` / `simple` | 出力形式（デフォルト: table） |
| `--sort` | `effect` / `eval` / `name` | ソート順（デフォルト: effect=速度×持続） |

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

```bash
npx tsx parser/cli/search.ts -r nige -p non_late -e speed -o top4
```

### 白スキル＋固有スキルを検索

```bash
npx tsx parser/cli/search.ts -s normal,unique --exclude-demerit
```

### コーナースキルを検索

```bash
npx tsx parser/cli/search.ts -p corner -e speed
```

### 名前で検索

```bash
npx tsx parser/cli/search.ts -n コーナー
```

### JSON形式で出力

```bash
npx tsx parser/cli/search.ts -r nige -f json
```

### シンプル形式で出力

```bash
npx tsx parser/cli/search.ts -r nige -f simple
```

## 実装

検索を実行するには、以下のコマンドを実行:

```bash
npx tsx parser/cli/search.ts [オプション] -O results/skill-search.md
```

ユーザーからの検索依頼を受けたら、上記コマンドに適切なオプションを付けて実行する。

**重要**: 検索結果は必ず `-O results/skill-search.md` オプションを付けてファイルに保存すること。
出力ファイルは `results/skill-search-YYYYMMDDHHmm.md` の形式でタイムスタンプ付きで保存される。

### オプション対応表

| ユーザー指示 | オプション |
|-------------|-----------|
| 逃げ用 | `-r nige` |
| 先行用 | `-r senkou` |
| 差し用 | `-r sashi` |
| 追込用 | `-r oikomi` |
| 作戦を問わない / 作戦フリー | `-r none` |
| 短距離 | `-d short` |
| マイル | `-d mile` |
| 中距離 | `-d middle` |
| 長距離 | `-d long` |
| 距離を問わない / 距離フリー | `-d none` |
| 序盤 | `-p early` |
| 中盤 | `-p mid` |
| 終盤 | `-p late` |
| 終盤以外 | `-p non_late` |
| コーナー | `-p corner` |
| 直線 | `-p straight` |
| 速度 | `-e speed` |
| 加速 | `-e accel` |
| 芝 | `-g turf` |
| ダート | `-g dirt` |
| バ場を問わない / バ場フリー | `-g none` |
| 1位 | `-o top1` |
| 1〜2位 | `-o top2` |
| 1〜4位 | `-o top4` |
| 1〜6位 | `-o top6` |
| 白スキル | `-s normal` |
| 固有スキル | `-s unique` |
| 金スキル | `-s gold` |
| 白＋固有 | `-s normal,unique` |
| デメリット除外 | `--exclude-demerit` |

## 注意事項

- 各パラメータで値を指定すると、**その条件に一致 + 条件指定なし** のスキルが返される
- 例: `-r nige` → 逃げ専用スキル + 全作戦対応スキル
- `phase: non_late` は「終盤条件を含まない」スキルを返す（序盤/中盤限定ではない）
- ソートはデフォルトで「速度×持続」の降順（効果の高い順）
- 加速スキル検索（`-e accel`）では「加速×持続」の降順でソートされる
