# sub_type カラムの仕様化と inherited_unique 判定ロジックの修正

## Why

現在、skills テーブルの `sub_type` カラムは spec に定義されておらず、`inherited_unique`（継承固有スキル）の判定ロジックが不適切である。

**現状の問題**:
- `sub_type` カラムが skill-database spec に未定義
- 継承固有の判定が「評価点 < 300」に基づいているが、これは不正確
- ☆2 ウマ娘の固有スキル（評価点 240、継承不可）が誤って `inherited_unique` に分類される

**データ検証結果**:

| 評価点 | sub_type | 同名スキル存在 | 件数 | 実態 |
|--------|----------|---------------|------|------|
| 340 | unique | - | 238 | 本来の固有スキル |
| 180 | inherited_unique | あり | 238 | 継承固有スキル（正しい） |
| 240 | inherited_unique | なし | 21 | ☆2 固有スキル（誤分類） |
| 240 | inherited_unique | あり | 2 | 継承固有スキル（正しい） |

**正しい判定ロジック**:
- 継承固有スキル = 同名の固有スキル（type='unique'）が別に存在するスキル
- 固有スキル = 同名スキルが存在しない unique タイプのスキル（☆2 含む）

## What Changes

- skill-database spec に `sub_type` カラムを追加
- 継承固有スキルの判定ロジックを「同名スキルの存在有無」に変更
- パーサー（skillParser.ts）と DB インポート（import.ts）の修正

## Impact

- **Affected specs**: skill-database
- **Affected code**: `parser/parser/skillParser.ts`, `parser/db/import.ts`, `parser/types/index.ts`
- **Breaking changes**: DB 再生成が必要（既存データの sub_type 値が変更される）
- **Data impact**: 21 件のスキルが `inherited_unique` → `unique` に修正される
