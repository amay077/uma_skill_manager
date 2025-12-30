# skill-effect-variants Specification

## Purpose
TBD - created by archiving change USM-003-add-skill-effect-variants. Update Purpose after archive.
## Requirements
### Requirement: 効果バリアントの型定義

システムはスキルの複数効果パターンを表現する型を提供しなければならない（MUST provide effect variant types）。

#### Scenario: 条件分岐効果の表現

- **GIVEN** スキル「きせき・おもい・かなで」のデータ
- **WHEN** 効果バリアントをパースする
- **THEN** 以下の 2 つのバリアントが生成される:
  - バリアント 1: 追加条件「短距離、順位<=3」→ 速度 3500 + 現在速度 1500、effect_order=0
  - バリアント 2: 追加条件なし → 速度 3500 のみ、effect_order=0

#### Scenario: 連続発動条件の表現

- **GIVEN** スキル「全力 V サインッ！」のデータ（`A->B` 形式）
- **WHEN** 効果バリアントをパースする
- **THEN** 以下の構造が生成される:
  - triggerCondition: 「最終コーナー以降、横ブロック>=2」
  - activationCondition: 「最終直線、順位<=5」
  - effectParameters: 速度 2500、持続 5.0
  - effect_order=0

#### Scenario: 多段発動効果の表現（メリットのみ）

- **GIVEN** スキル「ミンナノアタシへ！」のデータ
- **WHEN** 効果バリアントをパースする
- **THEN** 以下の 2 つのバリアントが生成される:
  - バリアント 1: 1 回目発動 → 速度 3500、持続 3.0、effect_order=0、is_demerit=false
  - バリアント 2: 2 回目発動（`is_activate_other_skill_detail` + 条件「長距離、順位<=2、距離50%以上」）→ 速度 2500、持続 6.0、effect_order=1、is_demerit=false

#### Scenario: 多段発動効果の表現（デメリットあり）

- **GIVEN** スキル「エンジン点火！」のデータ
- **WHEN** 効果バリアントをパースする
- **THEN** 以下の 2 つのバリアントが生成される:
  - バリアント 1: 1 回目発動 → 速度 500、持続 13.0、effect_order=0、is_demerit=false
  - バリアント 2: 2 回目発動（`is_activate_other_skill_detail`）→ 現在速度 -500、effect_order=1、is_demerit=true

#### Scenario: 3 段以上の発動効果への対応

- **GIVEN** 3 段発動のスキルデータ（将来のゲーム拡張を想定）
- **WHEN** 効果バリアントをパースする
- **THEN** effect_order=0, 1, 2 の 3 つのバリアントが生成される

### Requirement: 効果バリアントの DB スキーマ

システムは効果バリアントを格納するテーブルを提供しなければならない（MUST provide variant tables）。

#### Scenario: skill_effect_variants テーブルの構造

- **GIVEN** データベースが初期化される
- **WHEN** スキーマが適用される
- **THEN** skill_effect_variants テーブルが以下のカラムを持つ:
  - id: INTEGER PRIMARY KEY AUTOINCREMENT
  - skill_id: INTEGER NOT NULL（外部キー）
  - variant_index: INTEGER NOT NULL（条件分岐バリアント順序、0 が最大効果）
  - trigger_condition_raw: TEXT（連続発動の前半条件、NULL 許可）
  - activation_condition_raw: TEXT（発動条件式）
  - activation_condition_description: TEXT（条件の日本語解説）
  - effect_order: INTEGER NOT NULL DEFAULT 0（多段発動の順序、0=1回目、1=2回目、...）
  - is_demerit: INTEGER NOT NULL DEFAULT 0（デメリット効果かどうか、0=false、1=true）

#### Scenario: variant_parameters テーブルの構造

