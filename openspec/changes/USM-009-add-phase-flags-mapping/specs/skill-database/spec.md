# skill-database Specification (Delta)

## ADDED Requirements

### Requirement: フェーズフラグ（phase_flags）のマッピング

システムはスキルの発動条件からフェーズフラグ（phase_flags）を導出しなければならない（MUST derive phase_flags）。フェーズは序盤（0-33%）、中盤（33-66%）、終盤（66-100%）の 3 区分とし、3 桁のビットフラグ（例: '010' = 中盤のみ）で表現する。

#### Scenario: phase 変数による基本マッピング

- **GIVEN** スキルの発動条件に `phase==N` または `phase_random==N` が含まれる
- **WHEN** N=0 の場合
- **THEN** phase_flags='100'（序盤のみ）として登録される
- **WHEN** N=1 の場合
- **THEN** phase_flags='010'（中盤のみ）として登録される
- **WHEN** N=2 の場合
- **THEN** phase_flags='001'（終盤のみ）として登録される

#### Scenario: phase_firsthalf_random 変数によるマッピング

- **GIVEN** スキルの発動条件に `phase_firsthalf_random==N` が含まれる
- **WHEN** N=1 または N=2 の場合（中盤前半/後半ランダム）
- **THEN** phase_flags='010'（中盤のみ）として登録される
- **WHEN** N=3 の場合（終盤前半ランダム）
- **THEN** phase_flags='001'（終盤のみ）として登録される

#### Scenario: phase_laterhalf_random 変数によるマッピング

- **GIVEN** スキルの発動条件に `phase_laterhalf_random==N` が含まれる
- **WHEN** N=0 の場合（序盤後半ランダム）
- **THEN** phase_flags='100'（序盤のみ）として登録される
- **WHEN** N=1 の場合（中盤後半ランダム）
- **THEN** phase_flags='010'（中盤のみ）として登録される

#### Scenario: phase_firsthalf 変数によるマッピング

- **GIVEN** スキルの発動条件に `phase_firsthalf==1` が含まれる
- **WHEN** インポート処理が実行される
- **THEN** phase_flags='010'（中盤のみ）として登録される

#### Scenario: phase_laterhalf 変数によるマッピング

- **GIVEN** スキルの発動条件に `phase_laterhalf==0` が含まれる
- **WHEN** インポート処理が実行される
- **THEN** phase_flags='100'（序盤のみ）として登録される

#### Scenario: 終盤限定パターンによるマッピング

- **GIVEN** スキルの発動条件に終盤限定パターン（`is_finalcorner`, `is_last_straight`, `is_lastspurt` など）が含まれる
- **WHEN** インポート処理が実行される
- **THEN** phase_flags='001'（終盤のみ）として登録される

#### Scenario: distance_rate による動的マッピング

- **GIVEN** スキルの発動条件に `distance_rate>=N` が含まれる
- **WHEN** N>=66 の場合
- **THEN** phase_flags のうち序盤・中盤ビットが 0 になる（終盤のみ発動）
- **WHEN** N>=33 の場合
- **THEN** phase_flags のうち序盤ビットが 0 になる（中盤以降発動）

#### Scenario: 条件なしスキルのデフォルト値

- **GIVEN** スキルの発動条件が空または phase 関連条件を含まない
- **WHEN** インポート処理が実行される
- **THEN** phase_flags='111'（全フェーズ対応）として登録される
