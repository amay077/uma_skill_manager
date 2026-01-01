## ADDED Requirements

### Requirement: DuckDB-WASM Database Initialization（DuckDB-WASM データベース初期化）

システムは CDN から DuckDB-WASM をロードし、SQLite ファイルを読み込み可能な状態に初期化しなければならない（SHALL）。

#### Scenario: DuckDB-WASM initialization success（初期化成功）

- **GIVEN** ブラウザが ES Modules をサポートしている
- **WHEN** ページがロードされる
- **THEN** DuckDB-WASM が CDN から読み込まれる
- **AND** uma.db が fetch され登録される
- **AND** sqlite_scanner 拡張機能がロードされる
- **AND** SQLite DB への接続が確立される

#### Scenario: Loading indicator display（ローディング表示）

- **GIVEN** DuckDB-WASM の初期化中である
- **WHEN** 初期化が完了していない
- **THEN** ローディングインジケータが表示される
- **AND** 検索フォームは操作不可の状態である

### Requirement: Basic Skill Search（基本スキル検索）

システムはスキル名、種別、評価点による基本検索機能を提供しなければならない（SHALL）。

#### Scenario: Search by skill name（スキル名検索）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** スキル名入力欄に「速度」と入力し検索ボタンを押す
- **THEN** スキル名に「速度」を含むスキル一覧が表示される

#### Scenario: Filter by skill type（種別フィルタ）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** 種別で「固有」を選択し検索する
- **THEN** 種別が「固有」のスキルのみが表示される

#### Scenario: Filter by evaluation point range（評価点範囲フィルタ）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** 評価点の範囲を「200〜300」に設定し検索する
- **THEN** 評価点が 200 以上 300 以下のスキルのみが表示される

### Requirement: Advanced Skill Search（詳細スキル検索）

システムは作戦、距離、フェーズ、効果種別、順位条件、バ場による詳細検索機能を提供しなければならない（SHALL）。

#### Scenario: Filter by running style（作戦フィルタ）

- **GIVEN** ユーザーが詳細検索パネルを開いている
- **WHEN** 作戦で「逃げ」を選択し検索する
- **THEN** 逃げ作戦で発動可能なスキルのみが表示される

#### Scenario: Filter by distance type（距離フィルタ）

- **GIVEN** ユーザーが詳細検索パネルを開いている
- **WHEN** 距離で「長距離」を選択し検索する
- **THEN** 長距離レースで発動可能なスキルのみが表示される

#### Scenario: Filter by phase（フェーズフィルタ）

- **GIVEN** ユーザーが詳細検索パネルを開いている
- **WHEN** フェーズで「終盤」を選択し検索する
- **THEN** 終盤で発動可能なスキルのみが表示される

#### Scenario: Filter by effect type（効果種別フィルタ）

- **GIVEN** ユーザーが詳細検索パネルを開いている
- **WHEN** 効果種別で「速度」を選択し検索する
- **THEN** 速度上昇効果を持つスキルのみが表示される

#### Scenario: Filter by order range（順位条件フィルタ）

- **GIVEN** ユーザーが詳細検索パネルを開いている
- **WHEN** 順位条件で「2位以内」を選択し検索する
- **THEN** 2位以内で発動可能なスキルのみが表示される

#### Scenario: Filter by ground type（バ場フィルタ）

- **GIVEN** ユーザーが詳細検索パネルを開いている
- **WHEN** バ場で「芝」を選択し検索する
- **THEN** 芝コースで発動可能なスキルのみが表示される

#### Scenario: Exclude demerit skills（デメリット除外）

- **GIVEN** ユーザーが詳細検索パネルを開いている
- **WHEN** 「デメリット除外」オプションを有効にし検索する
- **THEN** デメリット効果を持つスキルが結果から除外される

### Requirement: Skill Card Display（スキルカード表示）

システムは検索結果をスキルカード形式で表示しなければならない（SHALL）。

#### Scenario: Display skill card（スキルカード表示）

- **GIVEN** 検索結果が存在する
- **WHEN** 結果一覧が表示される
- **THEN** 各スキルがカード形式で表示される
- **AND** スキル名、種別、評価点、サポカ名、説明文が表示される

#### Scenario: Display condition flags（条件フラグ表示）

- **GIVEN** スキルカードが表示されている
- **WHEN** ユーザーがカードを確認する
- **THEN** 作戦、距離、バ場、フェーズの対応状況がアイコンで表示される

#### Scenario: Expand skill details（詳細展開）

- **GIVEN** スキルカードが表示されている
- **WHEN** ユーザーが「詳細」ボタンをクリックする
- **THEN** 発動条件式と効果パラメータが展開表示される

### Requirement: Pagination（ページネーション）

システムは検索結果のページネーション機能を提供しなければならない（SHALL）。

#### Scenario: Navigate pages（ページ移動）

- **GIVEN** 検索結果が 20 件を超える
- **WHEN** ユーザーが「次へ」ボタンをクリックする
- **THEN** 次のページの結果が表示される

#### Scenario: Display result count（件数表示）

- **GIVEN** 検索が実行された
- **WHEN** 結果一覧が表示される
- **THEN** 総件数と現在表示中の件数範囲が表示される

### Requirement: Responsive Design（レスポンシブデザイン）

システムはモバイルデバイスでも適切に表示されなければならない（SHALL）。

#### Scenario: Mobile layout（モバイルレイアウト）

- **GIVEN** ユーザーがモバイルデバイスでアクセスしている
- **WHEN** ページが表示される
- **THEN** 画面幅に応じたレイアウトで表示される
- **AND** 検索フォームが縦並びで表示される
- **AND** スキルカードが 1 列で表示される

#### Scenario: Filter panel toggle（フィルタパネル折りたたみ）

- **GIVEN** ユーザーがモバイルデバイスでアクセスしている
- **WHEN** ページが表示される
- **THEN** 詳細検索パネルは初期状態で折りたたまれている
- **AND** タップで展開・折りたたみが可能である
