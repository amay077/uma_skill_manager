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
  searchVariants,
  findMultiStageSkills,
  findSkillsWithDemerit,
  advancedSearch,
  type SkillSearchResult,
  type ConditionSearchResult,
  type SupportCardSkillResult,
  type VariantSearchResult,
  type SkillSearchOptions,
  type ConditionSearchOptions,
  type EffectParameterSearchOptions,
  type VariantSearchOptions,
  type RunningStyle,
  type DistanceType,
  type PhaseType,
  type EffectType,
  type OrderRange,
  type SkillType,
  type GroundType,
  type AdvancedSearchOptions,
  type AdvancedSearchResult,
} from './queries.js';
