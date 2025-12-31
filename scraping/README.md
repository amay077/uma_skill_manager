# ウマ娘 DB スキル検索ツール

[ウマ娘 DB](https://uma.pure-db.com/#/search) のフレンド検索を自動化し、検索結果を Markdown 形式で出力するツール。

## 機能

- Playwright によるブラウザ自動化
- 複数スキルの一括検索
- ページネーション対応（最大 100 件取得）
- ユーザー別サマリ（網羅率・代表網羅率付き）
- Markdown 形式での結果出力

## 必要環境

- Node.js 20.0.0 以上

## セットアップ

```bash
cd scraping
npm install
npx playwright install chromium
```

## 使い方

### 基本的な使い方

```bash
# 単一スキル検索
npx tsx src/search.ts --skill "しゃかりき"

# 複数スキル検索
npx tsx src/search.ts --skill "しゃかりき" --skill "アオハル点火・速" --skill "地固め"
```

### オプション

| オプション | 短縮形 | 説明 | デフォルト |
|-----------|--------|------|-----------|
| `--skill` | `-s` | 検索するスキル名（複数指定可） | - |
| `--white-factor` | `-w` | 白因子合計数の下限 | 30 |
| `--g1-wins` | `-g` | G1 勝数の下限 | 0 |
| `--limit` | `-l` | 検索結果の上限 | 100 |
| `--no-headless` | - | ブラウザを表示する | - |
| `--interactive` | `-i` | インタラクティブモード | - |
| `--output` | `-o` | 出力ディレクトリ | results |
| `--help` | `-h` | ヘルプを表示 | - |

### 使用例

```bash
# 白因子 45 以上、G1 勝数 20 以上で検索
npx tsx src/search.ts --skill "しゃかりき" --white-factor 45 --g1-wins 20

# インタラクティブモード（ブラウザで条件確認後に Enter で検索開始）
npx tsx src/search.ts --skill "しゃかりき" --interactive

# ブラウザを表示して実行
npx tsx src/search.ts --skill "しゃかりき" --no-headless

# 出力先を指定
npx tsx src/search.ts --skill "しゃかりき" --output ./my-results
```

## 出力形式

検索結果は `results/skill-search-YYYYMMDDHHmmss.md` 形式で出力される。

### 出力内容

1. **検索条件**: 検索日時、スキル、フィルタ条件
2. **ユーザー別サマリ**: 全スキルを横断したユーザー一覧
   - 網羅率: 検索スキルのうち値があるスキルの割合
   - 代表網羅率: 検索スキルのうち代表因子を持つスキルの割合
   - 青/赤/緑因子情報
   - 白因子数、代表因子数
3. **スキルごとの結果**: 各スキルの検索結果一覧

## 注意事項

- サイトには全面広告（30 秒程度）が表示されることがある。広告表示時はユーザーが手動で閉じる必要がある
- サイトへの負荷を考慮し、適度な間隔で使用すること
