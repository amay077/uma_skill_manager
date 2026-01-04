# skill-search-frontend Spec Delta

## MODIFIED Requirements

### Requirement: Filter Logic（フィルタロジック）

システムはフィルタ条件の適用ルールを以下のように処理しなければならない（SHALL）。

#### Scenario: No filter selected（フィルタ未選択時）

- **GIVEN** ユーザーがフィルタを選択していない（全チェック OFF）
- **WHEN** 検索を実行する
- **THEN** そのフィルタ条件は適用されず、全スキルが検索対象となる

#### Scenario: All filters selected（全フィルタ選択時）

- **GIVEN** ユーザーが全てのフィルタを選択している（全チェック ON）
- **WHEN** 検索を実行する
- **THEN** 全チェック OFF と同じ挙動となり、全スキルが検索対象となる

#### Scenario: Partial filter selected（一部フィルタ選択時）

- **GIVEN** ユーザーが一部のフィルタのみを選択している
- **WHEN** 検索を実行する
- **THEN** 選択された条件のいずれかを満たすスキルが検索対象となる（OR 検索）

#### Scenario: Multiple filter categories（複数カテゴリのフィルタ）

- **GIVEN** ユーザーが複数カテゴリでフィルタを選択している（例: 作戦と距離）
- **WHEN** 検索を実行する
- **THEN** 各カテゴリの条件を全て満たすスキルが検索対象となる（AND 検索）

#### Scenario: Unrestricted filter selected（制限なしフィルタ選択時）

- **GIVEN** ユーザーがビットフラグ系フィルター（距離・作戦・バ場・フェーズ）で「制限なし」を選択している
- **WHEN** 検索を実行する
- **THEN** 該当フラグが全ビット ON のスキルのみが検索対象となる
- **AND** 距離の場合は `distance_flags = '1111'` のスキル
- **AND** 作戦の場合は `running_style_flags = '1111'` のスキル
- **AND** バ場の場合は `ground_flags = '11'` のスキル
- **AND** フェーズの場合は `phase_flags = '111'` のスキル

## ADDED Requirements

### Requirement: Unrestricted Filter Option（制限なしフィルタオプション）

システムはビットフラグ系フィルターに「制限なし」オプションを提供しなければならない（SHALL）。

#### Scenario: Display unrestricted option（制限なしオプション表示）

- **GIVEN** ユーザーが詳細検索パネルを開いている
- **WHEN** ビットフラグ系フィルター（距離・作戦・バ場・フェーズ）を確認する
- **THEN** 各フィルターに「制限なし」チェックボックスが表示される

#### Scenario: Exclusive selection with unrestricted（制限なし選択時の排他制御）

- **GIVEN** ユーザーがビットフラグ系フィルターを操作している
- **WHEN** 「制限なし」チェックボックスを ON にする
- **THEN** 同じフィルター内の他のチェックボックス（短距離、マイル等）が自動的に OFF になる

#### Scenario: Exclusive selection with specific options（個別オプション選択時の排他制御）

- **GIVEN** ユーザーがビットフラグ系フィルターを操作している
- **AND** 「制限なし」が ON になっている
- **WHEN** 個別のチェックボックス（短距離、マイル等）を ON にする
- **THEN** 「制限なし」チェックボックスが自動的に OFF になる

#### Scenario: Search with unrestricted distance filter（距離制限なしで検索）

- **GIVEN** ユーザーが距離フィルターで「制限なし」を選択している
- **WHEN** 検索を実行する
- **THEN** 全距離対応のスキル（distance_flags = '1111'）のみが表示される

#### Scenario: Search with unrestricted running style filter（作戦制限なしで検索）

- **GIVEN** ユーザーが作戦フィルターで「制限なし」を選択している
- **WHEN** 検索を実行する
- **THEN** 全作戦対応のスキル（running_style_flags = '1111'）のみが表示される

#### Scenario: Search with unrestricted ground filter（バ場制限なしで検索）

- **GIVEN** ユーザーがバ場フィルターで「制限なし」を選択している
- **WHEN** 検索を実行する
- **THEN** 芝・ダート両対応のスキル（ground_flags = '11'）のみが表示される

#### Scenario: Search with unrestricted phase filter（フェーズ制限なしで検索）

- **GIVEN** ユーザーがフェーズフィルターで「制限なし」を選択している
- **WHEN** 検索を実行する
- **THEN** 全フェーズ対応のスキル（phase_flags = '111'）のみが表示される
