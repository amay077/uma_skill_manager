# Review: USM-007-enhance-skill-search-ui

- **Date**: 2026/01/01 19:56 JST
- **Reviewer**: spec-reviewer (Claude)
- **Iteration**: 1 / 10
- **Result**: FAIL

## Summary

proposal の構造は適切で、openspec validate --strict も通過しています。しかし、MODIFIED Requirements において既存仕様の一部が欠落している問題と、既存スペックとの矛盾が検出されました。

## Validation Result

```
Change 'USM-007-enhance-skill-search-ui' is valid
```

openspec validate --strict: PASS

## Critical Issues

### Issue 1: MODIFIED Requirements に既存シナリオが欠落

- **Severity**: Critical
- **Location**: `specs/skill-search-frontend/spec.md`
- **Description**: 
  - `### Requirement: Basic Skill Search` の MODIFIED において、元の spec に存在する以下のシナリオが欠落しています：
    - `#### Scenario: Search by skill name（スキル名検索）`
    - `#### Scenario: Filter by skill type（種別フィルタ）` - 新しいチェックボックス版に置き換えられたが、元のシナリオを明示的に削除していない
    - `#### Scenario: Filter by evaluation point range（評価点範囲フィルタ）`
  - `### Requirement: Advanced Skill Search` の MODIFIED において、元の spec に存在する以下のシナリオが欠落しています：
    - `#### Scenario: Filter by running style（作戦フィルタ）` - 新しいビットフラグ版に置き換えられたが、元のシナリオを明示的に削除していない
    - `#### Scenario: Filter by distance type（距離フィルタ）`
    - `#### Scenario: Filter by phase（フェーズフィルタ）`
    - `#### Scenario: Filter by effect type（効果種別フィルタ）` - 新しいチェックボックス版に置き換えられたが、元のシナリオを明示的に削除していない
    - `#### Scenario: Filter by order range（順位条件フィルタ）` - 新しい個別チェックボックス版に置き換えられたが、元のシナリオを明示的に削除していない
    - `#### Scenario: Filter by ground type（バ場フィルタ）`
    - `#### Scenario: Exclude demerit skills（デメリット除外）`
  - `### Requirement: Skill Card Display` の MODIFIED において、元の spec に存在する以下のシナリオが欠落しています：
    - `#### Scenario: Display skill card（スキルカード表示）`
    - `#### Scenario: Display condition flags（条件フラグ表示）`
    - `#### Scenario: Expand skill details（詳細展開）`

- **Suggestion**: MODIFIED Requirements には、元の requirement の全内容をコピーし、変更部分を編集する必要があります。欠落したシナリオを含めるか、削除する場合は `## REMOVED Requirements` セクションで明示してください。

### Issue 2: 既存スペックとの矛盾（レスポンシブデザイン）

- **Severity**: Critical
- **Location**: `specs/skill-search-frontend/spec.md`
- **Description**: 
  - 既存 spec の `#### Scenario: Filter panel toggle` では「詳細検索パネルは初期状態で折りたたまれている」と規定されています。
  - 新しい proposal では「詳細検索パネルの折りたたみを廃止し、常時表示に変更」としています。
  - この矛盾を解消するために、`Requirement: Responsive Design` も MODIFIED または部分的に REMOVED として扱う必要があります。

- **Suggestion**: `Requirement: Responsive Design` の `Scenario: Filter panel toggle` を REMOVED または MODIFIED してください。

## Major Issues

### Issue 3: 種別の「白」の定義が不明確

- **Severity**: Major
- **Location**: `proposal.md` Line 18
- **Description**: 種別フィルタに「白」が含まれていますが、spec.md のシナリオでは「白」のテストケースがありません。また「白」が何を意味するか（通常スキル？）の定義が不明確です。

- **Suggestion**: 「白」スキルの定義を明確にし、対応するシナリオを追加してください。例: `#### Scenario: Filter by white skill type（白スキルフィルタ）`

### Issue 4: 効果種別チェックボックスの全チェック/全未チェック時の動作が未定義

- **Severity**: Major
- **Location**: `specs/skill-search-frontend/spec.md`
- **Description**: 種別フィルタやビットフラグ系フィルタには全チェック/全未チェック時のシナリオがありますが、効果種別チェックボックスについては「一部チェック時」のシナリオのみで、全チェック/全未チェック時の動作が定義されていません。

- **Suggestion**: 効果種別フィルタの全チェック/全未チェック時のシナリオを追加してください。

### Issue 5: ビットフラグフィルタロジックの適用対象が不完全

- **Severity**: Major
- **Location**: `specs/skill-search-frontend/spec.md`
- **Description**: `Requirement: Bit Flag Filter Logic` では「作戦、距離、バ場、フェーズ、順位」を対象としていますが、距離、バ場、フェーズについては具体的なシナリオが Advanced Skill Search に追加されていません。

- **Suggestion**: 距離、バ場、フェーズについても具体的な全チェック/全未チェック/一部チェックのシナリオを追加するか、ビットフラグロジックの汎用シナリオで十分である旨を明記してください。

## Minor Issues

### Issue 6: 順位の桁数表記

- **Severity**: Minor
- **Location**: `specs/skill-search-frontend/spec.md` Line 59, 65, 71
- **Description**: 「order_flags の 3 桁目」という表記は 0-indexed か 1-indexed か不明確です。

- **Suggestion**: 「1 桁目 = 1 位」のように明確化するか、ビット位置の定義を追加してください。

### Issue 7: proposal.md に継承固有の DB 値が未記載

- **Severity**: Minor
- **Location**: `proposal.md`
- **Description**: spec.md では `sub_type が「inherited_unique」` と具体的な値が記載されていますが、proposal.md の What Changes セクションには記載がありません。

- **Suggestion**: proposal.md にも技術的な詳細を追記するか、spec.md に委ねる旨を明記してください。

## Recommendations

1. **MODIFIED Requirements の完全性を確保**: 既存の spec.md から該当 Requirement の全内容をコピーし、変更部分のみを編集してください。

2. **Responsive Design との整合性**: 詳細検索パネルの常時表示化に伴い、既存の Responsive Design 仕様との矛盾を解消してください。

3. **全フィルタ種別の動作統一**: 種別フィルタ、効果種別フィルタ、ビットフラグ系フィルタすべてについて、全チェック/全未チェック/一部チェック時の動作を統一的に定義してください。

4. **用語の明確化**: 「白」スキルなど、ドメイン固有の用語は定義を明確にしてください。

## Checklist

### A. フォーマット検証
- [x] Requirement に SHALL/MUST が含まれている
- [x] 各 Requirement に Scenario がある
- [ ] MODIFIED 要件に元の内容が完全に記載 - **NG: 既存シナリオが欠落**
- [x] proposal.md に Why/What Changes/Impact がある
- [x] openspec validate --strict がパス

### B. 内容面レビュー
- [ ] 要件間に矛盾がない - **NG: Responsive Design との矛盾**
- [ ] 曖昧な表現がない - **NG: 「白」の定義不明**
- [x] シナリオがテスト可能
- [ ] エッジケース・エラーケースが網羅されている - **NG: 効果種別の全チェック/全未チェックが未定義**
- [x] 影響範囲が妥当
- [x] ビジネスロジックが整合
- [ ] プロジェクトドキュメントと整合 - **NG: GLOSSARY.md 不存在のため未検証**

## Conclusion

上記の指摘事項（特に Critical の2件と Major の3件）を解消してから再レビューが必要です。MODIFIED Requirements には既存仕様の全内容を含め、既存仕様との矛盾を解消してください。
