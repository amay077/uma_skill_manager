# スキル検索フロントエンドの構築

## Why

Phase 2 で構築した SQLite データベースは CLI や Node.js 環境からのみアクセス可能であり、ブラウザでのスキル検索ができない。静的ファイル配信可能なフロントエンドを提供することで、以下を実現する：

- GitHub Pages 等での公開によるアクセス性向上
- ブラウザ上での直感的なスキル検索・フィルタリング
- ビルドツール不要の VanillaJS 実装による保守性確保
- DuckDB-WASM による SQLite ファイルの直接読み込み

## What Changes

- DuckDB-WASM 初期化処理の実装（sqlite_scanner 拡張機能）
- 基本検索 UI の実装（名前、種別、評価点）
- 詳細検索 UI の実装（作戦、距離、フェーズ、効果種別、順位、バ場）
- スキルカード形式の結果表示
- ページネーション機能
- レスポンシブデザイン対応

## Impact

- **Affected specs**: skill-database（読み取り専用で参照）
- **Affected code**: `index.html`, `js/`, `css/`（新規）
- **Breaking changes**: なし（新規機能、既存 CLI/API は維持）

## References

以下の参考資料は、この変更提案の元となった計画書です：

- [実装計画書](./references/implementation-plan.md) - Claude Code の Plan mode で作成した詳細計画
