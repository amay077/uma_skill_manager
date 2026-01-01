# Design: スキル検索フロントエンド

## Context

Phase 2 で構築した SQLite データベース（`data/uma.db`）をブラウザから直接検索可能にする。静的ファイル配信（GitHub Pages）を前提とし、ビルドツールなしで動作する VanillaJS 実装とする。

## Goals / Non-Goals

### Goals

- ブラウザ上で SQLite DB を直接クエリできる
- 静的ファイルのみで動作する（サーバーサイド処理なし）
- 既存の `queries.ts` と同等の検索機能を提供
- モバイル対応のレスポンシブデザイン

### Non-Goals

- PWA 対応（将来拡張）
- オフライン対応（将来拡張）
- データの書き込み・編集機能

## Decisions

### DuckDB-WASM の採用

- **Decision**: DuckDB-WASM + sqlite_scanner 拡張機能を使用
- **Alternatives considered**:
  - sql.js: SQLite の WASM 実装だが、DuckDB の方が高機能
  - IndexedDB: 事前インポートが必要、検索機能が限定的
- **Rationale**: DuckDB-WASM は SQLite ファイルを直接読み込め、CDN から配信可能

### VanillaJS の採用

- **Decision**: フレームワークなしの ES Modules 実装
- **Alternatives considered**:
  - React/Vue: ビルドツールが必要、オーバースペック
  - Svelte: コンパイルが必要
- **Rationale**: ビルドツール不要、保守性が高い、学習コスト低

### CDN 配信

- **Decision**: jsDelivr から DuckDB-WASM を読み込み
- **Rationale**: npm install 不要、バージョン管理が容易

## Architecture

### ディレクトリ構造

```
uma/
├── index.html           # エントリポイント
├── data/
│   └── uma.db           # SQLite DB（既存）
├── css/
│   └── style.css        # スタイル
└── js/
    ├── app.js           # メインアプリ
    ├── db/
    │   ├── init.js      # DuckDB-WASM 初期化
    │   ├── queries.js   # 検索クエリ
    │   └── constants.js # ビットフラグ定義
    └── components/
        ├── SearchForm.js
        ├── SkillCard.js
        ├── FilterPanel.js
        └── Pagination.js
```

### DuckDB-WASM 初期化フロー

```
1. CDN から DuckDB-WASM をロード
2. Worker を生成して DuckDB インスタンスを初期化
3. uma.db を fetch して registerFileBuffer で登録
4. sqlite_scanner 拡張機能をロード
5. ATTACH で SQLite DB を接続
6. 検索クエリの実行が可能に
```

### コンポーネント構成

```
app.js
├── SearchForm.js      # 検索フォーム
│   └── FilterPanel.js # 詳細フィルタ
├── SkillCard.js       # 結果カード
└── Pagination.js      # ページネーション
```

## Risks / Trade-offs

### DB ファイルサイズ

- **Risk**: 2.3MB の DB ファイルを毎回ダウンロード
- **Mitigation**:
  - GitHub Pages の gzip 圧縮で約 700KB に削減
  - 将来的に IndexedDB キャッシュを検討

### ブラウザ互換性

- **Risk**: 古いブラウザで動作しない
- **Mitigation**:
  - 対応ブラウザを明記（Chrome 80+, Firefox 75+, Safari 14+, Edge 80+）
  - IE11 非対応

### WASM 初期化時間

- **Risk**: 初期ロードに数秒かかる
- **Mitigation**:
  - ローディングインジケータを表示
  - 初期化完了までUI操作を無効化

## Open Questions

- IndexedDB キャッシュの優先度（Phase 3 で対応予定）
- ダークモード対応の優先度
