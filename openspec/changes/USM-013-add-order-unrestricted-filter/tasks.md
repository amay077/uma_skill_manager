# Implementation Tasks

## 1. UI 実装

- [ ] 1.1 `index.html` に順位条件「制限なし」チェックボックスを追加
- [ ] 1.2 CSS で「制限なし」チェックボックスのスタイル調整（必要に応じて）

## 2. フィルター状態管理

- [ ] 2.1 `FilterPanel.js` に `ordersUnrestricted` 状態を追加
- [ ] 2.2 `FilterPanel.js` に排他制御ロジックを追加（`setupBitFlagExclusivity`）
- [ ] 2.3 `FilterPanel.js` の検索条件空チェックに `ordersUnrestricted` を追加

## 3. 検索ロジック

- [ ] 3.1 `queries.js` の `buildOrdersCondition` に `unrestricted` パラメータを追加
- [ ] 3.2 `queries.js` の呼び出し元を修正（`advancedSearch`, `countAdvancedSearch`）
- [ ] 3.3 `app.js` の `buildSearchOptions` で `ordersUnrestricted` を渡すよう修正

## 4. 条件保存・復元

- [ ] 4.1 `app.js` の条件保存に `ordersUnrestricted` を追加
- [ ] 4.2 `SearchForm.js` の `knownKeys` に `ordersUnrestricted` を追加
- [ ] 4.3 `SearchForm.js` に「制限なし」チェックボックスの復元ロジックを追加

## 5. 動作確認

- [ ] 5.1 「制限なし」選択時の排他制御確認
- [ ] 5.2 「制限なし」選択時の検索結果確認（全順位対応スキルのみ表示）
- [ ] 5.3 条件保存・復元の動作確認
