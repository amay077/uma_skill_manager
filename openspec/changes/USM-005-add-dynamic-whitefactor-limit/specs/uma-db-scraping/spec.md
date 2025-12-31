# uma-db-scraping Specification Delta

## ADDED Requirements

### Requirement: Dynamic White Factor Limit（白因子下限の動的調整）

システムは検索結果が100件を超える場合、白因子下限を動的に調整しなければならない（MUST adjust）。

#### Scenario: Increment white factor limit when results exceed 100（結果が100件超の場合に白因子下限をインクリメント）

- **GIVEN** CLI で指定された白因子下限値が初期値として設定されている
- **WHEN** 検索結果が100件を超える
- **THEN** 白因子合計数下限を5増加させて再検索する
- **AND** 結果が100件以下になるまで繰り返す

#### Scenario: Use adjusted limit for extraction（調整後の条件で結果取得）

- **GIVEN** 白因子下限を調整して検索を繰り返している
- **WHEN** 検索結果が100件以下になる
- **THEN** その条件で結果を取得する
- **AND** 実際に使用した白因子下限値を `SkillSearchResult.actualWhiteFactor` に記録する

#### Scenario: No adjustment needed（調整不要の場合）

- **GIVEN** CLI で指定された白因子下限値が初期値として設定されている
- **WHEN** 初回検索の結果が100件以下
- **THEN** 調整せずに結果を取得する
- **AND** CLI で指定された初期値を `SkillSearchResult.actualWhiteFactor` に記録する

### Requirement: Skill-wise Condition Output（スキル別条件の出力）

システムは各スキルで使用した検索条件を Markdown に出力しなければならない（MUST output）。

#### Scenario: Output skill-wise white factor table（スキル別白因子テーブルの出力）

- **GIVEN** 複数スキルの検索が完了している
- **WHEN** Markdown を出力する
- **THEN** 検索条件セクションに「スキル別 白因子合計数下限」テーブルを追加する
- **AND** テーブルは以下の形式とする:
  - 列ヘッダー: 各スキル名
  - 行1: 白因子合計数下限（実際に使用した値）
  - 行2: 結果件数（調整後の最終結果件数）
