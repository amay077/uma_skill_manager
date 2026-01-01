# Implementation Tasks

## Spec 更新

- [x] skill-database spec に sub_type カラムを追加

## パーサー修正

- [x] `parser/parser/skillParser.ts`: `determineSubType` 関数を修正
  - unique タイプは一律 `unique` として返す（評価点判定を削除）
- [x] `parser/types/index.ts`: SkillSubType の JSDoc コメントを更新

## DB インポート修正

- [x] `parser/db/import.ts`: `fixInheritedUniqueSkills` 関数を修正
  - 「同名の unique スキルが存在する normal スキル」を `inherited_unique` に更新
  - 評価点 300 の条件を削除

## テスト・検証

- [x] 既存テストの実行と修正
- [x] DB 再生成して 21 件のスキルが正しく `unique` になることを確認
  - unique: 238 件 → 259 件（+21 件）
  - inherited_unique: 261 件 → 240 件（-21 件）
