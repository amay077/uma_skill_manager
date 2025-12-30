# Review: USM-002-add-skill-database

- **Date**: 2025/12/30 11:40 JST
- **Reviewer**: spec-reviewer (Claude)
- **Iteration**: 1 / 10
- **Result**: PASS

## Summary

本 proposal は Phase 1 のスキルパーサーで出力した JSON データを SQLite データベースに格納するための仕様であり、フォーマット・内容ともに OpenSpec の品質基準を満たしている。`openspec validate --strict` もパスしており、実装に進めることを推奨する。

## Critical Issues

なし

## Major Issues

なし

## Minor Issues

### Issue 1: effect_parameters テーブルの parameter_value 型

- **Severity**: Minor
- **Location**: `specs/skill-database/spec.md`
- **Line**: 55
- **Description**: `parameter_value: REAL NOT NULL` と定義されているが、Phase 1 の skill-parser spec を見ると効果パラメータは数値（targetSpeed: 1500, duration: 6.0）として扱われている。現状の定義で問題ないが、将来的に文字列型のパラメータが必要になった場合の拡張性について検討の余地がある。
- **Suggestion**: 現時点では REAL で問題ないが、設計判断として design.md に「文字列型パラメータは現時点では想定外、必要時に別テーブルを追加」と明記することを推奨。

### Issue 2: skill_conditions の value 型

- **Severity**: Minor
- **Location**: `specs/skill-database/spec.md`
- **Line**: 45
- **Description**: `value: REAL NOT NULL` と定義されているが、Phase 1 の条件式では整数値（50, 60 など）が主である。REAL 型で問題ないが、精度の観点で INTEGER と REAL の使い分けを検討してもよい。
- **Suggestion**: 現状の REAL で問題ない（将来の小数値条件に対応可能）。設計意図を design.md に記載することを推奨。

### Issue 3: design.md の欠如

- **Severity**: Minor
- **Location**: proposal ルートディレクトリ
- **Description**: AGENTS.md のガイドラインでは「Cross-cutting change（複数サービス/モジュール）」や「significant data model changes」の場合に design.md の作成を推奨している。本 proposal はデータベーススキーマという重要なデータモデル変更を含むため、技術的決定（SQLite 選定理由、better-sqlite3 選定理由、スキーマ設計の根拠）を記載した design.md があるとより良い。
- **Suggestion**: 以下の内容を含む design.md の追加を推奨：
  - SQLite 選定理由（組み込み、セットアップ不要、Claude からの直接クエリ可能）
  - better-sqlite3 選定理由（同期 API、高速、TypeScript 対応）
  - 正規化レベルの決定根拠

## Recommendations

1. **design.md の追加**: 技術選定の根拠を明文化することで、将来のメンテナや他の開発者の理解を助ける。

2. **将来の拡張性の明示**: MCP サーバー化（proposal.md の Why に記載）に向けた設計考慮点があれば design.md に記載する。

3. **テストデータの準備**: tasks.md のテストタスク（6.2, 6.3）で使用するテストデータの準備方法を明確にしておく（Phase 1 の実データを使用するか、テスト用の小規模データを作成するか）。

## Checklist

### A. フォーマット検証
- [x] proposal.md に Why/What Changes/Impact セクションがある
- [x] tasks.md のタスクがチェックリスト形式である
- [x] spec.md の Requirements に SHALL/MUST が含まれている
- [x] spec.md の各 Requirement に `#### Scenario:` がある
- [x] `openspec validate --strict` がパスする

### B. 内容面レビュー
- [x] 要件間に矛盾がない
- [x] 曖昧な表現がない（「適切に」等の排除確認済み）
- [x] シナリオがテスト可能（具体的な SQL クエリ例、エラーメッセージが明示されている）
- [x] エッジケース・エラーケースが網羅されている（書き込み権限、JSON 不正、再インポートなど）
- [x] 影響範囲が妥当（skill-parser への依存、新規ディレクトリ src/db/, data/uma.db）
- [x] ビジネスロジックが整合（Phase 1 の JSON 出力を入力として使用）
- [x] プロジェクトドキュメントと整合（命名規則、フレームワーク選定）

## Conclusion

この proposal は OpenSpec の品質基準を満たしており、実装に進めることを推奨します。Minor Issues として挙げた design.md の追加は任意ですが、技術選定の根拠を明文化することでプロジェクトの保守性が向上します。
