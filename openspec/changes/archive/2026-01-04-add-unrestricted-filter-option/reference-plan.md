# 距離検索条件の仕様再検討

## 背景・問題

### 現在の仕様
- 距離フィルター: 短距離 / マイル / 中距離 / 長距離 の 4 チェックボックス
- **全 OFF = 全 ON = 条件なし** → 全スキルがヒット

### ニーズの整理
| ニーズ | 現仕様での実現 |
|--------|---------------|
| 「短距離で使えるスキル」を探す | ✅ 短距離 ON → flags に短距離ビット含むスキル |
| 「距離制限なしのスキル」を探す | ❌ 不可能（全 OFF は全スキル対象） |

### データ分布
| distance_flags | スキル数 | 意味 |
|----------------|----------|------|
| `1111` | **1,366** | 全距離対応（条件なし） |
| `0001` | 148 | 短距離限定 |
| `0010` | 238 | マイル限定 |
| `0100` | 100 | 中距離限定 |
| `1000` | 85 | 長距離限定 |
| 複合 | 68 | 複数距離対応 |

---

## ユーザー提案: 「条件無し」チェックボックス追加

```
[短距離] [マイル] [中距離] [長距離] | [条件無し]
```

- 「条件無し」は他の 4 つと**排他**
- 「条件無し」ON → `distance_flags = '1111'` で検索

### メリット
- UI が明確（「条件無し」という明示的な選択肢）
- 実装がシンプル

### デメリット
- 排他制御の実装が必要（UX がやや複雑）
- 「短距離 + 条件無し」のような**複合検索ができない**
  - 例: 「短距離限定 OR 条件なし」のスキルを一度に検索したい場合

---

## 別案

### 案 A: 「全距離対応のみ」トグル

```
[短距離] [マイル] [中距離] [長距離]
☑ 全距離対応のみ
```

- トグル ON → `distance_flags = '1111'` のみ
- トグル OFF → 従来通りの OR 検索
- **4 つのチェックボックスと独立**（排他ではなく無効化）

**メリット**: シンプル、既存 UI への影響小
**デメリット**: 「全距離対応 OR 短距離」のような検索はできない

---

### 案 B: 5 つ目の選択肢として追加（排他なし）

```
[短距離] [マイル] [中距離] [長距離] [全距離対応]
```

- 5 つすべて同列のチェックボックス
- **排他なし**: 複数選択可能
- 「全距離対応」ON → `distance_flags = '1111'` を OR 条件に追加

**検索ロジック**:
- 短距離 ON → `SUBSTR(flags, 1, 1) = '1'`
- 全距離対応 ON → `flags = '1111'`
- 両方 ON → `(SUBSTR(flags, 1, 1) = '1' OR flags = '1111')`

**メリット**:
- 柔軟な検索が可能
- 既存ロジックの自然な拡張
- 排他制御不要

**デメリット**:
- 「全 OFF」と「全距離対応のみ」の区別が必要
- UI ラベルの工夫が必要（「条件無し」vs「全距離対応」）

---

### 案 C: 検索モード切り替え

```
検索モード: ○ 含む  ● 限定
[短距離] [マイル] [中距離] [長距離]
```

- **含む**: そのビットが 1 のスキル（現行動作）
- **限定**: 選択した距離**のみ**対応のスキル

**メリット**: 柔軟性が高い
**デメリット**: UI が複雑、学習コストが高い

---

## 採用: 全ビットフラグ系に「制限なし」追加（統一仕様）

### 対象フィルター

| フィルター | 追加項目 | 全ビット ON 件数 |
|-----------|---------|-----------------|
| 距離 | 「制限なし」 | 1,366 (65%) |
| 作戦 | 「制限なし」 | 1,420 (68%) |
| バ場 | 「制限なし」 | 1,826 (93%) |
| フェーズ | 「制限なし」 | 578 (28%) |

### UI パターン（統一）

```
距離:     [短距離] [マイル] [中距離] [長距離] | [制限なし]
作戦:     [逃げ] [先行] [差し] [追込] | [制限なし]
バ場:     [芝] [ダート] | [制限なし]
フェーズ: [序盤] [中盤] [終盤] | [制限なし]
```

