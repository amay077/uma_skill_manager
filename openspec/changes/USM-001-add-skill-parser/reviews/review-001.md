# Review: USM-001-add-skill-parser (Iteration 1)

- **Date**: 2025/12/30 11:15 JST
- **Reviewer**: spec-reviewer (Claude)
- **Iteration**: 1 / 10
- **Result**: FAIL

## Validation Result

```
Change 'USM-001-add-skill-parser' is valid
```

openspec validate --strict: PASS

## Critical Issues

なし

## Major Issues

### Issue 1: エラーハンドリングに関する要件が欠落

- **Severity**: Major
- **Location**: `specs/skill-parser/spec.md`
- **Description**: パースエラー発生時の挙動に関する要件がない。不正なフォーマットの入力や、ファイル読み込み失敗時の振る舞いが定義されていない。
- **Suggestion**: 以下の要件を追加することを推奨:
  - `### Requirement: エラーハンドリング` - 不正なフォーマットのブロック、ファイル読み込み失敗、空ファイル等のケースに対する振る舞いを定義

### Issue 2: 効果パラメータの構造定義が曖昧

- **Severity**: Major
- **Location**: `specs/skill-parser/spec.md`
- **Description**: シナリオ内で「効果パラメータが抽出される」とあるが、効果パラメータの種類（目標速度、加速、持続時間、体力回復など）が具体的に定義されていない。テスト可能なシナリオとするためには、抽出すべきパラメータ種別を明示する必要がある。
- **Suggestion**: Requirement 内または Overview セクションで、効果パラメータの種類を列挙するか、シナリオに具体的な値を含める

### Issue 3: 発動条件式のパース要件が不足

- **Severity**: Major
- **Location**: `specs/skill-parser/spec.md`
- **Description**: 発動条件式（`->` で始まる行）のパース方法が要件として定義されていない。tasks.md には記載があるが、spec.md には反映されていない。複合条件（`@` による OR、`&` による AND）の扱いが不明。
- **Suggestion**: 発動条件式のパース要件を追加し、シナリオで複合条件のパース例を含める

### Issue 4: ファイルパスの指定に関する要件がない

- **Severity**: Major
- **Location**: `specs/skill-parser/spec.md`
- **Description**: proposal.md と tasks.md では `umasim_skill.txt` と記載されているが、実際のファイルは `assets/umasim_skill.txt` に存在する。入力ファイルパスの指定方法が要件として定義されていない。
- **Suggestion**: 入力ファイルパスの指定方法（コマンドライン引数、設定ファイル等）を要件として追加

## Minor Issues

### Issue 5: 型定義が tasks.md にのみ存在

- **Severity**: Minor
- **Location**: `specs/skill-parser/spec.md`, `tasks.md`
- **Description**: tasks.md に EffectParameter 型の定義タスクがあるが、spec.md には対応する型構造の要件がない。
- **Suggestion**: 型構造を spec.md の Overview または要件として明記するか、tasks.md から型定義の詳細を削除して実装時の裁量に委ねる

### Issue 6: シナリオの GIVEN 句が不足

- **Severity**: Minor
- **Location**: `specs/skill-parser/spec.md`
- **Description**: 複数のシナリオで GIVEN 句が省略されているか、具体性が不足している。例えば「固有スキルのテキストブロック」では具体的なサンプルデータがないとテスト作成が困難。
- **Suggestion**: 各シナリオに具体的なサンプルデータを含む GIVEN 句を追加

### Issue 7: 「進化元SP」フィールドの扱いが未定義

- **Severity**: Minor
- **Location**: `specs/skill-parser/spec.md`
- **Description**: 実データには「評価点508、進化元SP330」のように進化元のSPコストが含まれているが、spec.md のシナリオには反映されていない。
- **Suggestion**: 進化スキルのシナリオに「進化元SP」の抽出も含めるか、対象外であることを明記

## Summary

proposal の基本構造（Why/What Changes/Impact）は正しく、openspec validate --strict もパスしている。しかし、データパーサーとして必要なエラーハンドリング要件、詳細なフィールド定義、発動条件式のパース仕様が不足している。特に、エラーケースの取り扱いと効果パラメータの具体的な構造定義がないため、テスト作成や実装の明確な指針として機能しにくい状態にある。

## Checklist

### A. フォーマット検証
- [x] Requirement に SHALL/MUST が含まれている
- [x] 各 Requirement に Scenario がある
- [x] MODIFIED 要件に元の内容が完全に記載（該当なし - 全て ADDED）
- [x] proposal.md に Why/What Changes/Impact がある
- [x] openspec validate --strict がパス

### B. 内容面レビュー
- [x] 要件間に矛盾がない
- [ ] 曖昧な表現がない（「効果パラメータ」の具体的な定義が不足）
- [ ] シナリオがテスト可能（具体的なサンプルデータや期待値が不足）
- [ ] エッジケース・エラーケースが網羅されている（エラーハンドリング要件なし）
- [x] 影響範囲が妥当
- [x] ビジネスロジックが整合
- [x] プロジェクトドキュメントと整合

## Conclusion

上記の指摘事項（特に Major の4件）を解消してから再レビューが必要です。エラーハンドリング要件の追加と、効果パラメータ・発動条件式のパース仕様の具体化を推奨します。
