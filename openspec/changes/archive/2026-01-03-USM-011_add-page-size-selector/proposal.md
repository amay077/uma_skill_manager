# 検索結果の件数選択機能を追加

## Why

現在、検索結果は1ページあたり20件固定で表示されている。
ユーザーによっては一覧性を重視して50件や100件表示を希望する場合がある。
表示件数を選択可能にすることで、ユーザーの好みに応じた操作性を提供する。

## What Changes

- 検索結果件数表示の横に、表示件数選択ドロップダウンを追加
- 選択可能な件数: 10, 20, 50, 100, 300
- デフォルト値: 20（既存動作を維持）
- 件数変更時は1ページ目にリセット

## Impact

- **Affected specs**: skill-search-frontend (Pagination requirement)
- **Affected code**:
  - `web/public/index.html`
  - `web/public/js/app.js`
  - `web/public/js/components/Pagination.js`
- **Breaking changes**: なし（既存のデフォルト動作を維持）
