# Implementation Tasks

## 型定義の拡張

- [x] `scraping/src/uma-db/types.ts`: `SkillSearchResult` に `actualWhiteFactor: number` フィールドを追加

## 検索ロジックの実装

- [x] `scraping/src/uma-db/client.ts`: `updateWhiteFactorCondition(value: number)` メソッドを追加（検索条件の白因子欄を更新）
- [x] `scraping/src/uma-db/client.ts`: `searchSkill()` メソッドを修正
  - 検索実行後、結果件数が100件超の場合は白因子下限を+5して再検索
  - 100件以下になるまでループ
  - `SkillSearchResult.actualWhiteFactor` に実際に使用した値を設定

## 出力形式の拡張

- [x] `scraping/src/utils/output.ts`: `outputMarkdown()` の検索条件セクションに「スキル別 白因子合計数下限」テーブルを追加
  - 行: 白因子合計数下限、結果件数
  - 列: 各スキル名

## 動作確認

- [ ] 結果が100件を超えるスキルで動的調整が動作することを確認
- [ ] 出力 Markdown に新しいテーブルが正しく表示されることを確認
