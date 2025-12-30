/**
 * データベースモジュール
 */
export {
  getDatabase,
  initializeDatabase,
  closeDatabase,
  DEFAULT_DB_PATH,
} from './connection.js';

export {
  loadSkillsFromJson,
  importToDatabase,
  DEFAULT_JSON_PATH,
  type ImportResult,
} from './import.js';

export {
  searchSkills,
  searchByCondition,
  searchByEffectParameter,
  getSkillsBySupportCard,
  getStatistics,
  type SkillSearchResult,
  type ConditionSearchResult,
  type SupportCardSkillResult,
  type SkillSearchOptions,
  type ConditionSearchOptions,
  type EffectParameterSearchOptions,
} from './queries.js';
