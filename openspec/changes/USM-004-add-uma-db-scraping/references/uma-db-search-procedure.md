# ウマ娘 DB フレンド検索手順

Chrome DevTools MCP を使用して https://uma.pure-db.com/ でフレンド検索を行う手順を記録する。

## 前提条件

- Chrome DevTools MCP が利用可能であること
- Chrome ブラウザが起動していること

## 手順

### 1. ページへのナビゲーション

```
mcp__chrome-devtools__navigate_page
- url: "https://uma.pure-db.com/#/search"
```

### 2. 広告ダイアログの処理

ページ読み込み後、「さらに多くのコンテンツを見る」というダイアログが表示される場合がある。

```
mcp__chrome-devtools__press_key
- key: "Escape"
```

### 3. 検索条件の設定（白因子・共通スキルの例）

#### 3.1 白因子（共通スキル）セクションを展開

スナップショットを取得して、「白因子（共通スキル）」ボタンの UID を特定し、クリック。

```
mcp__chrome-devtools__take_snapshot
mcp__chrome-devtools__click
- uid: "<白因子（共通スキル）ボタンの UID>"
```

#### 3.2 スキル選択欄をクリック

展開後、空のスキル選択欄（generic 要素）をクリックして検索ドロップダウンを開く。

```
mcp__chrome-devtools__click
- uid: "<スキル選択欄の UID>"
```

#### 3.3 スキル名を入力

検索ボックスにスキル名を入力。

```
mcp__chrome-devtools__fill
- uid: "<検索ボックスの UID>"
- value: "陽の加護"
```

#### 3.4 候補からスキルを選択

フィルタリングされた候補リストから対象スキルをクリック。

```
mcp__chrome-devtools__click
- uid: "<スキル候補の UID>"
```

### 4. 検索実行

「検索」ボタンをクリック。

```
mcp__chrome-devtools__click
- uid: "<検索ボタンの UID>"
```

### 5. 結果の取得

検索完了後、スナップショットを取得して結果を確認。

```
mcp__chrome-devtools__take_snapshot
```

結果が大きい場合はファイルに保存されるため、Bash コマンドで解析する。

```bash
# 検索結果件数を抽出
grep -o '検索結果 ([0-9]* 件)' <snapshot_file>

# 結果の詳細を確認
sed 's/\\n/\n/g' <snapshot_file> | grep -E '(陽の加護|代表|継承)' | head -30
```

## 実行例

### 検索条件

- 白因子（共通スキル）: 陽の加護
- 星数: ★1 以上
- 検索対象: 全て（代表・継承元）

### 結果

- **検索結果**: 100 件
- 各ユーザーの因子情報（スキル名、星数、代表/継承元の区別）が表示される

## 注意事項

1. **スナップショットの UID は毎回変わる**: ページ状態によって要素の UID が変化するため、操作前に必ず最新のスナップショットを取得すること
2. **Loading 状態の待機**: 検索実行後、結果が読み込まれるまで待機が必要な場合がある
3. **大量の結果**: 結果が多い場合、スナップショットがファイルに保存されるため、ファイルから必要な情報を抽出する
4. **追加のスキル選択欄**: スキル追加ボタンをクリックすると新しい選択欄が追加される。不要な場合は削除ボタンで削除可能

## 使用した MCP ツール一覧

| ツール | 用途 |
|--------|------|
| `list_pages` | 開いているページ一覧を確認 |
| `navigate_page` | URL へ移動 |
| `take_snapshot` | ページの A11Y ツリーを取得 |
| `press_key` | キー入力（Escape など） |
| `click` | 要素をクリック |
| `fill` | テキスト入力欄に値を入力 |
| `wait_for` | 特定のテキストが表示されるまで待機 |
| `evaluate_script` | JavaScript を実行してデータを抽出 |

## 結果データの抽出

### ページ構造

検索結果は `<table class="b-table">` 内に表示される。各行（`<tr>`）が1ユーザーの情報を含む。

### 因子のクラス名と色の対応

| クラス名 | 因子タイプ | 色 |
|----------|-----------|-----|
| `factor1` | 青因子（ステータス因子） | 青 |
| `factor2` | 赤因子（適性因子） | 赤 |
| `factor3` | 緑因子（固有スキル因子） | 緑 |
| `factor4` | 白因子（共通スキル） | 白/グレー |
| `factor5` | 白因子（レース） | 白/グレー |
| `factor6` | 白因子（シナリオ） | 白/グレー |

