# skill-search-frontend Spec Delta

## MODIFIED Requirements

### Requirement: Filter Logic（フィルタロジック）

システムはフィルタ条件の適用ルールを以下のように処理しなければならない（SHALL）。

#### Scenario: Unrestricted filter selected（制限なしフィルタ選択時）

- **GIVEN** ユーザーがビットフラグ系フィルター（距離・作戦・バ場・フェーズ・順位）で「制限なし」を選択している
- **WHEN** 検索を実行する
- **THEN** 該当フラグが全ビット ON のスキルのみが検索対象となる
- **AND** 距離の場合は `distance_flags = '1111'` のスキル
- **AND** 作戦の場合は `running_style_flags = '1111'` のスキル
- **AND** バ場の場合は `ground_flags = '11'` のスキル
- **AND** フェーズの場合は `phase_flags = '111'` のスキル
- **AND** 順位の場合は `order_flags = '111111111'` のスキル

### Requirement: Unrestricted Filter Option（制限なしフィルタオプション）

システムはビットフラグ系フィルターに「制限なし」オプションを提供しなければならない（SHALL）。

#### Scenario: Display unrestricted option（制限なしオプション表示）

- **GIVEN** ユーザーが詳細検索パネルを開いている
- **WHEN** ビットフラグ系フィルター（距離・作戦・バ場・フェーズ・順位）を確認する
- **THEN** 各フィルターに「制限なし」チェックボックスが表示される

## ADDED Requirements

### Requirement: Order Unrestricted Filter（順位制限なしフィルタ）

システムは順位条件フィルターに「制限なし」オプションを提供しなければならない（SHALL）。

#### Scenario: Exclusive selection with order unrestricted（順位制限なし選択時の排他制御）

- **GIVEN** ユーザーが順位条件フィルターを操作している
- **WHEN** 「制限なし」チェックボックスを ON にする
- **THEN** 同じフィルター内の他のチェックボックス（1位〜9位）が自動的に OFF になる

#### Scenario: Exclusive selection with specific order options（順位個別オプション選択時の排他制御）

- **GIVEN** ユーザーが順位条件フィルターを操作している
- **AND** 「制限なし」が ON になっている
- **WHEN** 個別のチェックボックス（1位〜9位）を ON にする
- **THEN** 「制限なし」チェックボックスが自動的に OFF になる

#### Scenario: Search with unrestricted order filter（順位制限なしで検索）

- **GIVEN** ユーザーが順位条件フィルターで「制限なし」を選択している
- **WHEN** 検索を実行する
- **THEN** 全順位対応のスキル（order_flags = '111111111'）のみが表示される
