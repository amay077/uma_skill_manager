# Implementation Tasks

## 1. データベーススキーマ設計

- [ ] 1.1 support_cards テーブルの定義（id, costume_name, character_name, full_name）
- [ ] 1.2 skills テーブルの定義（id, name, support_card_id, type, base_skill_name, description, evaluation_point, popularity, trigger_type, condition_raw, condition_description）
- [ ] 1.3 skill_conditions テーブルの定義（id, skill_id, group_index, condition_index, variable, operator, value）
- [ ] 1.4 effect_parameters テーブルの定義（id, skill_id, parameter_key, parameter_value）
- [ ] 1.5 マイグレーションスクリプトの作成（schema.sql）

## 2. データベース接続・初期化

- [ ] 2.1 better-sqlite3 のセットアップ
- [ ] 2.2 データベース接続ユーティリティの実装（src/db/connection.ts）
- [ ] 2.3 スキーマ初期化処理の実装（src/db/schema.ts）
- [ ] 2.4 データベースファイルパスの設定（data/uma.db）

## 3. インポート処理

- [ ] 3.1 JSON 読み込み処理の実装
- [ ] 3.2 support_cards インポート処理（重複除去）
- [ ] 3.3 skills インポート処理（外部キー参照）
- [ ] 3.4 skill_conditions インポート処理（条件式の展開）
- [ ] 3.5 effect_parameters インポート処理（キー・バリュー展開）
- [ ] 3.6 トランザクション処理（全件インポートの原子性保証）
- [ ] 3.7 CLI コマンドの追加（npm run db:import）

## 4. 検索用 VIEW の作成

- [ ] 4.1 skill_full_view（スキル+サポカ+効果パラメータの結合ビュー）
- [ ] 4.2 condition_search_view（条件式での検索用ビュー）
- [ ] 4.3 support_card_skills_view（サポカごとのスキル一覧）

## 5. クエリユーティリティ

- [ ] 5.1 スキル検索関数（名前、種別、サポカでフィルタ）
- [ ] 5.2 条件式検索関数（変数名、演算子、値でフィルタ）
- [ ] 5.3 効果パラメータ検索関数（目標速度、持続時間などでフィルタ）

## 6. テスト

- [ ] 6.1 スキーマ初期化テスト
- [ ] 6.2 インポート処理テスト（正常系）
- [ ] 6.3 インポート処理テスト（異常系：重複データ、不正データ）
- [ ] 6.4 検索クエリテスト
- [ ] 6.5 VIEW の動作確認テスト
