# スキルデータベースの構築

## Why

Phase 1 で構造化した JSON 形式のスキルデータは、ファイル全体をメモリに読み込む必要があり、複雑な検索クエリの実行が困難である。SQLite データベースに格納することで、以下を実現する：

- 効率的な検索・フィルタリング（発動条件、効果パラメータなど）
- サポートカードとスキルのリレーション管理
- 将来の MCP サーバー化に向けた基盤構築
- Claude からの直接 SQL クエリによるデータ分析

## What Changes

- SQLite データベーススキーマの定義（skills, support_cards, skill_conditions, effect_parameters）
- JSON → SQLite インポート処理の実装
- 検索用 VIEW の作成（skill_full_view, condition_search_view, support_card_skills_view）
- データベース操作用のユーティリティ関数

## Impact

- **Affected specs**: skill-parser（依存関係として参照）
- **Affected code**: `src/db/`, `data/uma.db`
- **Breaking changes**: なし（新規機能、既存 JSON 出力は維持）
