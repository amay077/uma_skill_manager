# Uma Skill Manager

ウマ娘スキル・サポカ管理データ基盤

## サブプロジェクト

| ディレクトリ | 説明 | README |
|-------------|------|--------|
| [parser/](./parser/) | パーサー＆DB、CLI ツール | [parser/README.md](./parser/README.md) |
| [web/](./web/) | Web フロントエンド | [web/README.md](./web/README.md) |
| [scraping/](./scraping/) | フレンド検索スクレイピング | [scraping/README.md](./scraping/README.md) |

## セットアップ

```bash
npm install
npm run db:import   # DB 初期化
npm run test        # テスト実行
```

## Getting Started

スキルデータを入手してからフロントエンドで検索できるようになるまでの手順。

### 1. データソースを配置

[mee1080/umasim](https://mee1080.github.io/umasim/skill/) からスキルデータをコピーし、`assets/umasim_skill.txt` に保存。

### 2. パース & DB 生成

```bash
npm run parse        # スキルデータをパース → output/skills.json
npm run db:import    # JSON を DB にインポート → web/public/data/uma.db
```

### 3. フロントエンドで検索

```bash
cd web/public
npx serve .          # または任意の HTTP サーバー
```

ブラウザで `http://localhost:3000` を開き、スキル検索を実行。

## ディレクトリ構成

```
uma/
├── parser/           # パーサー＆DB
├── web/public/       # Web UI（静的ホスティング対応）
│   └── data/         # SQLite DB
├── scraping/         # スクレイピングツール
└── assets/           # データソース
```

## データソース

スキルデータは [mee1080/umasim](https://mee1080.github.io/umasim/skill/) から取得。

- **データファイル**: `assets/umasim_skill.txt`
- **更新方法**: 手動でコピー＆ペースト

## プロジェクト情報

- **プロジェクトキー**: `USM`
- **課題管理**: GitHub Issues

### 識別子の運用

| 用途 | 形式 | 例 |
|------|------|-----|
| GitHub Issue | `#N` | `#1`, `#6` |
| OpenSpec change-id | `USM-NNN` | `USM-001`, `USM-006` |
| コミット接頭辞 | `#N` | `#6 機能を実装` |

- GitHub Issue `#N` は OpenSpec `USM-NNN` に対応（例: `#6` → `USM-006`）
- コミットには `#N` を使用（GitHub auto-link のため）

## AI 開発環境

- [CLAUDE.md](./CLAUDE.md): AI エージェント動作規約
- [OpenSpec ガイド](./openspec/AGENTS.md): 変更提案の作成方法

## ライセンス

MIT
