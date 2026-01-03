# Implementation Tasks

## 1. UI 追加

- [x] 1.1 `index.html` に件数選択ドロップダウンを追加（#results-count の横）
- [x] 1.2 ドロップダウンのスタイリング（既存デザインに合わせる）

## 2. JavaScript 実装

- [x] 2.1 `app.js` の state に pageSize プロパティを追加
- [x] 2.2 ドロップダウン変更時のイベントリスナーを追加
- [x] 2.3 `performSearch()` で state.pageSize を使用するよう修正
- [x] 2.4 `Pagination.js` の `renderPagination()` で動的 pageSize に対応
- [x] 2.5 `Pagination.js` の `updateResultsCount()` で動的 pageSize に対応

## 3. テスト

- [x] 3.1 E2E テストに件数選択機能のテストを追加
- [x] 3.2 手動確認（各件数オプションでページネーションが正しく動作するか）

## 4. 検証

- [ ] 4.1 `npm run test` でテスト通過を確認
- [ ] 4.2 `npm run build` でビルド確認
