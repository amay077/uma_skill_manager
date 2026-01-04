# Implementation Tasks

## 実装

- [ ] `parser/db/import.ts` の `parseOrderFlags` 関数に `order_rate<N` パターンの処理を追加
  - `order_rate>N` パターンの実装を参考に、`<` 演算子用のロジックを追加
  - 正規表現: `/order_rate<(\d+)(?!=)/`
  - 変換ロジック: `Math.ceil(rate / 100 * 9)` 以降の順位を無効化

## テスト

- [ ] `parser/db/import.ts` の既存テストが PASS することを確認
- [ ] `order_rate<80` の条件が正しく `order_flags = '111111100'`（1〜7位）に変換されることを確認

## データ更新

- [ ] DB インポートを再実行して `order_flags` を更新
- [ ] 「ディオスクロイの流星」の `order_flags` が正しく更新されたことを確認
