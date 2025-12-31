# Implementation Tasks

## プロジェクト初期化

- [ ] `scraping/package.json` 作成（playwright, tsx, typescript 依存）
- [ ] `scraping/tsconfig.json` 作成
- [ ] Playwright ブラウザインストール

## 型定義・セレクタ

- [ ] `src/uma-db/types.ts` - 検索条件、検索結果の型定義
- [ ] `src/uma-db/selectors.ts` - CSS セレクタ定義

## クライアント実装

- [ ] `src/uma-db/client.ts` - ブラウザ操作クラス
  - ページ遷移
  - 広告ダイアログ処理
  - 検索条件設定（白因子合計数、G1勝数、検索件数）
  - スキル選択・検索実行
- [ ] `src/uma-db/extractor.ts` - 結果テーブルから因子情報を抽出

## CLI・出力

- [ ] `src/search.ts` - CLI エントリポイント（引数パース、実行制御）
- [ ] `src/utils/output.ts` - Markdown 形式で結果出力

## 動作確認

- [ ] 単一スキル検索テスト
- [ ] 複数スキル検索テスト
