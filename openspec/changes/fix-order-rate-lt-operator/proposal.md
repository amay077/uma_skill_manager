# order_rate<N パターンの順位条件パース実装

## Why

`parseOrderFlags` 関数で `order_rate<N` パターン（`<` 演算子）が未実装のため、順位条件を持つスキルが「順位条件無し（1〜9位）」として誤って解釈されている。

### 現状

| 演算子 | 実装状況 |
|--------|---------|
| `order_rate>=N` | ✅ 実装済 |
| `order_rate<=N` | ✅ 実装済 |
| `order_rate>N` | ✅ 実装済 |
| `order_rate<N` | ❌ **未実装** |

### 影響を受けるスキル

| スキル名 | 条件式 | 現在の解釈 | 正しい解釈 |
|---------|--------|-----------|-----------|
| ディオスクロイの流星 | `order_rate<80` | 順位条件無し（1〜9位） | 順位率80%未満（1〜7位） |

## What Changes

- `parser/db/import.ts` の `parseOrderFlags` 関数に `order_rate<N` パターンの処理を追加
- DB のインポートを再実行して `order_flags` を正しく更新

## Impact

- **Affected specs**: skill-effect-variants
- **Affected code**: `parser/db/import.ts`
- **Breaking changes**: なし（バグ修正）
- **Related Issue**: [GitHub Issue #14](https://github.com/amay077/uma_skill_manager/issues/14)
