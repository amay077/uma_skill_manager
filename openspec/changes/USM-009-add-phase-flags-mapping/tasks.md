# Tasks for USM-009

## Implementation Tasks

- [ ] 1. `parsePhaseFlags` 関数に `phase_firsthalf_random` パターンを追加
  - `==1`, `==2` → 中盤のみ
  - `==3` → 終盤のみ
- [ ] 2. `parsePhaseFlags` 関数に `phase_laterhalf_random` パターンを追加
  - `==0` → 序盤のみ
  - `==1` → 中盤のみ
- [ ] 3. `parsePhaseFlags` 関数に `phase_firsthalf` パターンを追加
  - `==1` → 中盤のみ
- [ ] 4. `parsePhaseFlags` 関数に `phase_laterhalf` パターンを追加
  - `==0` → 序盤のみ

## Validation Tasks

- [ ] 5. `bulk_skill_update.ts` を実行してデータベースを更新
- [ ] 6. 「フレッシュ☆パーラー」のフェーズが「中」のみになることを確認
- [ ] 7. 他の影響スキルのフェーズが正しく変換されることを確認

## Files to Modify

- `parser/db/import.ts`: `parsePhaseFlags` 関数（line 427-511）
