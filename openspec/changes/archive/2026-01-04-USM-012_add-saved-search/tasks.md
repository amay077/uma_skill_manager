# Implementation Tasks

## 1. SavedSearchManager コンポーネント作成

- [x] `web/public/js/components/SavedSearchManager.js` を作成
  - localStorage への保存・読み込み・削除機能
  - 最大10件の制限チェック
  - 条件名の重複チェック

## 2. HTML UI 追加

- [x] `web/public/index.html` の search-actions セクション（クリアボタン付近）に保存 UI を追加
  - 保存ボタン
  - 保存済み条件セレクトボックス
  - 削除ボタン

## 3. CSS スタイル追加

- [x] `web/public/css/style.css` に保存条件 UI のスタイルを追加
  - レスポンシブ対応
  - 既存のボタンスタイルとの統一

## 4. SearchForm 復元機能

- [x] `web/public/js/components/SearchForm.js` に条件復元メソッドを追加
  - `restoreFormValues(conditions)` メソッド実装

## 5. app.js イベント連携

- [x] `web/public/js/app.js` に保存・削除・選択イベントを追加
  - 保存ボタンクリック時の処理
  - 条件選択時の即時検索実行
  - 削除ボタンクリック時の処理
  - 上書き確認ダイアログ

## 6. テスト

- [ ] 保存機能のテスト
- [ ] 復元・検索実行のテスト
- [ ] 削除機能のテスト
- [ ] 最大件数制限のテスト
- [ ] 上書き確認のテスト
