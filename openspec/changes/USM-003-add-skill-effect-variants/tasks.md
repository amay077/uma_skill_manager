# Implementation Tasks

## 1. 型定義の拡張

- [x] 1.1 `EffectVariant` 型の追加（追加条件 + 効果パラメータ + effect_order + is_demerit）
- [x] 1.2 `Skill` 型に `effectVariants: EffectVariant[]` を追加
- [x] 1.3 連続発動条件（`triggerCondition` + `activationCondition`）の型定義

## 2. パーサーの拡張

- [x] 2.1 複数効果行の検出ロジック追加
- [x] 2.2 連続発動条件（`A->B`）のパース対応
- [x] 2.3 多段発動効果（`is_activate_other_skill_detail`）のパース対応
- [x] 2.4 effect_order の自動割り当てロジック（0=1回目、1=2回目、...）
- [x] 2.5 is_demerit の判定ロジック（マイナス値のパラメータを持つ場合 true）
- [x] 2.6 効果バリアントの優先順位付け（最大効果の特定）

## 3. DB スキーマの拡張

- [x] 3.1 `skill_effect_variants` テーブルの定義（effect_order, is_demerit カラム含む）
- [x] 3.2 `variant_parameters` テーブルの定義（バリアント固有の効果パラメータ）
- [x] 3.3 マイグレーションスクリプトの作成

## 4. インポート処理の拡張

- [x] 4.1 効果バリアントのインポート処理
- [x] 4.2 バリアントパラメータのインポート処理
- [x] 4.3 既存データとの整合性確保

## 5. 検索クエリの拡張

- [x] 5.1 `skill_variants_view` の作成
- [x] 5.2 効果バリアントを含む検索関数の追加
- [x] 5.3 is_demerit でのフィルタリング（デメリット除外検索）
- [x] 5.4 effect_order でのフィルタリング（1回目発動のみ検索）
- [x] 5.5 多段発動スキルの検索（effect_order >= 1 を持つスキル）

## 6. テスト

- [x] 6.1 パーサーテスト（条件分岐、連続発動、多段発動パターン）
- [x] 6.2 インポートテスト（バリアントデータ）
- [x] 6.3 検索テスト（バリアント考慮）
- [x] 6.4 後方互換性テスト
