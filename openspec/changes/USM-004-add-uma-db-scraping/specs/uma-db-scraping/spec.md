# Uma DB Scraping

## Overview

ウマ娘 DB（https://uma.pure-db.com/#/search）でのフレンド検索を Playwright で自動化し、検索結果を詳細な因子情報テーブルとして出力する。

## Assumptions（前提条件）

- **広告の手動対応**: サイトには全面広告（30 秒程度）が表示されることがある。広告表示時はユーザーが手動で閉じる必要がある（自動化対象外）。

## ADDED Requirements

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
