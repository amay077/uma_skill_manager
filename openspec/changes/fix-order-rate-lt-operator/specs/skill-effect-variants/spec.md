# skill-effect-variants 仕様変更

## MODIFIED Requirements

### Requirement: 順位条件フラグの生成

システムは発動条件式から順位条件フラグ（order_flags）を生成しなければならない（MUST generate order flags）。

#### Scenario: order_rate<N パターンのパース

- **GIVEN** 発動条件式に `order_rate<80` が含まれる
- **WHEN** `parseOrderFlags` 関数が実行される
- **THEN** `order_flags` は `111111100` を返す（1〜7位で発動可能）

#### Scenario: order_rate<N の変換ロジック

- **GIVEN** `order_rate<N` パターンが検出される
- **WHEN** 9人立てに換算する
- **THEN** `Math.ceil(N / 100 * 9)` 以降の順位（N%以上）を無効化する

#### Scenario: order_rate<50 のケース

- **GIVEN** 発動条件式に `order_rate<50` が含まれる
- **WHEN** `parseOrderFlags` 関数が実行される
- **THEN** `order_flags` は `111100000` を返す（1〜4位で発動可能）

#### Scenario: 既存の order_rate 演算子との互換性

- **GIVEN** 発動条件式に `order_rate>=40&order_rate<80` が含まれる
- **WHEN** `parseOrderFlags` 関数が実行される
- **THEN** 両方の条件が適用され、`order_flags` は `000111100` を返す（4〜7位で発動可能）