### 代表/祖の区別

- テキストに「（代表」を含む → 代表ウマ娘の因子
- テキストに「（代表」を含まない → 祖（継承元1・継承元2）の因子

### JavaScript による抽出スクリプト

```javascript
// mcp__chrome-devtools__evaluate_script で実行
() => {
  const table = document.querySelector('table.b-table');
  if (!table) return { error: 'Table not found' };

  const rows = table.querySelectorAll('tbody tr');
  const results = [];

  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i];

    // ユーザーID
    const userIdSpan = row.querySelector('.header span');
    const userId = userIdSpan ? userIdSpan.textContent.trim() : null;

    // 因子を種類別に取得
    const factors = {
      blue_daihyo: [],   // 青因子（代表）
      blue_so: [],       // 青因子（祖）
      red_daihyo: [],    // 赤因子（代表）
      red_so: [],        // 赤因子（祖）
      green_daihyo: [],  // 緑因子（代表）
      green_so: []       // 緑因子（祖）
    };

    // factor1 = 青因子
    row.querySelectorAll('.factor1').forEach(el => {
      const text = el.textContent.trim();
      if (text.includes('（代表')) {
        factors.blue_daihyo.push(text);
      } else {
        factors.blue_so.push(text);
      }
    });

    // factor2 = 赤因子
    row.querySelectorAll('.factor2').forEach(el => {
      const text = el.textContent.trim();
      if (text.includes('（代表')) {
        factors.red_daihyo.push(text);
      } else {
        factors.red_so.push(text);
      }
    });

    // factor3 = 緑因子
    row.querySelectorAll('.factor3').forEach(el => {
      const text = el.textContent.trim();
      if (text.includes('（代表')) {
        factors.green_daihyo.push(text);
      } else {
        factors.green_so.push(text);
      }
    });

    results.push({ userId, ...factors });
  }

  return results;
}
```

### 抽出結果例（先頭10件）

| # | ユーザーID | 青因子（代表） | 青因子（祖） | 赤因子（代表） | 赤因子（祖） | 緑因子（代表） | 緑因子（祖） |
|---|-----------|---------------|-------------|---------------|-------------|---------------|-------------|
| 1 | 110006621 | スピード2（代表2） | スタミナ4 | 逃げ5（代表2） | マイル2 | アングリング×スキーミング1（代表1） | オペレーション・Cacao2, 紅焔ギア/LP1211-M2 |
| 2 | 110042771 | 根性3（代表3） | スタミナ3, スピード2 | 長距離3（代表1） | ダート3 | Spooky-Scary-Happy2（代表2） | 理運開かりて翔る3, ピュリティオブハート2 |
| 3 | 110042889 | 根性6（代表3） | パワー3 | 中距離1（代表1） | 芝2 | 玄雲散らす、黄金甲矢1（代表1） | どんっ、パッ、むんっ2, 精神一到何事か成らざらん2 |
| 4 | 110046002 | 根性3（代表3） | パワー3, スタミナ3 | 長距離3（代表3） | 中距離4 | trigger:BEAT2（代表2） | セイリオス2, レッツ・アナボリック！2 |
| 5 | 110046789 | スピード6（代表3） | パワー3 | 中距離6（代表3） | 逃げ2 | あっぱれ大盤振る舞い！2（代表2） | 汝、皇帝の神威を見よ2, プランチャ☆ガナドール3 |
| 6 | 110056966 | スタミナ6（代表3） | スピード2 | 先行3（代表3） | マイル2, 差し2 | 白い稲妻、見せたるで！2（代表2） | 汝、皇帝の神威を見よ2, 勝利の鼓動2 |
| 7 | 110062310 | スピード3（代表3） | 根性5 | マイル5（代表2） | ダート3 | オペレーション・Cacao2（代表2） | つぼみ、ほころぶ時3, いっぱいおあげんしぇ！3 |
| 8 | 110075798 | スピード6（代表3） | スタミナ2 | 中距離1（代表1） | 逃げ5 | 勝ち鬨ワッショイ！2（代表2） | オペレーション・Cacao2, アングリング×スキーミング2 |
| 9 | 110101444 | 賢さ6（代表3） | スタミナ2 | ダート1（代表1） | 逃げ4 | ヴィクトリーショット！2（代表2） | ノッてけ、マッシュアップ！2, グッときて♪Chu2 |
| 10 | 110114646 | スタミナ3（代表2） | スピード2 | ダート5（代表3） | マイル3 | アングリング×スキーミング2（代表2） | オペレーション・Cacao3, 紅焔ギア/LP1211-M3 |

