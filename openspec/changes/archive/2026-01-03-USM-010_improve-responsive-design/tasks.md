# Implementation Tasks

## 1. CSS 変更（style.css）

- [x] 1.1 タブレット用メディアクエリ追加（768px - 1024px）
  - `.main` パディング縮小
  - `.search-section` パディング縮小
  - `.filter-row` gap 縮小
  - `.checkbox-group`, `.radio-group` gap 縮小
  - `.order-checkboxes label` フォントサイズ縮小
- [x] 1.2 モバイル用メディアクエリ強化
  - `.order-checkboxes` を 3 列グリッドに変更
  - `.checkbox-group:not(.order-checkboxes)` を 2 列グリッドに変更
  - `.skill-card` パディング縮小
- [x] 1.3 折りたたみトグルボタンのスタイル追加
  - `.advanced-toggle-mobile` スタイル定義
  - モバイル時のみ表示する設定
  - `.advanced-panel.collapsed` 非表示スタイル

## 2. HTML 変更（index.html）

- [x] 2.1 折りたたみトグルボタンを `#advanced-panel` の前に追加

## 3. JavaScript 変更（app.js）

- [x] 3.1 モバイル用詳細パネル折りたたみロジック追加
  - 初期状態でモバイルのみ折りたたみ
  - トグルボタンクリックで展開・折りたたみ
  - 画面サイズ変更時の対応（デスクトップ/タブレットでは常に展開）

## 4. テスト

- [ ] 4.1 各ブレークポイントでの表示確認
  - Desktop（>= 1025px）
  - Tablet（768px - 1024px）
  - Mobile（<= 767px）
- [ ] 4.2 折りたたみ機能の動作確認
  - 初期表示時の折りたたみ状態
  - トグル動作
  - 画面サイズ変更時の挙動
