# uma-db-scraping Specification Delta

## ADDED Requirements

### Requirement: Dynamic White Factor Limit（白因子下限の動的調整）

システムは検索結果が100件以上の場合、白因子下限を動的に調整しなければならない（MUST adjust）。

注記: サイトは最大100件までしか表示しないため、100件ぴったりでも101件目以降が存在する可能性がある。結果が大幅に減ることを防ぐため、100件未満になる直前の条件（100件以上の結果）を採用する。

#### Scenario: Increment white factor limit when results reach 100（結果が100件以上の場合に白因子下限をインクリメント）

- **GIVEN** CLI で指定された白因子下限値が初期値として設定されている
- **WHEN** 検索結果が100件以上である
- **THEN** 白因子合計数下限を5増加させて再検索する
- **AND** 結果が100件未満になるまで繰り返す

#### Scenario: Use previous limit for extraction（一つ前の条件で結果取得）

- **GIVEN** 白因子下限を調整して検索を繰り返している
- **WHEN** 検索結果が100件未満になる
- **THEN** 一つ前の条件（100件以上だった条件）で結果を取得する
- **AND** 採用した白因子下限値を `SkillSearchResult.actualWhiteFactor` に記録する
- **AND** 100件未満になった条件も `SkillSearchResult.finalWhiteFactor` に記録する

#### Scenario: No adjustment needed（調整不要の場合）

- **GIVEN** CLI で指定された白因子下限値が初期値として設定されている
- **WHEN** 初回検索の結果が100件未満である
- **THEN** 調整せずに結果を取得する
- **AND** CLI で指定された初期値を `SkillSearchResult.actualWhiteFactor` と `SkillSearchResult.finalWhiteFactor` に記録する

### Requirement: Skill-wise Condition Output（スキル別条件の出力）

システムは各スキルで使用した検索条件を Markdown に出力しなければならない（MUST output）。

#### Scenario: Output skill-wise white factor table（スキル別白因子テーブルの出力）

- **GIVEN** 複数スキルの検索が完了している
- **WHEN** Markdown を出力する
- **THEN** 検索条件セクションに「スキル別 白因子合計数下限」テーブルを追加する
- **AND** テーブルは以下の形式とする:
  - 列ヘッダー: 各スキル名
  - 行1: 白因子合計数下限（100件未満になった条件）
  - 行2: 結果件数（100件未満になった件数）
  - 行3: 白因子合計数下限(採用値)（実際に採用した条件）
  - 行4: 結果件数(採用値)（実際に採用した件数、100件以上の場合あり）