### 動作仕様（全フィルター共通）
| 操作 | 結果 |
|------|------|
| 「制限なし」ON | 他の選択肢が自動 OFF |
| 他の選択肢 ON | 「制限なし」が自動 OFF |
| 全 OFF | 条件なし（全スキル対象） |

### 検索ロジック（全フィルター共通）
| 状態 | SQL 条件 |
|------|----------|
| 全 OFF | なし（全スキル） |
| 一部 ON | 該当ビットの OR 検索 |
| 制限なしのみ ON | `flags = '1111'` (or `'11'`, `'111'`) |

---

## 実装計画

### 修正ファイル
1. `web/public/index.html` - チェックボックス追加
2. `web/public/js/components/FilterPanel.js` - 排他制御 + フィルター状態取得
3. `web/public/js/db/queries.js` - 検索ロジック修正

### 1. HTML 修正 (`web/public/index.html`)

各ビットフラグフィルターに「制限なし」チェックボックスを追加:

```html
<!-- 距離 -->
<label><input type="checkbox" name="distance" value="unrestricted"> 制限なし</label>

<!-- 作戦 -->
<label><input type="checkbox" name="running-style" value="unrestricted"> 制限なし</label>

<!-- バ場 -->
<label><input type="checkbox" name="ground" value="unrestricted"> 制限なし</label>

<!-- フェーズ -->
<label><input type="checkbox" name="phase" value="unrestricted"> 制限なし</label>
```

### 2. FilterPanel.js 修正

汎用的な排他制御メソッドを追加:

```javascript
/**
 * ビットフラグフィルターの排他制御をセットアップ
 * @param {string} filterName - input の name 属性
 */
setupBitFlagExclusivity(filterName) {
  const checkboxes = this.container.querySelectorAll(`input[name="${filterName}"]`);

  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      if (e.target.value === 'unrestricted' && e.target.checked) {
        // 「制限なし」ON → 他を OFF
        checkboxes.forEach(cb => {
          if (cb.value !== 'unrestricted') cb.checked = false;
        });
      } else if (e.target.value !== 'unrestricted' && e.target.checked) {
        // 他の選択肢 ON → 「制限なし」を OFF
        const unrestricted = this.container.querySelector(
          `input[name="${filterName}"][value="unrestricted"]`
        );
        if (unrestricted) unrestricted.checked = false;
      }
    });
  });
}

// 初期化時に全フィルターに適用
init() {
  // ... 既存の初期化処理 ...
  this.setupBitFlagExclusivity('distance');
  this.setupBitFlagExclusivity('running-style');
  this.setupBitFlagExclusivity('ground');
  this.setupBitFlagExclusivity('phase');
}
```

### 3. queries.js 修正

`buildBitFlagCondition` を拡張（統一ロジック）:

```javascript
function buildBitFlagCondition(values, flagColumn, flagLength) {
  const indexMaps = {
    running_style_flags: { nige: 1, senkou: 2, sashi: 3, oikomi: 4 },
    distance_flags: { short: 1, mile: 2, middle: 3, long: 4 },
    ground_flags: { turf: 1, dirt: 2 },
    phase_flags: { early: 1, mid: 2, late: 3 },
  };

  const indexMap = indexMaps[flagColumn];
  if (!indexMap) return null;

  // 「制限なし」が選択されている場合 → 全ビット ON のみ
  if (values?.includes('unrestricted')) {
    return `sev.${flagColumn} = '${'1'.repeat(flagLength)}'`;
  }

  // 全チェック OFF または 全チェック ON → 条件なし
  if (!values || values.length === 0 || values.length === flagLength) {
    return null;
  }

  // 従来の OR 検索
  const orConditions = values.map(v => {
    const idx = indexMap[v];
    if (!idx) return null;
    return `SUBSTR(sev.${flagColumn}, ${idx}, 1) = '1'`;
  }).filter(Boolean);

  if (orConditions.length === 0) return null;
  return `(${orConditions.join(' OR ')})`;
}
```
