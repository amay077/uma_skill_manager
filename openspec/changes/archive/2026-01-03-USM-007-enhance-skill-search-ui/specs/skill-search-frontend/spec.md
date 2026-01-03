# skill-search-frontend Specification Delta

## MODIFIED Requirements

### Requirement: Basic Skill Search（基本スキル検索）

システムはスキル名、種別、評価点による基本検索機能を提供しなければならない（SHALL）。

#### Scenario: Search by skill name（スキル名検索）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** スキル名入力欄に「速度」と入力し検索ボタンを押す
- **THEN** スキル名に「速度」を含むスキル一覧が表示される

#### Scenario: Filter by skill type with checkbox（種別チェックボックスフィルタ）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** 種別で「固有」と「進化」をチェックし検索する
- **THEN** 種別が「固有」または「進化」のスキルが表示される

#### Scenario: Filter by all skill types checked（種別全チェック時）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** 種別の全てのチェックボックスがチェックされている状態で検索する
- **THEN** 全種別のスキルが表示される（種別でフィルタしない）

#### Scenario: Filter by no skill types checked（種別全未チェック時）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** 種別のチェックボックスが全て未チェックの状態で検索する
- **THEN** 全種別のスキルが表示される（種別でフィルタしない）

#### Scenario: Filter by normal skill type（白スキルフィルタ）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** 種別で「白」のみをチェックし検索する
- **THEN** type が「normal」のスキルのみが表示される

#### Scenario: Filter by inherited unique skill type（継承固有フィルタ）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** 種別で「継承固有」のみをチェックし検索する
- **THEN** sub_type が「inherited_unique」のスキルのみが表示される

#### Scenario: Filter by evaluation point range（評価点範囲フィルタ）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** 評価点の範囲を「200〜300」に設定し検索する
- **THEN** 評価点が 200 以上 300 以下のスキルのみが表示される

### Requirement: Advanced Skill Search（詳細スキル検索）

システムは作戦、距離、フェーズ、効果種別、順位条件、バ場による詳細検索機能を提供しなければならない（SHALL）。詳細検索パネルは常時表示とする。

#### Scenario: Filter by running style with bit flag logic（作戦ビットフラグフィルタ）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** 作戦で「逃げ」のみをチェックし検索する
- **THEN** running_style_flags の 1 ビット目（逃げ）が「1」のスキルが表示される（逃げ限定＋作戦限定なし）

#### Scenario: Filter by running style all checked（作戦全チェック時）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** 作戦の全てのチェックボックスがチェックされている状態で検索する
- **THEN** running_style_flags が「1111」のスキルが表示される（作戦限定なしスキル）

#### Scenario: Filter by running style none checked（作戦全未チェック時）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** 作戦のチェックボックスが全て未チェックの状態で検索する
- **THEN** running_style_flags が「1111」のスキルが表示される（作戦限定なしスキル）

#### Scenario: Filter by distance type（距離フィルタ）

- **GIVEN** ユーザーが詳細検索パネルを確認している
- **WHEN** 距離で「短距離」のみをチェックし検索する
- **THEN** distance_flags の 1 ビット目（短距離）が「1」のスキルが表示される（短距離限定＋距離限定なし）

#### Scenario: Filter by distance all checked（距離全チェック時）

- **GIVEN** ユーザーが詳細検索パネルを確認している
- **WHEN** 距離の全てのチェックボックスがチェックされている状態で検索する
- **THEN** distance_flags が「1111」のスキルが表示される（距離限定なしスキル）

#### Scenario: Filter by distance none checked（距離全未チェック時）

- **GIVEN** ユーザーが詳細検索パネルを確認している
- **WHEN** 距離のチェックボックスが全て未チェックの状態で検索する
- **THEN** distance_flags が「1111」のスキルが表示される（距離限定なしスキル）

#### Scenario: Filter by phase（フェーズフィルタ）

- **GIVEN** ユーザーが詳細検索パネルを確認している
- **WHEN** フェーズで「終盤」のみをチェックし検索する
- **THEN** phase_flags の 3 ビット目（終盤）が「1」のスキルが表示される（終盤限定＋フェーズ限定なし）

#### Scenario: Filter by phase all checked（フェーズ全チェック時）

- **GIVEN** ユーザーが詳細検索パネルを確認している
- **WHEN** フェーズの全てのチェックボックスがチェックされている状態で検索する
- **THEN** phase_flags が「111」のスキルが表示される（フェーズ限定なしスキル）

#### Scenario: Filter by phase none checked（フェーズ全未チェック時）

- **GIVEN** ユーザーが詳細検索パネルを確認している
- **WHEN** フェーズのチェックボックスが全て未チェックの状態で検索する
- **THEN** phase_flags が「111」のスキルが表示される（フェーズ限定なしスキル）

#### Scenario: Filter by effect type with checkbox（効果種別チェックボックスフィルタ）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** 効果種別で「速度」と「加速」をチェックし検索する
- **THEN** 速度上昇効果または加速効果を持つスキルが表示される

