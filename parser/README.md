# Parser & DB

ウマ娘スキルデータのパーサーと SQLite データベース管理。

## 機能

- `assets/umasim_skill.txt` のパース処理
- SQLite データベースへのインポート
- スキル検索 CLI

## 使い方

```bash
# パース実行
npm run parse

# DB インポート
npm run db:import

# スキル検索
npx tsx parser/cli/search.ts -r nige -e speed
```

## ディレクトリ構成

```
parser/
├── parser/     # パーサー本体
├── db/         # SQLite 関連
├── types/      # 型定義
├── cli/        # CLI ツール
└── tests/      # テスト
```

## CLI オプション（search.ts）

| オプション | 説明 |
|-----------|------|
| `-r, --running-style` | 作戦（nige/senkou/sashi/oikomi） |
| `-d, --distance` | 距離（short/mile/middle/long） |
| `-p, --phase` | 発動タイミング（early/mid/late/corner） |
| `-e, --effect` | 効果種別（speed/accel/stamina） |
| `-n, --name` | スキル名（部分一致） |
| `-f, --format` | 出力形式（table/json/simple） |

詳細は [SKILL.md](../.claude/skills/skill-search/SKILL.md) を参照。
