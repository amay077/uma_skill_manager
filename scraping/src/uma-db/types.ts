/**
 * ウマ娘 DB スクレイピング型定義
 */

/** 検索オプション */
export interface SearchOptions {
  /** 検索対象スキル名リスト */
  skills: string[];
  /** 白因子合計数の下限（デフォルト: 30） */
  whiteFactor?: number;
  /** G1勝数の下限（デフォルト: 0） */
  g1Wins?: number;
  /** 検索結果の上限（デフォルト: 100） */
  limit?: number;
  /** ヘッドレスモード（デフォルト: true） */
  headless?: boolean;
  /** インタラクティブモード（デフォルト: false） */
  interactive?: boolean;
  /** 出力ディレクトリ（デフォルト: results） */
  outputDir?: string;
}

/** 因子情報 */
export interface FactorInfo {
  /** 代表ウマ娘の因子 */
  daihyo: string[];
  /** 祖（継承元）の因子 */
  so: string[];
}

/** 検索結果1件分 */
export interface SearchResult {
  /** ユーザー ID */
  userId: string;
  /** 青因子（ステータス因子） */
  blueFactor: FactorInfo;
  /** 赤因子（適性因子） */
  redFactor: FactorInfo;
  /** 緑因子（固有スキル因子） */
  greenFactor: FactorInfo;
  /** 白因子合計数 */
  whiteFactorCount: number;
  /** 代表因子数 */
  daihyoCount: number;
  /** 検索対象スキルの因子値（スキル名 → 値） */
  searchSkillValues: Record<string, string>;
}

/** スキルごとの検索結果 */
export interface SkillSearchResult {
  /** 検索したスキル名 */
  skillName: string;
  /** 検索結果一覧 */
  results: SearchResult[];
  /** 検索結果の総件数（採用した条件での件数、100件以上の場合あり） */
  totalCount: number;
  /** 採用した白因子下限値（100件以上だった条件、結果取得に使用） */
  actualWhiteFactor: number;
  /** 100件未満になった白因子下限値（探索終了時の条件） */
  finalWhiteFactor: number;
  /** 100件未満になった時の結果件数 */
  finalCount: number;
}
