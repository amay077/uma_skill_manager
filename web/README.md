# Web Frontend

ウマ娘スキル検索の Web UI。

## 機能

- スキル検索・フィルタリング
- 検索結果の表示・ページネーション
- SQLite（sql.js）によるブラウザ内 DB

## 使い方

```bash
# ローカルサーバー起動
npx serve .

# ブラウザで開く
open http://localhost:3000/web/
```

## ディレクトリ構成

```
web/
├── index.html          # エントリーポイント
├── js/
│   ├── app.js          # メインアプリ
│   ├── components/     # UI コンポーネント
│   └── db/             # DB 関連
├── css/
│   └── style.css       # スタイル
└── tests/
    └── e2e-test.mjs    # E2E テスト
```

## 注意事項

- DB ファイルは `../data/uma.db` から読み込む
- sql.js（WASM）を CDN から取得