- **GIVEN** データベースが初期化される
- **WHEN** スキーマが適用される
- **THEN** variant_parameters テーブルが以下のカラムを持つ:
  - id: INTEGER PRIMARY KEY AUTOINCREMENT
  - variant_id: INTEGER NOT NULL（外部キー）
  - parameter_key: TEXT NOT NULL
  - parameter_value: REAL NOT NULL

### Requirement: パーサーの複数効果対応

システムは元データから複数の効果パターンをパースできなければならない（MUST parse multiple effect patterns）。

#### Scenario: 同一スキルの複数効果行を検出

- **GIVEN** 以下の TXT データ:
  ```
  きせき・おもい・かなで
  [秋日色アンダンテ]ケイエスミラクル 固有
  ...
  phase==1&...->phase==3&is_lastspurt==1&distance_type==1&order<=3
  「中盤...」の後「終盤、短距離、順位<=3」、目標速度3500、現在速度1500、持続5.0
  phase==1&...->phase==3&is_lastspurt==1
  「中盤...」の後「終盤、ラストスパート」、目標速度3500、持続5.0
  ```
- **WHEN** スキルブロックをパースする
- **THEN** 2 つの効果バリアントが生成される（両方とも effect_order=0）

#### Scenario: 連続発動条件のパース

- **GIVEN** 条件式 `A->B` 形式のデータ
- **WHEN** 条件をパースする
- **THEN** `triggerCondition` と `activationCondition` に分離される

#### Scenario: 多段発動効果のパース

- **GIVEN** `is_activate_other_skill_detail==1` を含む条件式
- **WHEN** 条件をパースする
- **THEN** effect_order が前の効果より 1 大きい値で設定される

#### Scenario: デメリット効果の判定

- **GIVEN** 効果パラメータにマイナス値が含まれる
- **WHEN** バリアントを生成する
- **THEN** is_demerit=true が設定される

### Requirement: 後方互換性の維持

システムは既存の `effectParameters` フィールドとの後方互換性を維持しなければならない（MUST maintain backward compatibility）。

#### Scenario: 既存 API の動作維持

- **GIVEN** 複数効果バリアントを持つスキル
- **WHEN** `skill.effectParameters` を参照する
- **THEN** 最大効果（variant_index=0, effect_order=0）のパラメータが返される

#### Scenario: 既存テストの成功

- **GIVEN** USM-001 で作成したテストスイート
- **WHEN** 全テストを実行する
- **THEN** 全テストが成功する

### Requirement: 検索用 VIEW の拡張

システムは効果バリアントを考慮した検索 VIEW を提供しなければならない（SHALL provide variant-aware views）。

#### Scenario: skill_variants_view の提供

- **GIVEN** スキルデータがインポート済み
- **WHEN** `SELECT * FROM skill_variants_view WHERE skill_name = 'きせき・おもい・かなで'` を実行する
- **THEN** 全効果バリアントの一覧が返される（2 行）

#### Scenario: デメリット効果の除外検索

- **GIVEN** スキルデータがインポート済み
- **WHEN** `SELECT * FROM skill_variants_view WHERE is_demerit = 0` を実行する
- **THEN** デメリット効果を除いたバリアントのみが返される

#### Scenario: 多段発動スキルの検索

- **GIVEN** スキルデータがインポート済み
- **WHEN** `SELECT skill_name, COUNT(*) as stages FROM skill_variants_view GROUP BY skill_id HAVING MAX(effect_order) >= 1` を実行する
- **THEN** 2 段以上の発動を持つスキル一覧が返される（ミンナノアタシへ！、エンジン点火！など）

#### Scenario: 1 回目発動のみの検索

- **GIVEN** スキルデータがインポート済み
- **WHEN** `SELECT * FROM skill_variants_view WHERE effect_order = 0` を実行する
- **THEN** 各スキルの 1 回目発動効果のみが返される

## Related Changes

- [2025-12-30-USM-003-add-skill-effect-variants](../../changes/archive/2025-12-30-USM-003-add-skill-effect-variants/proposal.md)
