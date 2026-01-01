# USM-009: phase_flags マッピング仕様の追加

## Summary

スキルの発動フェーズ（序盤・中盤・終盤）を判定する `phase_flags` のマッピングルールを仕様化し、未対応の phase 関連変数を追加する。

## Motivation

現在、スキル「フレッシュ☆パーラー」の発動条件 `phase_firsthalf_random==1` が「中盤前半ランダム」を意味するにもかかわらず、`phase_flags='111'`（序・中・終盤）として変換されている。

原因は `parsePhaseFlags` 関数が `phase_firsthalf_random` などの変数を認識していないため。これらの変数のマッピングルールを仕様として明文化し、実装を修正する。

## Scope

- **対象 spec**: `skill-database`
- **影響コンポーネント**: `parser/db/import.ts` の `parsePhaseFlags` 関数

## Affected Specs

| Spec | Action |
|------|--------|
| skill-database | MODIFIED |

## Related Issues

- 該当スキル数（推定）: 約 65 件
