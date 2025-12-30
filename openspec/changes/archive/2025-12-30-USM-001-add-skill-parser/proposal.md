# スキルデータパーサーの実装

## Why

Claude との対話を通じてスキル検索・分析を行うため、`umasim_skill.txt` の生データを構造化されたデータに変換する必要がある。現状はテキストファイルのままであり、プログラムからの効率的なアクセスや検索ができない。

## What Changes

- `umasim_skill.txt` をパースして構造化データに変換するパーサーを実装
- スキルおよびサポートカードの型定義を作成
- JSON 形式での出力機能を提供
- サポートカード一覧の抽出機能を実装

## Impact

- **Affected specs**: なし（新規機能）
- **Affected code**: `src/parser/`, `src/types/`
- **Breaking changes**: なし（新規プロジェクト）
