# 動作制限・実装前確認ルール

## 共通の動作制限

- 既存ファイルの編集を優先し、新規ファイル作成は必要最小限に留める
- ドキュメントファイル（`*.md`）の作成は明示的に要求された場合のみ
- タスクは要求された内容のみを実行し、余計な作業は行わない
- 独断でのコミットは禁止し、必ず指示者の合意を得る
- 過去のコミットを書き換える操作（`git commit --amend` や履歴書き換えを伴うコマンド）は禁止し、常に通常の `git commit` を使用する

## 実装前の確認ルール

- **重要**: 指示者が明示的に指示しない限り、ソースコードの修正を禁止する
- 「実行計画を立てて」「どうすればいい？」などの質問や計画段階では、実際のコード修正を行わない
- 以下の明示的な指示があった場合に限り、ソースコードの修正を許可する：
  - 「実装して」
  - 「修正して」
  - 「コードを書いて」
  - 「作成して」
  - その他、明確に実装を要求する指示
- 計画や提案の段階では、実装内容の説明に留め、実際のコード変更は行わない

## important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
