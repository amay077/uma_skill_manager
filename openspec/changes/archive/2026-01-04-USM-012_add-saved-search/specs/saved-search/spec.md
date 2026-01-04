# saved-search Specification

## Purpose

スキル検索の検索条件を localStorage に保存し、再利用可能にする機能を提供する。

## ADDED Requirements

### Requirement: Search Condition Storage（検索条件保存）

システムは現在の検索条件を名前付きで localStorage に保存しなければならない（SHALL）。

#### Scenario: Save current search conditions（現在の検索条件を保存）

- **GIVEN** ユーザーが検索条件を入力している
- **WHEN** 保存ボタンをクリックする
- **THEN** ブラウザの prompt ダイアログが表示され条件名の入力を求められる
- **AND** 条件名を入力して OK をクリックすると検索条件が localStorage に JSON 形式で保存される
- **AND** 保存済み条件セレクトボックスに新しい条件が追加される

#### Scenario: Maximum storage limit（最大保存件数制限）

- **GIVEN** 既に10件の検索条件が保存されている
- **WHEN** 新しい条件を保存しようとする
- **THEN** エラーメッセージ「保存上限（10件）に達しています。不要な条件を削除してください。」が表示される
- **AND** 保存は実行されない

#### Scenario: Storage data format（保存データ形式）

- **GIVEN** 検索条件を保存する
- **WHEN** localStorage に保存される
- **THEN** 以下の形式で保存される
  - キー: `uma-skill-search-saved`
  - 値: `[{name: string, conditions: {...}, savedAt: string (ISO 8601 形式: "2026-01-03T21:42:00.000Z")}]`

#### Scenario: Empty condition name validation（空の条件名バリデーション）

- **GIVEN** ユーザーが保存ボタンをクリックした
- **WHEN** 条件名を空文字または空白のみで入力する
- **THEN** エラーメッセージ「条件名を入力してください。」が表示される
- **AND** 保存は実行されない

#### Scenario: Cancel save operation（保存操作のキャンセル）

- **GIVEN** 条件名入力ダイアログ（prompt）が表示されている
- **WHEN** ユーザーがキャンセルする（ESC キーまたはキャンセルボタン）
- **THEN** 保存は実行されない
- **AND** ダイアログが閉じる

#### Scenario: localStorage unavailable（localStorage 利用不可）

- **GIVEN** ブラウザの localStorage が利用できない（プライベートモード等）
- **WHEN** 保存ボタンをクリックする
- **THEN** エラーメッセージ「ブラウザの設定により検索条件を保存できません。」が表示される
- **AND** 保存機能が無効化される

### Requirement: Saved Search UI（保存済み条件 UI）

システムは検索フォーム内のクリアボタン付近に保存済み条件の UI を提供しなければならない（SHALL）。

#### Scenario: Display saved search UI（保存 UI の表示）

- **GIVEN** ページが読み込まれる
- **WHEN** 検索フォームが表示される
- **THEN** クリアボタンの横に保存ボタンが表示される
- **AND** 保存済み条件セレクトボックスが表示される
- **AND** 削除ボタンが表示される

#### Scenario: Populate saved conditions select（保存済み条件の一覧表示）

- **GIVEN** localStorage に保存済み条件が存在する
- **WHEN** ページが読み込まれる
- **THEN** セレクトボックスに保存済み条件の名前が一覧表示される

#### Scenario: Empty state（保存済み条件が空の状態）

- **GIVEN** localStorage に保存済み条件が存在しない
- **WHEN** ページが読み込まれる
- **THEN** セレクトボックスは空の状態で表示される
- **AND** 削除ボタンは無効化される

#### Scenario: Clear button resets selection（クリアボタンで選択リセット）

- **GIVEN** 保存済み条件が選択されている
- **WHEN** クリアボタンをクリックする
- **THEN** 検索条件がクリアされる
- **AND** 保存済み条件セレクトボックスが未選択状態にリセットされる
- **AND** 削除ボタンは無効化される

### Requirement: Search Condition Restore（検索条件復元）

システムは保存済み条件を選択すると、条件を復元し即座に検索を実行しなければならない（SHALL）。

#### Scenario: Restore and search（条件復元と検索実行）

- **GIVEN** 保存済み条件が存在する
- **WHEN** セレクトボックスから条件を選択する
- **THEN** 検索フォームに条件が復元される
- **AND** 検索が即座に実行される
- **AND** 検索結果が表示される

#### Scenario: Restore all condition types（全条件種別の復元）

- **GIVEN** 以下の条件が保存されている
  - スキル名
  - 種別
  - 評価点範囲
  - 作戦、距離、バ場、フェーズ
  - 効果種別、順位条件
  - デバフスキルを除外
- **WHEN** 条件を選択して復元する
- **THEN** 全ての条件がフォームに正確に復元される

#### Scenario: Unknown condition type handling（不明な条件種別の処理）

- **GIVEN** 保存時と異なるバージョンのシステムで条件を復元する
- **AND** 保存された条件に現在のシステムで利用できないフィルタ項目が含まれる
- **WHEN** 条件を復元しようとする
- **THEN** 不明な条件項目は無視される
- **AND** 既知の条件項目のみがフォームに復元される
- **AND** コンソールに警告メッセージ「不明な条件項目をスキップしました」が出力される

### Requirement: Saved Condition Delete（保存済み条件削除）

システムは保存済み条件を削除できなければならない（SHALL）。

#### Scenario: Delete saved condition（保存済み条件の削除）

- **GIVEN** 保存済み条件が選択されている
- **WHEN** 削除ボタンをクリックする
- **THEN** 確認ダイアログ「この条件を削除しますか？」が表示される
- **AND** 「OK」を選択すると条件が localStorage から削除される
- **AND** セレクトボックスから条件が削除される
- **AND** 「キャンセル」を選択すると削除はキャンセルされる

### Requirement: Overwrite Confirmation（上書き確認）

システムは同名の条件が存在する場合、確認ダイアログを表示しなければならない（SHALL）。

#### Scenario: Overwrite existing condition（既存条件の上書き）

- **GIVEN** 「お気に入り」という名前の条件が既に保存されている
- **WHEN** 同じ名前「お気に入り」で保存しようとする
- **THEN** 上書き確認ダイアログが表示される

#### Scenario: Confirm overwrite（上書きを確認）

- **GIVEN** 上書き確認ダイアログが表示されている
- **WHEN** 「はい」を選択する
- **THEN** 既存の条件が新しい条件で上書きされる

#### Scenario: Cancel overwrite（上書きをキャンセル）

- **GIVEN** 上書き確認ダイアログが表示されている
- **WHEN** 「いいえ」を選択する
- **THEN** 保存はキャンセルされる
- **AND** 既存の条件は変更されない