### 拡張版抽出スクリプト（白因子数・検索対象因子を含む）

追加で以下の情報を抽出する：

| 列番号 | 項目名 | 説明 |
|--------|--------|------|
| 8 | 白因子数 | ページに「白数30」形式で表示される白因子の合計数 |
| 9 | 代表因子数 | 白因子のうち「（代表」を含む因子の数 |
| 10 | 検索対象因子 | 検索した因子の値（数値のみ、因子名は除去） |

#### 検索対象因子の値フォーマット

- 因子名を除去し、数値部分のみを抽出
- 例: `陽の加護4（代表2）` → `4（代表2）`

```javascript
// mcp__chrome-devtools__evaluate_script で実行
() => {
  const table = document.querySelector('table.b-table');
  if (!table) return { error: 'Table not found' };

  const rows = table.querySelectorAll('tbody tr');
  const results = [];
  const searchTargets = ['陽の加護']; // 検索対象の因子名

  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i];

    // ユーザーID
    const userIdSpan = row.querySelector('.header span');
    const userId = userIdSpan ? userIdSpan.textContent.trim() : null;

    // 白因子数（「白数30」形式から抽出）
    let whiteFactorCount = null;
    const whiteCountText = row.textContent.match(/白数(\d+)/);
    if (whiteCountText) {
      whiteFactorCount = parseInt(whiteCountText[1]);
    }

    // 因子を種類別に取得
    const factors = {
      blue_daihyo: [],
      blue_so: [],
      red_daihyo: [],
      red_so: [],
      green_daihyo: [],
      green_so: []
    };

    // factor1 = 青因子
    row.querySelectorAll('.factor1').forEach(el => {
      const text = el.textContent.trim();
      if (text.includes('（代表')) {
        factors.blue_daihyo.push(text);
      } else {
        factors.blue_so.push(text);
      }
    });

    // factor2 = 赤因子
    row.querySelectorAll('.factor2').forEach(el => {
      const text = el.textContent.trim();
      if (text.includes('（代表')) {
        factors.red_daihyo.push(text);
      } else {
        factors.red_so.push(text);
      }
    });

    // factor3 = 緑因子
    row.querySelectorAll('.factor3').forEach(el => {
      const text = el.textContent.trim();
      if (text.includes('（代表')) {
        factors.green_daihyo.push(text);
      } else {
        factors.green_so.push(text);
      }
    });

    // 白因子（factor4, factor5, factor6）と代表因子数
    let whiteDaihyoCount = 0;
    const whiteFactors = [];
    row.querySelectorAll('.factor4, .factor5, .factor6').forEach(el => {
      const text = el.textContent.trim();
      whiteFactors.push(text);
      if (text.includes('（代表')) {
        whiteDaihyoCount++;
      }
    });

    // 検索対象因子の値を抽出（因子名を除去し数値のみ）
    const searchResults = {};
    searchTargets.forEach(target => {
      const found = whiteFactors.find(f => f.includes(target));
      if (found) {
        // 因子名を除去して数値部分のみ取得
        const numPart = found.replace(target, '').trim();
        searchResults[target] = numPart;
      } else {
        searchResults[target] = '';
      }
    });

    results.push({
      userId,
      ...factors,
      whiteFactorCount,
      whiteDaihyoCount,
      searchResults
    });
  }

  return results;
}
```

### 拡張版抽出結果例（先頭10件）

