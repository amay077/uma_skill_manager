# Worktree での作業手順

全ステップで**スキル優先**（`worktree-flow`, `backlog-issue`）を適用する。

## 作業フロー

1. **Worktree 作成**：開発用ブランチから分岐、.env コピー、node_modules リンク
2. **ステータス更新（開始時）**：「開発中」に更新、コメント追加
3. **実装作業**：新課題発見時はユーザー承認後に作成
4. **ビルド確認**：README.md の「ビルド確認」セクション参照
5. **コミット & Push**：`git status` → `git add` → `git commit` → `git push`
6. **PR 作成**：ブランチ名から課題キー取得、**分岐元ブランチを確認**してから PR 作成
   - **重要**: PR 作成前に `git log --oneline --graph --decorate -5` で分岐元ブランチを確認
   - worktree 作成時のベースブランチ（`create.sh` の第3引数）と同じブランチに PR を送る
7. **ステータス更新（完了時）**：
   - **完了した場合**：ステータスを「開発完了」に更新し、コメントに最終コミットハッシュを記載（例：「実装完了 (commit: abc1234)」）
   - **未完了の場合**：コメントに「✓実装済：○○機能、□未実装：△△機能、理由：××、最新コミット：abc1234」のように進捗状況を記載し、ステータスは「開発中」のまま
8. **クリーンアップ**：未コミット確認、リンク・.env 削除、worktree 削除、元のディレクトリに明示的に戻る

## クリーンアップ時の注意事項

- **重要**: worktree パスは**絶対パス**で指定すること（相対パスは避ける）
- **重要**: cleanup.sh を実行する前に、main worktree のパス（例: /Volumes/extssd/data/dev/job/suidobata/src2024/admin-api）を保存しておくこと
- **重要**: cleanup.sh 実行後、必ず以下のコマンドで元のプロジェクトディレクトリに戻ること（bash ハング防止）：
  ```bash
  cd /path/to/main/worktree  # 絶対パスで指定
  ```

## bash ハング対策の実行順序

1. main worktree の絶対パスを変数に保存（例: `MAIN_DIR="/Volumes/extssd/data/dev/job/suidobata/src2024/admin-api"`）
2. cleanup.sh を実行
3. cleanup.sh 実行後、即座に `cd "$MAIN_DIR"` を実行

**NG例**：cleanup.sh 実行後に cd を忘れる、または相対パスで cd する
