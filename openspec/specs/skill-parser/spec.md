# skill-parser Specification

## Purpose
TBD - created by archiving change USM-001-add-skill-parser. Update Purpose after archive.
## Requirements
### Requirement: 入力ファイルの指定

システムは入力ファイルのパスをコマンドライン引数または設定ファイルで指定できなければならない（MUST accept input path）。

#### Scenario: コマンドライン引数でファイル指定

- **GIVEN** パーサープログラムが起動可能
- **WHEN** `--input assets/umasim_skill.txt` のようにコマンドライン引数でファイルパスを指定する
- **THEN** 指定されたパスからファイルを読み込む

#### Scenario: 相対パスと絶対パスの両方をサポート

- **GIVEN** パーサープログラムが起動可能
- **WHEN** 相対パス `assets/umasim_skill.txt` または絶対パス `/path/to/assets/umasim_skill.txt` を指定する
- **THEN** いずれの形式でもファイルを正しく読み込む

### Requirement: スキルデータのパース

システムは `umasim_skill.txt` を読み込み、各スキルを構造化データに変換しなければならない（SHALL parse）。各ブロックは空行で区切られる。

#### Scenario: 固有スキルのパース

- **GIVEN** 以下の固有スキルブロック:
  ```
  波乱注意砲！
  [レッドストライフ]ゴールドシップ 固有
  レース中間付近で後方にいるとロングスパートをかけて速度をわずかに上げ続ける
  評価点240、人気:スピード30、確定発動
  ->distance_rate>=50&distance_rate<=60&order_rate>50
  「距離割合50～60、順位率50より大（チャンミ6～/LoH7～）」、目標速度1500、持続6.0
  ```
- **WHEN** パーサーがブロックを処理する
- **THEN** 以下のデータが抽出される:
  - スキル名: "波乱注意砲！"
  - サポカ名: "[レッドストライフ]ゴールドシップ"
  - 種別: "固有"
  - 効果説明: "レース中間付近で後方にいるとロングスパートをかけて速度をわずかに上げ続ける"
  - 評価点: 240
  - 人気: "スピード30"
  - 発動タイプ: "確定発動"
  - 発動条件式: "distance_rate>=50&distance_rate<=60&order_rate>50"
  - 効果パラメータ: { targetSpeed: 1500, duration: 6.0 }

#### Scenario: 進化スキルのパース

- **GIVEN** 進化スキルのテキストブロック（種別に `進化(元スキル名)` を含む）
- **WHEN** パーサーがブロックを処理する
- **THEN** 種別「進化」と元スキル名が正しく抽出され、進化元SP（存在する場合）も抽出される

#### Scenario: 通常スキルのパース

- **GIVEN** サポカ名を持たない通常スキルのテキストブロック（2行目にサポカ名がない）
- **WHEN** パーサーがブロックを処理する
- **THEN** サポカ名は null として処理され、他のフィールドは正しく抽出される

### Requirement: 発動条件式のパース

システムは発動条件式（`->` で始まる行）を構造化データに変換しなければならない（MUST parse conditions）。複合条件として `&` による AND 条件と `@` による OR 条件をサポートする。

#### Scenario: AND 条件のパース

- **GIVEN** 発動条件式 `->distance_rate>=50&distance_rate<=60&order_rate>50`
- **WHEN** パーサーが条件式を処理する
- **THEN** 3つの条件が AND で結合されたデータ構造として抽出される:
  - 条件1: distance_rate >= 50
  - 条件2: distance_rate <= 60
  - 条件3: order_rate > 50

#### Scenario: OR 条件のパース

- **GIVEN** 発動条件式 `->order>=3&order_rate<=50&remain_distance<=200&bashin_diff_infront<=1@order>=3&order_rate<=50&remain_distance<=200&bashin_diff_behind<=1`
- **WHEN** パーサーが条件式を処理する
- **THEN** 2つの AND 条件グループが OR で結合されたデータ構造として抽出される

### Requirement: 効果パラメータの抽出

システムは効果パラメータ行から各パラメータ値を抽出しなければならない（MUST extract effect parameters）。

#### Scenario: 複数パラメータの抽出

- **GIVEN** 効果パラメータ行 `「距離割合50～60、順位率50より大（チャンミ6～/LoH7～）」、目標速度1500、持続6.0`
- **WHEN** パーサーがパラメータを抽出する
- **THEN** 以下のパラメータが抽出される:
  - targetSpeed: 1500
  - duration: 6.0

#### Scenario: 加速パラメータを含むケース

- **GIVEN** 効果パラメータ行 `「...」、目標速度1500、加速2000、持続5.0`
- **WHEN** パーサーがパラメータを抽出する
- **THEN** 以下のパラメータが抽出される:
  - targetSpeed: 1500
  - acceleration: 2000
  - duration: 5.0

### Requirement: エラーハンドリング

システムは不正な入力に対して適切にエラーハンドリングを行わなければならない（MUST handle errors）。

#### Scenario: ファイルが存在しない場合

- **GIVEN** 存在しないファイルパスが指定される
- **WHEN** パーサーがファイル読み込みを試みる
- **THEN** "ファイルが見つかりません: [パス]" というエラーメッセージを出力し、プログラムを終了する

#### Scenario: 空ファイルの場合

- **GIVEN** サイズ0バイトの空ファイル
- **WHEN** パーサーがファイルを読み込む
- **THEN** 空の配列を返し、"スキルデータが見つかりませんでした" という警告を出力する

#### Scenario: 不正なフォーマットのブロック

- **GIVEN** 必須フィールド（スキル名、種別、評価点など）が欠落したブロック
- **WHEN** パーサーがブロックを処理する
- **THEN** 該当ブロックをスキップし、"スキルブロック[行番号]のパースに失敗: [理由]" という警告を出力し、処理を継続する

#### Scenario: 読み込み中のIOエラー

- **GIVEN** ファイル読み込み中に I/O エラーが発生
- **WHEN** パーサーが処理を継続しようとする
- **THEN** "ファイル読み込みエラー: [詳細]" というエラーメッセージを出力し、プログラムを終了する

### Requirement: JSON 出力

システムはパース結果を JSON 形式で出力しなければならない（SHALL output）。

#### Scenario: 全スキルの JSON 出力

- **GIVEN** パース済みの全スキルデータ
- **WHEN** JSON 出力を実行する
- **THEN** 全スキルが配列として JSON ファイルに出力される

#### Scenario: 出力ファイルパスの指定

- **GIVEN** パース済みのスキルデータと出力先パス `output/skills.json`
- **WHEN** `--output output/skills.json` を指定して JSON 出力を実行する
- **THEN** 指定されたパスに JSON ファイルが作成される

### Requirement: サポートカード一覧の抽出

システムはスキルデータからユニークなサポートカード一覧を抽出しなければならない（SHALL extract）。

#### Scenario: サポートカード一覧の生成

- **GIVEN** パース済みの全スキルデータ（複数スキルが同じサポカを持つ）
- **WHEN** サポートカード一覧抽出を実行する
- **THEN** 重複を除いたサポートカード一覧（衣装名、キャラ名）が取得できる

## Related Changes

- [2025-12-30-USM-001-add-skill-parser](../../changes/archive/2025-12-30-USM-001-add-skill-parser/proposal.md)
