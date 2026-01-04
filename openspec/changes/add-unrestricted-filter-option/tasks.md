# Tasks: add-unrestricted-filter-option

## Implementation Tasks

### 1. HTML 修正 - チェックボックス追加

- [ ] 距離フィルターに「制限なし」チェックボックスを追加
- [ ] 作戦フィルターに「制限なし」チェックボックスを追加
- [ ] バ場フィルターに「制限なし」チェックボックスを追加
- [ ] フェーズフィルターに「制限なし」チェックボックスを追加

**ファイル**: `web/public/index.html`

### 2. FilterPanel.js 修正 - 排他制御

- [ ] 汎用排他制御メソッド `setupBitFlagExclusivity()` を追加
- [ ] 初期化時に 4 つのフィルターに排他制御を適用
- [ ] `getFilterState()` で「制限なし」を含む状態取得に対応

**ファイル**: `web/public/js/components/FilterPanel.js`

### 3. queries.js 修正 - 検索ロジック

- [ ] `buildBitFlagCondition()` を拡張して「制限なし」に対応
- [ ] 「制限なし」選択時は `flags = '1111'` 等の完全一致検索を実行

**ファイル**: `web/public/js/db/queries.js`

### 4. 動作確認

- [ ] 各フィルターで「制限なし」選択時に正しい結果が返ることを確認
- [ ] 排他制御が正しく動作することを確認
- [ ] 全 OFF 時は従来通り全スキルが対象となることを確認
- [ ] 保存済み検索条件との互換性を確認

## Validation

- `openspec validate add-unrestricted-filter-option --strict` でエラーなし
- E2E テストで検索機能が正常動作