| # | ユーザーID | 青因子（代表） | 青因子（祖） | 赤因子（代表） | 赤因子（祖） | 緑因子（代表） | 緑因子（祖） | 白因子数 | 代表因子数 | 陽の加護 |
|---|-----------|---------------|-------------|---------------|-------------|---------------|-------------|---------|-----------|---------|
| 1 | 110006621 | スピード2（代表2） | スタミナ4 | 逃げ5（代表2） | マイル2 | アングリング×スキーミング1（代表1） | オペレーション・Cacao2, 紅焔ギア/LP1211-M2 | 30 | 8 | 2 |
| 2 | 110042771 | 根性3（代表3） | スタミナ3, スピード2 | 長距離3（代表1） | ダート3 | Spooky-Scary-Happy2（代表2） | 理運開かりて翔る3, ピュリティオブハート2 | 24 | 8 | 2 |
| 3 | 110042889 | 根性6（代表3） | パワー3 | 中距離1（代表1） | 芝2 | 玄雲散らす、黄金甲矢1（代表1） | どんっ、パッ、むんっ2, 精神一到何事か成らざらん2 | 16 | 3 | 2 |
| 4 | 110046002 | 根性3（代表3） | パワー3, スタミナ3 | 長距離3（代表3） | 中距離4 | trigger:BEAT2（代表2） | セイリオス2, レッツ・アナボリック！2 | 21 | 6 | 2 |
| 5 | 110046789 | スピード6（代表3） | パワー3 | 中距離6（代表3） | 逃げ2 | あっぱれ大盤振る舞い！2（代表2） | 汝、皇帝の神威を見よ2, プランチャ☆ガナドール3 | 16 | 3 | 2 |
| 6 | 110056966 | スタミナ6（代表3） | スピード2 | 先行3（代表3） | マイル2, 差し2 | 白い稲妻、見せたるで！2（代表2） | 汝、皇帝の神威を見よ2, 勝利の鼓動2 | 13 | 2 | 2 |
| 7 | 110062310 | スピード3（代表3） | 根性5 | マイル5（代表2） | ダート3 | オペレーション・Cacao2（代表2） | つぼみ、ほころぶ時3, いっぱいおあげんしぇ！3 | 17 | 5 | 2 |
| 8 | 110075798 | スピード6（代表3） | スタミナ2 | 中距離1（代表1） | 逃げ5 | 勝ち鬨ワッショイ！2（代表2） | オペレーション・Cacao2, アングリング×スキーミング2 | 23 | 9 | 4（代表2） |
| 9 | 110101444 | 賢さ6（代表3） | スタミナ2 | ダート1（代表1） | 逃げ4 | ヴィクトリーショット！2（代表2） | ノッてけ、マッシュアップ！2, グッときて♪Chu2 | 15 | 3 | 2 |
| 10 | 110114646 | スタミナ3（代表2） | スピード2 | ダート5（代表3） | マイル3 | アングリング×スキーミング2（代表2） | オペレーション・Cacao3, 紅焔ギア/LP1211-M3 | 22 | 3 | 2 |

### 複数因子の検索時

複数の因子を同時に検索する場合は、`searchTargets` 配列に追加する：

```javascript
const searchTargets = ['陽の加護', '別の因子名'];
```

結果は `searchResults` オブジェクトに因子名をキーとして格納される：

```javascript
{
  "陽の加護": "4（代表2）",
  "別の因子名": "3"
}
```

## 複数因子の順次検索と結果マージ

複数の白因子（共通スキル）を個別に検索し、結果を userId で突合する手順。

### ユースケース

- 「陽の加護」と「危険回避」の両方を持つユーザーを探す
- 複数の因子を持つユーザーの比較表を作成する

### 手順

**重要**: Reset ボタンは使用禁止。他の検索条件（青因子、赤因子など）が消えてしまうため。白因子（共通スキル）の行のみを削除・追加して因子を切り替える。

#### 1. 既存の白因子行を削除

白因子（共通スキル）セクションに既存の行がある場合、削除ボタン（×）をクリックして削除する。

```
mcp__chrome-devtools__take_snapshot
# 白因子行の削除ボタン（×）の UID を特定
mcp__chrome-devtools__click
- uid: "<削除ボタンの UID>"
# 複数行ある場合は繰り返し
```

#### 2. 1つ目の因子で検索

「白因子（共通スキル）」セクションを展開し、因子を選択して検索。

```
# セクション展開（+ボタンをクリック）
mcp__chrome-devtools__click
- uid: "<白因子（共通スキル）ボタンの UID>"

# スキル選択欄（generic 要素）をクリック
mcp__chrome-devtools__click
- uid: "<スキル選択欄の UID>"

# ドロップダウンから因子を選択
mcp__chrome-devtools__click
- uid: "<因子名の UID>"

# 検索実行
mcp__chrome-devtools__click
- uid: "<検索ボタンの UID>"
```

#### 3. 結果を抽出（Result 1）

