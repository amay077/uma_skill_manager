# Proposal: add-order-unrestricted-filter

## Summary

順位条件フィルターに「制限なし」オプションを追加し、全順位対応のスキル（`order_flags = '111111111'`）のみを抽出できるようにする。

## Motivation

既存の「制限なし」オプション（距離・作戦・バ場・フェーズ）と同様に、順位条件にも「制限なしのスキルのみを抽出したい」というニーズがある。

### データ分布

| フィルター | 全ビット ON 件数 | 割合 |
|-----------|-----------------|------|
| 順位 (111111111) | 1,227 | 52.5% |

※参考: 距離 65%、作戦 68%、バ場 93%、フェーズ 28%

## Scope

- **Modified Specs**: skill-search-frontend

## Design Overview

### UI 変更

順位条件フィルターに「制限なし」チェックボックスを追加（他の選択肢と排他）:

```
順位条件: [1位] [2位] ... [9位] | [制限なし]
```

### 動作仕様

| 操作 | 結果 |
|------|------|
| 「制限なし」ON | 他の選択肢（1〜9位）が自動 OFF |
| 他の選択肢 ON | 「制限なし」が自動 OFF |
| 全 OFF | 条件なし（全スキル対象）- 従来通り |

### 検索ロジック

| 状態 | SQL 条件 |
|------|----------|
| 全 OFF | なし（全スキル） |
| 一部 ON | 該当ビットの OR 検索 |
| 制限なしのみ ON | `order_flags = '111111111'` |

## References

- GitHub Issue: https://github.com/amay077/uma_skill_manager/issues/13
- 関連変更: [2026-01-04-add-unrestricted-filter-option](../archive/2026-01-04-add-unrestricted-filter-option/proposal.md)
