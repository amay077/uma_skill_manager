# 検索条件の保存

## Why

現在、スキル検索の検索条件はメモリ内のみで保持されており、ページをリロードすると失われる。頻繁に使用する検索条件を毎回入力するのは非効率であり、よく使う条件セットを保存・再利用したいというユーザー要望がある（GitHub Issue #12）。

## What Changes

- 現在の検索条件を名前を付けて localStorage に保存する機能を追加
- 保存した検索条件の一覧表示・選択・削除 UI を検索フォーム内（クリアボタン付近）に配置
- 保存済み条件を選択すると即座に検索を実行
- 同名の条件が存在する場合は確認ダイアログを表示して上書き可能
- 最大10件まで保存可能

## Impact

- **Affected specs**: skill-search-frontend（UI 追加による MODIFIED）
- **Affected code**:
  - `web/public/index.html` - 保存 UI 追加
  - `web/public/css/style.css` - 保存 UI スタイル追加
  - `web/public/js/components/SavedSearchManager.js` - 新規作成
  - `web/public/js/components/SearchForm.js` - 復元機能追加
  - `web/public/js/app.js` - イベント連携
- **Breaking changes**: なし（新機能追加のみ）
