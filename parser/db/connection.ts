/**
 * データベース接続ユーティリティ
 */
import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** デフォルトのデータベースファイルパス */
export const DEFAULT_DB_PATH = join(__dirname, '../../web/public/data/uma.db');

/** スキーマファイルパス */
const SCHEMA_PATH = join(__dirname, 'schema.sql');

/**
 * データベース接続を取得
 * @param dbPath データベースファイルパス
 * @returns Database インスタンス
 */
export function getDatabase(dbPath: string = DEFAULT_DB_PATH): Database.Database {
  return new Database(dbPath);
}

/**
 * データベースを初期化（スキーマ適用）
 * @param dbPath データベースファイルパス
 * @param force 既存データを削除して再作成するか
 * @returns Database インスタンス
 */
export function initializeDatabase(
  dbPath: string = DEFAULT_DB_PATH,
  force: boolean = false
): Database.Database {
  // 出力ディレクトリを自動作成
  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);

  // WAL モードを有効化（パフォーマンス向上）
  db.pragma('journal_mode = WAL');

  // 外部キー制約を有効化
  db.pragma('foreign_keys = ON');

  if (force) {
    // 既存テーブルを削除
    db.exec(`
      DROP VIEW IF EXISTS skill_full_view;
      DROP VIEW IF EXISTS condition_search_view;
      DROP VIEW IF EXISTS support_card_skills_view;
      DROP VIEW IF EXISTS skill_variants_view;
      DROP TABLE IF EXISTS variant_parameters;
      DROP TABLE IF EXISTS skill_effect_variants;
      DROP TABLE IF EXISTS effect_parameters;
      DROP TABLE IF EXISTS skill_conditions;
      DROP TABLE IF EXISTS skills;
      DROP TABLE IF EXISTS support_cards;
    `);
  }

  // スキーマを適用
  const schema = readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);

  return db;
}

/**
 * データベースを閉じる
 * @param db Database インスタンス
 */
export function closeDatabase(db: Database.Database): void {
  db.close();
}