```javascript
// mcp__chrome-devtools__evaluate_script で実行
() => {
  const table = document.querySelector('table.b-table');
  if (!table) return { error: 'Table not found' };
  const rows = table.querySelectorAll('tbody tr');
  const results = [];
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i];
    const userIdSpan = row.querySelector('.header span');
    const userId = userIdSpan ? userIdSpan.textContent.trim() : null;
    const factor4Cells = row.querySelectorAll('.factor4');
    const factor5Cells = row.querySelectorAll('.factor5');
    const factor6Cells = row.querySelectorAll('.factor6');
    const whiteFactorCount = factor4Cells.length + factor5Cells.length + factor6Cells.length;
    // 検索因子のカウント
    const allCells = row.querySelectorAll('td');
    let targetCount = 0;
    allCells.forEach(cell => {
      if (cell.textContent.includes('陽の加護')) targetCount++;
    });
    results.push({ userId, whiteFactorCount, youNoKagoCount: targetCount });
  }
  return { totalRows: rows.length, results };
}
```

#### 4. 白因子行を削除して2つ目の因子で検索

1つ目の因子の行を削除し、手順1～3を繰り返して別の因子（例: 危険回避）で検索、Result 2 を取得。

```
# 1つ目の因子行を削除
mcp__chrome-devtools__click
- uid: "<削除ボタンの UID>"

# 新しい因子を追加して検索（手順2と同様）
```

#### 5. 結果をマージ

userId をキーにして Result 1 と Result 2 を突合。

### 実行例: 陽の加護 × 危険回避

#### 検索条件

- 因子1: 陽の加護
- 因子2: 危険回避
- 各検索で先頭10件を取得

#### Result 1: 陽の加護（10件）

| userId | 白因子数 | 陽の加護 |
|--------|----------|----------|
| 110006621 | 30 | 1 |
| 110042771 | 22 | 1 |
| 110042889 | 13 | 1 |
| 110046002 | 21 | 1 |
| 110046789 | 24 | 1 |
| 110056966 | 18 | 1 |
| 110062310 | 54 | 1 |
| 110075798 | 23 | 1 |
| 110101444 | 33 | 1 |
| 110114646 | 44 | 1 |

#### Result 2: 危険回避（10件）

| userId | 白因子数 | 危険回避 |
|--------|----------|----------|
| 110000560 | 19 | 1 |
| 110005275 | 31 | 1 |
| 110006621 | 30 | 1 |
| 110007061 | 46 | 1 |
| 110014136 | 23 | 1 |
| 110034120 | 18 | 1 |
| 110047599 | 31 | 1 |
| 110060258 | 23 | 1 |
| 110061959 | 13 | 1 |
| 110072667 | 10 | 1 |

#### 突合結果

| userId | 白因子数 | 陽の加護 | 危険回避 | 備考 |
|--------|----------|----------|----------|------|
| **110006621** | 30 | ✅ | ✅ | **両方所持** |
| 110000560 | 19 | - | ✅ | 危険回避のみ |
| 110005275 | 31 | - | ✅ | 危険回避のみ |
| 110007061 | 46 | - | ✅ | 危険回避のみ |
| 110014136 | 23 | - | ✅ | 危険回避のみ |
| 110034120 | 18 | - | ✅ | 危険回避のみ |
| 110042771 | 22 | ✅ | - | 陽の加護のみ |
| 110042889 | 13 | ✅ | - | 陽の加護のみ |
| 110046002 | 21 | ✅ | - | 陽の加護のみ |
| 110046789 | 24 | ✅ | - | 陽の加護のみ |
| 110047599 | 31 | - | ✅ | 危険回避のみ |
| 110056966 | 18 | ✅ | - | 陽の加護のみ |
| 110060258 | 23 | - | ✅ | 危険回避のみ |
| 110061959 | 13 | - | ✅ | 危険回避のみ |
| 110062310 | 54 | ✅ | - | 陽の加護のみ |
| 110072667 | 10 | - | ✅ | 危険回避のみ |
| 110075798 | 23 | ✅ | - | 陽の加護のみ |
| 110101444 | 33 | ✅ | - | 陽の加護のみ |
| 110114646 | 44 | ✅ | - | 陽の加護のみ |

#### サマリ

- **両方所持**: 1 名（userId: 110006621）
- **陽の加護のみ**: 9 名
- **危険回避のみ**: 9 名
- **合計ユニークユーザー**: 19 名

### 注意事項

1. **Reset ボタン使用禁止**: 他の検索条件（青因子、赤因子など）が消えてしまうため、白因子行の削除・追加で因子を切り替える
2. **検索結果の制限**: 各検索で取得できるのは表示されている件数まで。ページネーションがある場合は追加のスクロールや操作が必要
3. **UID の変動**: 各操作後にスナップショットを取り直し、最新の UID を使用すること
