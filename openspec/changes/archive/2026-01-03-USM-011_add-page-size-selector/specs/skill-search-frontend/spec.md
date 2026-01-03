## MODIFIED Requirements

### Requirement: Pagination（ページネーション）

システムは検索結果のページネーション機能を提供しなければならない（SHALL）。

#### Scenario: Navigate pages（ページ移動）

- **GIVEN** 検索結果がページサイズを超える
- **WHEN** ユーザーが「次へ」ボタンをクリックする
- **THEN** 次のページの結果が表示される

#### Scenario: Display result count（件数表示）

- **GIVEN** 検索が実行された
- **WHEN** 結果一覧が表示される
- **THEN** 総件数と現在表示中の件数範囲が表示される

#### Scenario: Select page size（表示件数選択）

- **GIVEN** ユーザーが検索結果を表示している
- **WHEN** 表示件数ドロップダウンで件数を選択する
- **THEN** 選択した件数で結果が再表示される
- **AND** ページは1ページ目にリセットされる
- **AND** ページネーションが新しい件数に基づいて更新される

#### Scenario: Page size options（表示件数オプション）

- **GIVEN** 検索結果が表示されている
- **WHEN** 表示件数ドロップダウンを確認する
- **THEN** 10, 20, 50, 100, 300 の選択肢が表示される
- **AND** デフォルト値は 20 が選択されている
