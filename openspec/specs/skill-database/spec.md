# skill-database Specification

## Purpose
TBD - created by archiving change USM-002-add-skill-database. Update Purpose after archive.
## Requirements
### Requirement: データベーススキーマ定義

システムはスキルデータを格納するための正規化されたデータベーススキーマを提供しなければならない（MUST provide normalized schema）。

#### Scenario: support_cards テーブルの構造

- **GIVEN** SQLite データベースが初期化される
- **WHEN** スキーマが適用される
- **THEN** support_cards テーブルが以下のカラムを持つ:
  - id: INTEGER PRIMARY KEY AUTOINCREMENT
  - costume_name: TEXT NOT NULL（衣装名）
  - character_name: TEXT NOT NULL（キャラ名）
  - full_name: TEXT NOT NULL UNIQUE（[衣装名]キャラ名）

#### Scenario: skills テーブルの構造

- **GIVEN** SQLite データベースが初期化される
- **WHEN** スキーマが適用される
- **THEN** skills テーブルが以下のカラムを持つ:
  - id: INTEGER PRIMARY KEY AUTOINCREMENT
  - name: TEXT NOT NULL（スキル名）
  - support_card_id: INTEGER（外部キー、NULL 許可）
  - type: TEXT NOT NULL（'unique', 'evolution', 'normal'）
  - base_skill_name: TEXT（進化元スキル名、進化スキルのみ）
  - description: TEXT NOT NULL（効果説明）
  - evaluation_point: INTEGER NOT NULL（評価点）
  - popularity: TEXT（人気ステータス）
  - trigger_type: TEXT（発動タイプ）
  - condition_raw: TEXT（発動条件式の生文字列）
  - condition_description: TEXT（条件の日本語解説）

#### Scenario: skill_conditions テーブルの構造

- **GIVEN** SQLite データベースが初期化される
- **WHEN** スキーマが適用される
- **THEN** skill_conditions テーブルが以下のカラムを持つ:
  - id: INTEGER PRIMARY KEY AUTOINCREMENT
  - skill_id: INTEGER NOT NULL（外部キー）
  - group_index: INTEGER NOT NULL（OR グループのインデックス）
  - condition_index: INTEGER NOT NULL（AND 条件のインデックス）
  - variable: TEXT NOT NULL（変数名）
  - operator: TEXT NOT NULL（演算子）
  - value: REAL NOT NULL（比較値）

#### Scenario: effect_parameters テーブルの構造

- **GIVEN** SQLite データベースが初期化される
- **WHEN** スキーマが適用される
- **THEN** effect_parameters テーブルが以下のカラムを持つ:
  - id: INTEGER PRIMARY KEY AUTOINCREMENT
  - skill_id: INTEGER NOT NULL（外部キー）
  - parameter_key: TEXT NOT NULL（パラメータ名）
  - parameter_value: REAL NOT NULL（パラメータ値）

### Requirement: データベース初期化

システムはデータベースファイルの初期化機能を提供しなければならない（MUST provide initialization）。

#### Scenario: 新規データベースの作成

- **GIVEN** データベースファイルが存在しない
- **WHEN** 初期化処理を実行する
- **THEN** `data/uma.db` にデータベースファイルが作成され、全テーブルが定義される

#### Scenario: 既存データベースの再初期化

- **GIVEN** 既存のデータベースファイルが存在する
- **WHEN** `--force` オプション付きで初期化処理を実行する
- **THEN** 既存データベースが削除され、新しいデータベースが作成される

### Requirement: JSON からのインポート

システムは Phase 1 で出力した JSON ファイルからデータをインポートできなければならない（MUST import from JSON）。

#### Scenario: skills.json のインポート

- **GIVEN** `output/skills.json` にパース済みスキルデータが存在する
- **WHEN** `npm run db:import` を実行する
- **THEN** 全スキルデータが適切なテーブルに格納される:
  - サポートカードは重複除去されて support_cards に格納
  - スキルは skills に格納（support_card_id で参照）
  - 条件式は skill_conditions に展開
  - 効果パラメータは effect_parameters に展開

#### Scenario: トランザクションによる原子性保証

- **GIVEN** インポート処理が実行中
- **WHEN** インポート中にエラーが発生する
- **THEN** 全ての変更がロールバックされ、データベースは元の状態を維持する

#### Scenario: 再インポート時のデータクリア

- **GIVEN** 既存データがインポート済み
- **WHEN** 再度インポートを実行する
- **THEN** 既存データは全てクリアされ、新しいデータで置き換えられる

### Requirement: 検索用 VIEW の提供

システムは頻出する検索パターンのための VIEW を提供しなければならない（SHALL provide search views）。

#### Scenario: skill_full_view の提供

- **GIVEN** スキルデータがインポート済み
- **WHEN** `SELECT * FROM skill_full_view WHERE name LIKE '%アクセル%'` を実行する
- **THEN** スキル情報、サポカ情報、効果パラメータが結合された結果が返される

#### Scenario: condition_search_view の提供

- **GIVEN** スキルデータがインポート済み
- **WHEN** `SELECT * FROM condition_search_view WHERE variable = 'distance_rate' AND value >= 50` を実行する
- **THEN** 該当する条件を持つスキルの一覧が返される

#### Scenario: support_card_skills_view の提供

- **GIVEN** スキルデータがインポート済み
- **WHEN** `SELECT * FROM support_card_skills_view WHERE character_name = 'ゴールドシップ'` を実行する
- **THEN** 該当サポカが持つスキル一覧が返される

### Requirement: エラーハンドリング

システムはデータベース操作中のエラーを適切にハンドリングしなければならない（MUST handle errors）。

#### Scenario: データベースファイルへの書き込み権限がない場合

- **GIVEN** `data/` ディレクトリへの書き込み権限がない
- **WHEN** データベース初期化を試みる
- **THEN** "データベースファイルを作成できません: [詳細]" というエラーメッセージを出力する

#### Scenario: 入力 JSON ファイルが存在しない場合

- **GIVEN** 指定された JSON ファイルが存在しない
- **WHEN** インポートを試みる
- **THEN** "入力ファイルが見つかりません: [パス]" というエラーメッセージを出力する

#### Scenario: 不正な JSON フォーマット

- **GIVEN** JSON ファイルが不正なフォーマット
- **WHEN** インポートを試みる
- **THEN** "JSON パースエラー: [詳細]" というエラーメッセージを出力し、処理を中断する

## Related Changes

- [2025-12-30-USM-002-add-skill-database](../../changes/archive/2025-12-30-USM-002-add-skill-database/proposal.md)
