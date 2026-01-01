# Review: USM-008-fix-inherited-unique-detection

- **Date**: 2026/01/01 21:31 JST
- **Reviewer**: spec-reviewer (Claude)
- **Iteration**: 1 / 10
- **Result**: PASS

## Summary

sub_type カラムの仕様化と inherited_unique 判定ロジック修正の proposal は、問題の背景、解決策、影響範囲が明確に記述されており、OpenSpec の品質基準を満たしている。全ての Requirement に SHALL/MUST が含まれ、各 Requirement に具体的な Scenario が定義されている。

## Issues

指摘事項なし

## Checklist

### A. フォーマット検証
- [x] Requirement に SHALL/MUST が含まれている
- [x] 各 Requirement に Scenario がある
- [x] MODIFIED 要件に元の内容が完全に記載
- [x] proposal.md に Why/What Changes/Impact がある
- [x] openspec validate --strict がパス

### B. 内容面レビュー
- [x] 要件間に矛盾がない
- [x] 曖昧な表現がない
- [x] シナリオがテスト可能
- [x] エッジケース・エラーケースが網羅されている
- [x] 影響範囲が妥当
- [x] ビジネスロジックが整合
- [x] プロジェクトドキュメントと整合

## Detailed Review

### フォーマット検証詳細

1. **proposal.md 構造**: Why/What Changes/Impact セクションが全て存在し、内容も具体的。データ検証結果の表が問題を明確に説明している。

2. **tasks.md 構造**: 実装タスクがセクション分けされ、具体的なファイルパスと修正内容が記載されている。

3. **spec.md フォーマット**:
   - MODIFIED Requirements: 既存の「データベーススキーマ定義」要件が完全に記載され、sub_type カラムが追加されている
   - ADDED Requirements: 新規の「スキル詳細種別（sub_type）の定義」要件が適切に記載
   - 全ての Requirement に「MUST」が含まれている
   - 5 つの Scenario が全て `#### Scenario:` 形式で正しく記載

### 内容面レビュー詳細

1. **問題の明確化**: 評価点 < 300 に基づく判定が不正確であり、☆2 ウマ娘の固有スキルが誤分類される問題を、具体的なデータ（21 件）で示している。

2. **解決策の妥当性**: 「同名スキルの存在有無」による判定は、継承固有スキルの本質（本来の固有スキルから派生したもの）を正確に捉えている。

3. **Scenario のテスト可能性**:
   - 各 Scenario が GIVEN/WHEN/THEN 形式で具体的に記述
   - 条件と期待結果が明確で、テストケースに直接変換可能

4. **エッジケースの網羅**:
   - 固有スキル（同名なし）→ unique
   - 継承固有スキル（同名あり、評価点低）→ inherited_unique
   - 金スキル（SP 合計表記あり）→ gold
   - 白スキル（SP 合計表記なし）→ normal
   - 進化スキル → evolution

5. **影響範囲の妥当性**: 
   - Affected specs: skill-database（適切）
   - Affected code: parser/parser/skillParser.ts, parser/db/import.ts, parser/types/index.ts（関連コードを網羅）
   - Breaking changes: DB 再生成が必要（明記されている）
   - Data impact: 21 件の修正対象を具体的に明示

6. **既存 spec との整合性**: 
   - 既存の skill-database spec の「データベーススキーマ定義」要件を MODIFIED として完全に再記載
   - support_cards テーブル、skill_conditions テーブルなど他のシナリオは変更なしのため含まれていないが、これは delta 形式として適切

## Conclusion

この proposal は OpenSpec の品質基準を満たしており、実装に進めることを推奨します。
