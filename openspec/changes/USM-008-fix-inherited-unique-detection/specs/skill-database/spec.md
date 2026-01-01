# skill-database Specification Delta

## MODIFIED Requirements

### Requirement: データベーススキーマ定義

システムはスキルデータを格納するための正規化されたデータベーススキーマを提供しなければならない（MUST provide normalized schema）。

#### Scenario: skills テーブルの構造（sub_type カラム追加）

- **GIVEN** SQLite データベースが初期化される
- **WHEN** スキーマが適用される
- **THEN** skills テーブルが以下のカラムを持つ:
  - id: INTEGER PRIMARY KEY AUTOINCREMENT
  - name: TEXT NOT NULL（スキル名）
  - support_card_id: INTEGER（外部キー、NULL 許可）
  - type: TEXT NOT NULL（'unique', 'evolution', 'normal'）
  - sub_type: TEXT NOT NULL（'unique', 'inherited_unique', 'gold', 'normal', 'evolution'）
  - base_skill_name: TEXT（進化元スキル名、進化スキルのみ）
  - description: TEXT NOT NULL（効果説明）
  - evaluation_point: INTEGER NOT NULL（評価点）
  - popularity: TEXT（人気ステータス）
  - trigger_type: TEXT（発動タイプ）
  - condition_raw: TEXT（発動条件式の生文字列）
  - condition_description: TEXT（条件の日本語解説）

## ADDED Requirements

### Requirement: スキル詳細種別（sub_type）の定義

システムはスキルの詳細種別（sub_type）を以下の基準で分類しなければならない（MUST classify）。

#### Scenario: 固有スキルの sub_type 判定

- **GIVEN** type='unique' のスキルがインポートされる
- **WHEN** 同名のスキルが skills テーブルに存在しない
- **THEN** sub_type='unique' として登録される

#### Scenario: 継承固有スキルの sub_type 判定

- **GIVEN** type='unique' のスキルがインポートされる
- **WHEN** 同名のスキルが skills テーブルに別途存在する
- **THEN** 評価点が低い方のスキルの sub_type が 'inherited_unique' に更新される

#### Scenario: 金スキルの sub_type 判定

- **GIVEN** type='normal' のスキルがインポートされる
- **WHEN** SP 合計表記（「SP+進化元SP」形式）が存在する
- **THEN** sub_type='gold' として登録される

#### Scenario: 白スキルの sub_type 判定

- **GIVEN** type='normal' のスキルがインポートされる
- **WHEN** SP 合計表記が存在しない
- **THEN** sub_type='normal' として登録される

#### Scenario: 進化スキルの sub_type 判定

- **GIVEN** type='evolution' のスキルがインポートされる
- **WHEN** パース処理が完了する
- **THEN** sub_type='evolution' として登録される
