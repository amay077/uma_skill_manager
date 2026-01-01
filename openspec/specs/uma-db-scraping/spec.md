# uma-db-scraping Specification

## Purpose
TBD - created by archiving change USM-004-add-uma-db-scraping. Update Purpose after archive.
## Requirements
### Requirement: CLI Interface（CLI インターフェース）

システムは CLI からスキル検索を実行できなければならない（MUST provide）。

#### Scenario: Single skill search（単一スキル検索）

- **GIVEN** `scraping/` ディレクトリで CLI を実行する
- **WHEN** `npx tsx src/search.ts --skill "しゃかりき"` を実行する
- **THEN** 指定スキルの検索結果が Markdown ファイルに出力される

#### Scenario: Multiple skill search（複数スキル検索）

- **GIVEN** `scraping/` ディレクトリで CLI を実行する
- **WHEN** `npx tsx src/search.ts --skill "しゃかりき" --skill "アオハル点火・速"` を実行する
- **THEN** 各スキルの検索結果が1つの Markdown ファイルにセクション別で出力される

#### Scenario: Search options（検索オプション指定）

- **GIVEN** CLI オプションを指定する
- **WHEN** `--white-factor 40 --g1-wins 20 --limit 100` を指定して実行する
- **THEN** 指定した条件で検索が実行される

#### Scenario: Interactive mode（インタラクティブモード）

- **GIVEN** `--interactive` オプションを指定して実行する
- **WHEN** ブラウザでページが表示された後
- **THEN** 「検索条件を設定してください。完了したら Enter を押してください...」と表示し、ユーザーの Enter 入力を待機する
- **AND** Enter 入力後にスキル検索を実行する

### Requirement: Browser Automation（ブラウザ自動化）

システムは Playwright でウマ娘 DB を操作できなければならない（MUST provide）。

#### Scenario: Page navigation（ページ遷移）

- **GIVEN** ブラウザが起動している
- **WHEN** UmaDbClient.launch() を呼び出す
- **THEN** https://uma.pure-db.com/#/search に遷移し、広告ダイアログを閉じる

#### Scenario: Skill selection（スキル選択）

- **GIVEN** 検索ページが表示されている
- **WHEN** searchSkill("しゃかりき") を呼び出す
- **THEN** 白因子（共通スキル）セクションでスキルを選択し、検索を実行する

#### Scenario: Page load timeout（ページ読み込みタイムアウト）

- **GIVEN** ブラウザが起動している
- **WHEN** ページ読み込みが 30 秒以内に完了しない
- **THEN** タイムアウトエラーをスローする

### Requirement: Result Extraction（結果抽出）

システムは検索結果テーブルから因子情報を抽出できなければならない（MUST provide）。

#### Scenario: Extract factor information（因子情報抽出）

- **GIVEN** 検索結果が表示されている
- **WHEN** extractResults() を呼び出す
- **THEN** 以下の情報を含むオブジェクト配列を返す：
  - ユーザー ID
  - 青因子（代表/祖）
  - 赤因子（代表/祖）
  - 緑因子（代表/祖）
  - 白因子数
  - 代表因子数
  - 検索対象スキルの因子値

#### Scenario: No results found（検索結果 0 件）

- **GIVEN** 検索が実行された
- **WHEN** 検索結果が 0 件の場合
- **THEN** 空の配列を返す

### Requirement: Markdown Output（Markdown 出力）

システムは検索結果を Markdown 形式で出力できなければならない（MUST provide）。

#### Scenario: Output format（出力形式）

- **GIVEN** 検索結果が抽出されている
- **WHEN** 出力処理を実行する
- **THEN** 以下の構造の Markdown ファイルが生成される：
  - 検索条件セクション
  - スキルごとの結果テーブル（因子情報を含む）

#### Scenario: Output file naming（出力ファイル命名）

- **GIVEN** 検索が完了している
- **WHEN** ファイルを出力する
- **THEN** `results/skill-search-{timestamp}.md` の形式で保存される

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

## Related Changes

- [2025-12-31-USM-004-add-uma-db-scraping](../../changes/archive/2025-12-31-USM-004-add-uma-db-scraping/proposal.md)
- [2026-01-01-USM-005-add-dynamic-whitefactor-limit](../../changes/archive/2026-01-01-USM-005-add-dynamic-whitefactor-limit/proposal.md)

