# ウマ娘 DB スクレイピング E2E プロジェクト

## Why

ウマ娘 DB（https://uma.pure-db.com/#/search）でのフレンド検索を現在 Chrome DevTools MCP で手動操作しているが、以下の問題がある：

- 毎回の手動操作に時間がかかる
- セッションが途切れると最初からやり直し
- UID が毎回変わるためスナップショット取得・解析の繰り返しが必要

E2E ライブラリ（Playwright）でスクリプト化することで、コマンド一発で検索・結果抽出を自動化する。

## What Changes

- `scraping/` ディレクトリに独立した Playwright プロジェクトを新規作成
- CLI スクリプトで白因子（共通スキル）検索を自動実行
- 検索結果を詳細な因子情報テーブルとして Markdown 出力

### 出力する情報

| 列 | 内容 |
|----|------|
| ユーザー ID | フレンド申請用 ID |
| 青因子（代表/祖） | スピード、スタミナ等 |
| 赤因子（代表/祖） | 距離・脚質適性 |
| 緑因子（代表/祖） | 固有スキル因子 |
| 白因子数 | 白因子の合計数 |
| 代表因子数 | 代表ウマ娘の因子数 |
| 検索対象スキル | 各スキルの因子値（例: 4（代表2）） |

## Impact

- **Affected specs**: なし（新規機能）
- **Affected code**: `scraping/` ディレクトリ以下に新規作成
- **Breaking changes**: なし

## References

- [uma-db-search-procedure.md](./references/uma-db-search-procedure.md) - MCP 手動操作時の手順書（CSS セレクタ、DOM 構造、抽出スクリプトの参考資料）