#### Scenario: Filter by effect type all checked（効果種別全チェック時）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** 効果種別の全てのチェックボックスがチェックされている状態で検索する
- **THEN** 全効果種別のスキルが表示される（効果種別でフィルタしない）

#### Scenario: Filter by effect type none checked（効果種別全未チェック時）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** 効果種別のチェックボックスが全て未チェックの状態で検索する
- **THEN** 全効果種別のスキルが表示される（効果種別でフィルタしない）

#### Scenario: Filter by individual order position（順位個別フィルタ）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** 順位条件で「3」のみをチェックし検索する
- **THEN** order_flags の 3 ビット目（3 位）が「1」のスキルが表示される

#### Scenario: Filter by multiple order positions（順位複数フィルタ）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** 順位条件で「1」「2」「3」をチェックし検索する
- **THEN** order_flags の 1〜3 ビット目（1〜3 位）のいずれかが「1」のスキルが表示される

#### Scenario: Filter by order all checked（順位全チェック時）

- **GIVEN** ユーザーが検索フォームにアクセスしている
- **WHEN** 順位条件の全てのチェックボックス（1〜9）がチェックされている状態で検索する
- **THEN** order_flags が「111111111」のスキルが表示される（順位限定なしスキル）

#### Scenario: Filter by ground type（バ場フィルタ）

- **GIVEN** ユーザーが詳細検索パネルを確認している
- **WHEN** バ場で「芝」のみをチェックし検索する
- **THEN** ground_flags の 1 ビット目（芝）が「1」のスキルが表示される（芝限定＋バ場限定なし）

#### Scenario: Filter by ground all checked（バ場全チェック時）

- **GIVEN** ユーザーが詳細検索パネルを確認している
- **WHEN** バ場の全てのチェックボックスがチェックされている状態で検索する
- **THEN** ground_flags が「11」のスキルが表示される（バ場限定なしスキル）

#### Scenario: Filter by ground none checked（バ場全未チェック時）

- **GIVEN** ユーザーが詳細検索パネルを確認している
- **WHEN** バ場のチェックボックスが全て未チェックの状態で検索する
- **THEN** ground_flags が「11」のスキルが表示される（バ場限定なしスキル）

#### Scenario: Exclude demerit skills（デメリット除外）

- **GIVEN** ユーザーが詳細検索パネルを確認している
- **WHEN** 「デメリット除外」オプションを有効にし検索する
- **THEN** デメリット効果を持つスキルが結果から除外される

#### Scenario: Advanced panel always visible（詳細検索パネル常時表示）

- **GIVEN** ユーザーがページにアクセスしている
- **WHEN** ページが表示される
- **THEN** 詳細検索パネルが折りたたまれずに表示されている
- **AND** 詳細検索の展開ボタンは存在しない

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

#### Scenario: Display effect value and duration（効果量・効果時間表示）

- **GIVEN** 検索結果が存在する
- **WHEN** 結果一覧が表示される
- **THEN** 各スキルカードに効果量と効果時間が表示される

#### Scenario: Sort by effect value times duration（効果量×効果時間でソート）

- **GIVEN** 検索結果が存在する
- **WHEN** 結果一覧が表示される
- **THEN** 効果量×効果時間の降順でソートされている

#### Scenario: Sort by primary effect type（効果種別優先でソート）

- **GIVEN** 効果種別で「速度」と「加速」がチェックされている
- **WHEN** 検索を実行する
- **THEN** 左端の効果種別（速度）の効果量でソート順が決定される

## REMOVED Requirements

### Requirement: Responsive Design（レスポンシブデザイン）の一部削除

既存仕様の以下のシナリオを削除します。

#### Scenario: Filter panel toggle（フィルタパネル折りたたみ）

- **GIVEN** ユーザーがモバイルデバイスでアクセスしている
- **WHEN** ページが表示される
- **THEN** 詳細検索パネルは初期状態で折りたたまれている
- **AND** タップで展開・折りたたみが可能である

**理由**: 詳細検索パネルを常時表示に変更したため、折りたたみ機能は不要となった。

## ADDED Requirements

### Requirement: Bit Flag Filter Logic（ビットフラグフィルタロジック）

システムはビットフラグ系フィルタ（作戦、距離、バ場、フェーズ、順位）に対して統一されたロジックを適用しなければならない（MUST）。

#### Scenario: Partial check means OR search（一部チェック時は OR 検索）

- **GIVEN** ビットフラグ系フィルタが存在する
- **WHEN** 一部のチェックボックスのみがチェックされている
- **THEN** チェックされたビット位置が「1」のスキルが OR 条件で検索される

#### Scenario: All check means exact match 1111（全チェック時は全ビット 1 検索）

- **GIVEN** ビットフラグ系フィルタが存在する
- **WHEN** 全てのチェックボックスがチェックされている
- **THEN** 該当ビットフラグが全て「1」のスキル（条件限定なし）が検索される

#### Scenario: None check means exact match 1111（全未チェック時は全ビット 1 検索）

- **GIVEN** ビットフラグ系フィルタが存在する
- **WHEN** 全てのチェックボックスが未チェックである
- **THEN** 該当ビットフラグが全て「1」のスキル（条件限定なし）が検索される
