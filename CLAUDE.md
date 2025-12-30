<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# AGENTS.md / CLAUDE.md - AI エージェント指示書

※このドキュメントの内容は `AGENTS.md` と `CLAUDE.md` で常に一致させること。更新時は必ず両方を同時に修正する。

このファイルは、対応する AI エージェントがこのリポジトリで作業する際の動作規約を定義する。

## 重要：汎用性の原則

**このドキュメントは、全プロジェクト・全 AI エージェント共通の汎用的な指示書です。**

- プロジェクト固有の情報（プロジェクト名、プロジェクトキー、課題番号など）を記載しない
- プロジェクト固有の情報は、各プロジェクトの **README.md** を参照すること

## 言語設定

- エージェントとの会話はすべて日本語で行う
- Git コミットメッセージも日本語を使用する
- コミット時はチケット番号をコミットメッセージの接頭辞に付与する（例: ABCD-1234 ○○を修正）
- 用語の使用は [GLOSSARY.md](./doc/GLOSSARY.md) の定義に従う

## 対応する AI エージェント

- **Claude Code**（claude.ai/code）
    - 実装要求があるまでは提案や計画の共有に留める
    - 操作ログを簡潔に保持し、不要な再実行を避ける
    - `~/.claude/rules/` のルールを自動読み込み
- **Codex**（Codex CLI）
    - 対話環境はターミナルベースの CLI であり、`shell` 経由でコマンドを実行する
    - コマンド実行時は必ず作業ディレクトリを明示する
    - テキスト出力は簡潔にまとめ、必要な情報のみ提示する
    - **重要**: `~/.claude/rules/` の各ルールファイルを参照すること

## 詳細ルール

詳細は `~/.claude/rules/` を参照：

| ファイル | 内容 |
|----------|------|
| `skills.md` | スキル一覧・優先原則 |
| `behavior.md` | 動作制限・実装前確認ルール |
| `coding.md` | コーディング原則 |
| `git-workflow.md` | Git 操作・コミット規約 |
| `worktree.md` | Worktree 作業手順 |

## プロジェクト情報の参照先

技術的な実装や設計に関する情報は [README.md](./README.md) を起点として参照すること。
README.md には全ドキュメントへのリンクが整理されている。

## Markdown 記述時の注意

- [Markdown スタイルガイド](./docs/markdown-style-guide.md) のカーニングルールを適用すること
- これにより、プロジェクト全体で一貫した日本語表記が保たれる

<!-- 以下は、Claude Code 固有の情報 -->

# SuperClaude Entry Point

@COMMANDS.md
@FLAGS.md
@PRINCIPLES.md
@RULES.md
@MCP.md
@PERSONAS.md
@ORCHESTRATOR.md
@MODES.md
