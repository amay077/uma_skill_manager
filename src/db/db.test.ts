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
  searchVariants,
  findMultiStageSkills,
  findSkillsWithDemerit,
  advancedSearch,
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
        'skill_effect_variants',
        'skills',
        'support_cards',
        'variant_parameters',
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
        'skill_variants_view',
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
      expect(result.variantCount).toBeGreaterThanOrEqual(0);
      expect(result.variantParameterCount).toBeGreaterThanOrEqual(0);
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
        expect(typeof stats.totalVariants).toBe('number');
        expect(typeof stats.multiStageSkillCount).toBe('number');
        expect(typeof stats.demeritVariantCount).toBe('number');
      });
    });

    describe('searchVariants', () => {
      it('should search all variants', () => {
        const results = searchVariants({}, TEST_DB_PATH);
        expect(results).toBeInstanceOf(Array);
      });

      it('should filter by skill name', () => {
        const results = searchVariants({ name: '波乱' }, TEST_DB_PATH);
        results.forEach(r => expect(r.skill_name).toContain('波乱'));
      });

      it('should filter by skill type', () => {
        const results = searchVariants({ type: 'unique' }, TEST_DB_PATH);
        results.forEach(r => expect(r.skill_type).toBe('unique'));
      });

      it('should exclude demerit effects', () => {
        const results = searchVariants({ excludeDemerit: true }, TEST_DB_PATH);
        results.forEach(r => expect(r.is_demerit).toBe(0));
      });

      it('should filter by effect order', () => {
        const results = searchVariants({ effectOrder: 0 }, TEST_DB_PATH);
        results.forEach(r => expect(r.effect_order).toBe(0));
      });
    });

    describe('findMultiStageSkills', () => {
      it('should find skills with multi-stage activation', () => {
        const results = findMultiStageSkills(TEST_DB_PATH);
        expect(results).toBeInstanceOf(Array);
        results.forEach(r => {
          expect(r.max_effect_order).toBeGreaterThanOrEqual(1);
        });
      });
    });

    describe('findSkillsWithDemerit', () => {
      it('should find variants with demerit effects', () => {
        const results = findSkillsWithDemerit(TEST_DB_PATH);
        expect(results).toBeInstanceOf(Array);
        results.forEach(r => expect(r.is_demerit).toBe(1));
      });
    });

    describe('advancedSearch', () => {
      it('should return results when no filters specified', () => {
        const results = advancedSearch({}, TEST_DB_PATH);
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
      });

      it('should filter by runningStyle nige', () => {
        const results = advancedSearch({ runningStyle: 'nige' }, TEST_DB_PATH);
        expect(results.length).toBeGreaterThan(0);
        // 逃げ専用スキル、または作戦条件なしのスキルが返される
        results.forEach(r => {
          if (r.activationConditionRaw) {
            // 他の作戦専用（先行/差し/追込）を除外
            const hasOtherRunningStyle = /running_style==[234]/.test(r.activationConditionRaw);
            expect(hasOtherRunningStyle).toBe(false);
          }
        });
      });

      it('should filter by phase non_late', () => {
        const results = advancedSearch({ phase: 'non_late' }, TEST_DB_PATH);
        expect(results.length).toBeGreaterThan(0);
        // 終盤以外のスキルが返される
        results.forEach(r => {
          if (r.activationConditionRaw) {
            // 終盤条件（phase>=2, is_finalcorner, is_last_straight など）を含まないこと
            const isLatePhase =
              /phase>=2/.test(r.activationConditionRaw) ||
              /is_finalcorner==1/.test(r.activationConditionRaw) ||
              /is_last_straight==1/.test(r.activationConditionRaw);
            expect(isLatePhase).toBe(false);
          }
        });
      });

      it('should filter by effectType speed', () => {
        const results = advancedSearch({ effectType: 'speed' }, TEST_DB_PATH);
        expect(results.length).toBeGreaterThan(0);
        // 速度系スキルのみが返される（effect_params に targetSpeed または currentSpeed を含む）
        results.forEach(r => {
          const params = r.effect_params || '';
          const hasSpeed = params.includes('targetSpeed') || params.includes('currentSpeed');
          expect(hasSpeed).toBe(true);
        });
      });

      it('should exclude demerit skills when excludeDemerit is true', () => {
        const results = advancedSearch({ excludeDemerit: true }, TEST_DB_PATH);
        expect(results.length).toBeGreaterThan(0);
        // デメリット効果のスキルが除外される
        results.forEach(r => {
          expect(r.is_demerit).toBe(0);
        });
      });

      it('should filter by skill name', () => {
        const results = advancedSearch({ name: 'コーナー' }, TEST_DB_PATH);
        expect(results.length).toBeGreaterThan(0);
        // 名前に「コーナー」を含むスキルのみ
        results.forEach(r => {
          expect(r.skill_name.includes('コーナー')).toBe(true);
        });
      });

      it('should filter by skillType unique', () => {
        const results = advancedSearch({ skillType: 'unique' }, TEST_DB_PATH);
        expect(results.length).toBeGreaterThan(0);
        // 固有スキルのみ
        results.forEach(r => {
          expect(r.skill_type).toBe('unique');
        });
      });

      it('should respect limit parameter', () => {
        const results = advancedSearch({ limit: 5 }, TEST_DB_PATH);
        expect(results.length).toBeLessThanOrEqual(5);
      });

      it('should combine runningStyle and phase filters', () => {
        const results = advancedSearch({
          runningStyle: 'nige',
          phase: 'non_late',
        }, TEST_DB_PATH);

        results.forEach(r => {
          if (r.activationConditionRaw) {
            // 他の作戦専用を除外
            const hasOtherRunningStyle = /running_style==[234]/.test(r.activationConditionRaw);
            expect(hasOtherRunningStyle).toBe(false);

            // 終盤除外チェック
            const isLatePhase =
              /phase>=2/.test(r.activationConditionRaw) ||
              /is_finalcorner==1/.test(r.activationConditionRaw) ||
              /is_last_straight==1/.test(r.activationConditionRaw);
            expect(isLatePhase).toBe(false);
          }
        });
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

    it('should query skill_variants_view', () => {
      const db = initializeDatabase(TEST_DB_PATH, false);
      const results = db.prepare('SELECT * FROM skill_variants_view LIMIT 5').all();
      expect(results).toBeInstanceOf(Array);
      closeDatabase(db);
    });
  });
});
