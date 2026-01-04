# スキル一覧・優先原則

## 使用するスキル一覧

以下のスキルが必要です。**Claude Code** はこれらのスキルを直接使用できます。
**それ以外のエージェント**は、以下の順序で skill.md を探して利用してください：

1. プロジェクトディレクトリ：`./.claude/skills/<スキル名>/skill.md`
2. グローバルディレクトリ：`~/.claude/skills/<スキル名>/skill.md`

| 機能名 | 行える事 | スキル名 |
|--------|---------|----------|
| JST 時刻取得 | 日本標準時の現在時刻を取得 | `jst-time` |
| 課題管理 | 課題作成・取得・ステータス更新・コメント追加・プルリクエスト作成 | `backlog-issue` |
| worktree 管理 | worktree の作成・セットアップ・クリーンアップ・削除 | `worktree-flow` |
| AI 開発環境初期化 | 既存プロジェクトに AI エージェント開発環境を導入 | `init-ai-dev` |
| OpenSpec レビュー・修正 | OpenSpec proposal のレビュー・修正サイクルを自動実行 | `openspec-review-fix` |
| OpenSpec コードレビュー | 実装が spec を満たすかレビュー、結果を報告 | `openspec-code-review` |
| OpenSpec 操作 | proposal/apply/archive スラッシュコマンドへ誘導 | `openspec` |
| デバッグプロトコル | バグ調査時の体系的デバッグ手順を提供 | `debugging` |
| 人間的な文章レビュー | ビジネス文書からAIっぽさを検出し、人間的で自然な文章への改善案を提示 | `human-writing-review` |
| PostgreSQL 操作 | DB 接続、SQL クエリ実行、テーブル一覧・スキーマ確認 | `postgres` |

## スキル優先原則

AI エージェントは、すべての作業を実行する前に、以下の優先順位でツールを選択すること：

1. **スキル（最優先）**: 対応するスキルがあるか確認
   - プロジェクト固有のスキル
   - グローバルに利用可能なスキル
   - ※スキルの検索方法・利用方法は各エージェントの実装に従う
2. **MCP サーバー**: 統合された外部ツールがあるか確認
3. **直接コマンド・API**: 上記が利用できない場合のみ

## スキル確認の習慣化

各作業の開始前に、必ず以下を自問すること：
- 「このタスクに対応する専用スキルはないか？」
- 「利用可能なスキル一覧を確認したか？」

スキルの存在を見落とすと、非効率な実装や不完全な作業につながる。

## OpenSpec 操作時の必須ルール

OpenSpec の proposal/apply/archive を実行する際は、CLI コマンド（`openspec archive` 等）を直接使用せず、**必ず対応するスラッシュコマンドを使用**すること：

| 操作 | スラッシュコマンド |
|------|-------------------|
| proposal 作成 | `/openspec:proposal` |
| 実装適用 | `/openspec:apply` |
| アーカイブ | `/openspec:archive` |

**理由**: スラッシュコマンドには CLI コマンドだけでは実行されない追加手順（index.md 更新、Related Changes 追加など）が含まれている。CLI コマンドのみでは手順が不完全になる。

### proposal 作成時の命名規則確認

proposal を作成する際は、**必ず `openspec/project.md` の命名規則を先に確認**すること。

- **参照すべき情報源**: `openspec/project.md` > 既存の実績（アーカイブ済み proposal）
- **理由**: アーカイブ済み proposal には日付接頭辞（`YYYY-MM-DD-`）が付いているが、これはアーカイブ時に付与されるもの。作成時の命名規則とは異なる。
- **典型的な形式**: `{PROJECT_KEY}-{TASK_ID}-{descriptive-name}`（例: `USM-013-add-feature`）
