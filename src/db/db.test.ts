/**
 * データベーステスト
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initializeDatabase,
  closeDatabase,
  importToDatabase,
  searchSkills,
  searchByCondition,
  searchByEffectParameter,
  getSkillsBySupportCard,
  getStatistics,
  loadSkillsFromJson,
  DEFAULT_JSON_PATH,
} from './index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DB_PATH = join(__dirname, '../../data/test.db');

describe('Database', () => {
  beforeAll(() => {
    // data ディレクトリが存在することを確認
    const dataDir = dirname(TEST_DB_PATH);
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
  });

  afterAll(() => {
    // テスト DB を削除
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
    // WAL ファイルも削除
    const walPath = TEST_DB_PATH + '-wal';
    const shmPath = TEST_DB_PATH + '-shm';
    if (existsSync(walPath)) unlinkSync(walPath);
    if (existsSync(shmPath)) unlinkSync(shmPath);
  });

  describe('Schema Initialization', () => {
    it('should create database with all tables', () => {
      const db = initializeDatabase(TEST_DB_PATH, true);

      // テーブルの存在確認
      const tables = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `).all() as { name: string }[];

      expect(tables.map(t => t.name)).toEqual([
        'effect_parameters',
        'skill_conditions',
        'skills',
        'support_cards',
      ]);

      closeDatabase(db);
    });

    it('should create views', () => {
      const db = initializeDatabase(TEST_DB_PATH, false);

      const views = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='view'
        ORDER BY name
      `).all() as { name: string }[];

      expect(views.map(v => v.name)).toEqual([
        'condition_search_view',
        'skill_full_view',
        'support_card_skills_view',
      ]);

      closeDatabase(db);
    });

    it('should recreate database with force option', () => {
      // 初期データを挿入
      let db = initializeDatabase(TEST_DB_PATH, true);
      db.prepare('INSERT INTO support_cards (costume_name, character_name, full_name) VALUES (?, ?, ?)').run('Test', 'Char', '[Test]Char');
      closeDatabase(db);

      // force で再作成
      db = initializeDatabase(TEST_DB_PATH, true);
      const count = (db.prepare('SELECT COUNT(*) as count FROM support_cards').get() as { count: number }).count;
      expect(count).toBe(0);

      closeDatabase(db);
    });
  });

  describe('JSON Loading', () => {
    it('should load skills from JSON file', () => {
      const skills = loadSkillsFromJson(DEFAULT_JSON_PATH);
      expect(skills).toBeInstanceOf(Array);
      expect(skills.length).toBeGreaterThan(0);
      expect(skills[0]).toHaveProperty('name');
      expect(skills[0]).toHaveProperty('type');
    });

    it('should throw error for non-existent file', () => {
      expect(() => loadSkillsFromJson('/non/existent/path.json')).toThrow('入力ファイルが見つかりません');
    });
  });

  describe('Import', () => {
    beforeEach(() => {
      // 各テスト前にDBを初期化
      if (existsSync(TEST_DB_PATH)) {
        unlinkSync(TEST_DB_PATH);
      }
    });

    it('should import skills from JSON', () => {
      const result = importToDatabase(DEFAULT_JSON_PATH, TEST_DB_PATH, true);

      expect(result.skillCount).toBeGreaterThan(0);
      expect(result.supportCardCount).toBeGreaterThan(0);
      expect(result.conditionCount).toBeGreaterThan(0);
      expect(result.parameterCount).toBeGreaterThan(0);
    });

    it('should clear existing data on reimport', () => {
      // 1回目のインポート
      const result1 = importToDatabase(DEFAULT_JSON_PATH, TEST_DB_PATH, true);

      // 2回目のインポート（同じデータ）
      const result2 = importToDatabase(DEFAULT_JSON_PATH, TEST_DB_PATH, true);

      // 件数が同じであること（重複していないこと）
      expect(result2.skillCount).toBe(result1.skillCount);
      expect(result2.supportCardCount).toBe(result1.supportCardCount);
    });
  });

  describe('Queries', () => {
    beforeAll(() => {
      // クエリテスト用にデータをインポート
      importToDatabase(DEFAULT_JSON_PATH, TEST_DB_PATH, true);
    });

    describe('searchSkills', () => {
      it('should search by skill name', () => {
        const results = searchSkills({ name: '波乱注意砲' }, TEST_DB_PATH);
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].name).toContain('波乱注意砲');
      });

      it('should search by skill type', () => {
        const results = searchSkills({ type: 'unique' }, TEST_DB_PATH);
        expect(results.length).toBeGreaterThan(0);
        results.forEach(r => expect(r.type).toBe('unique'));
      });

      it('should search by character name', () => {
        const results = searchSkills({ characterName: 'ゴールドシップ' }, TEST_DB_PATH);
        expect(results.length).toBeGreaterThan(0);
        results.forEach(r => expect(r.character_name).toContain('ゴールドシップ'));
      });

      it('should search by evaluation point range', () => {
        const results = searchSkills({ minEvaluationPoint: 200, maxEvaluationPoint: 250 }, TEST_DB_PATH);
        expect(results.length).toBeGreaterThan(0);
        results.forEach(r => {
          expect(r.evaluation_point).toBeGreaterThanOrEqual(200);
          expect(r.evaluation_point).toBeLessThanOrEqual(250);
        });
      });
    });

    describe('searchByCondition', () => {
      it('should search by condition variable', () => {
        const results = searchByCondition({ variable: 'distance_rate' }, TEST_DB_PATH);
        expect(results.length).toBeGreaterThan(0);
        results.forEach(r => expect(r.variable).toBe('distance_rate'));
      });

      it('should search by condition value range', () => {
        const results = searchByCondition({ variable: 'distance_rate', minValue: 50 }, TEST_DB_PATH);
        expect(results.length).toBeGreaterThan(0);
        results.forEach(r => expect(r.value).toBeGreaterThanOrEqual(50));
      });
    });

    describe('searchByEffectParameter', () => {
      it('should search by parameter key', () => {
        const results = searchByEffectParameter({ parameterKey: 'targetSpeed' }, TEST_DB_PATH);
        expect(results.length).toBeGreaterThan(0);
      });

      it('should search by parameter value range', () => {
        const results = searchByEffectParameter({ parameterKey: 'targetSpeed', minValue: 2000 }, TEST_DB_PATH);
        expect(results.length).toBeGreaterThan(0);
      });
    });

    describe('getSkillsBySupportCard', () => {
      it('should get skills by support card character', () => {
        const results = getSkillsBySupportCard('ゴールドシップ', TEST_DB_PATH);
        expect(results.length).toBeGreaterThan(0);
        results.forEach(r => expect(r.character_name).toContain('ゴールドシップ'));
      });
    });

    describe('getStatistics', () => {
      it('should return database statistics', () => {
        const stats = getStatistics(TEST_DB_PATH);
        expect(stats.totalSkills).toBeGreaterThan(0);
        expect(stats.totalSupportCards).toBeGreaterThan(0);
        expect(stats.skillsByType.length).toBeGreaterThan(0);
        expect(stats.avgEvaluationPoint).toBeGreaterThan(0);
      });
    });
  });

  describe('Views', () => {
    beforeAll(() => {
      importToDatabase(DEFAULT_JSON_PATH, TEST_DB_PATH, true);
    });

    it('should query skill_full_view', () => {
      const db = initializeDatabase(TEST_DB_PATH, false);
      const results = db.prepare('SELECT * FROM skill_full_view LIMIT 5').all();
      expect(results.length).toBe(5);
      closeDatabase(db);
    });

    it('should query condition_search_view', () => {
      const db = initializeDatabase(TEST_DB_PATH, false);
      const results = db.prepare('SELECT * FROM condition_search_view LIMIT 5').all();
      expect(results.length).toBe(5);
      closeDatabase(db);
    });

    it('should query support_card_skills_view', () => {
      const db = initializeDatabase(TEST_DB_PATH, false);
      const results = db.prepare('SELECT * FROM support_card_skills_view LIMIT 5').all();
      expect(results.length).toBe(5);
      closeDatabase(db);
    });
  });
});
