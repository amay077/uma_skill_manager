/**
 * 効果パラメータ
 * 目標速度・加速などの数値はゲーム内部の相対値
 */
export interface EffectParameter {
  /** 目標速度値 */
  targetSpeed?: number;
  /** 加速度値 */
  acceleration?: number;
  /** 持続時間（秒） */
  duration?: number;
  /** 体力回復量 */
  hpRecovery?: number;
  /** その他のパラメータ */
  [key: string]: number | undefined;
}

/**
 * 単一の条件式
 */
export interface SingleCondition {
  /** 変数名 (例: distance_rate, order_rate) */
  variable: string;
  /** 演算子 (例: >=, <=, ==, !=, >, <) */
  operator: string;
  /** 比較値 */
  value: number;
}

/**
 * AND 条件グループ
 */
export interface AndConditionGroup {
  type: 'and';
  conditions: SingleCondition[];
}

/**
 * 発動条件式（OR で結合された AND グループ）
 */
export interface Condition {
  type: 'or';
  groups: AndConditionGroup[];
}

/**
 * サポートカード情報
 */
export interface SupportCard {
  /** 衣装名 (例: レッドストライフ) */
  costumeName: string;
  /** キャラ名 (例: ゴールドシップ) */
  characterName: string;
  /** フルネーム (例: [レッドストライフ]ゴールドシップ) */
  fullName: string;
}

/**
 * スキル種別
 */
export type SkillType = 'unique' | 'evolution' | 'normal';

/**
 * スキルデータ
 */
export interface Skill {
  /** スキル名 */
  name: string;
  /** サポートカード情報（通常スキルは null） */
  supportCard: SupportCard | null;
  /** スキル種別 */
  type: SkillType;
  /** 進化元スキル名（進化スキルのみ） */
  baseSkillName?: string;
  /** 効果説明文 */
  description: string;
  /** 評価点 */
  evaluationPoint: number;
  /** 人気ステータス (例: スピード30) */
  popularity?: string;
  /** 発動条件タイプ (例: 確定発動) */
  triggerType?: string;
  /** 発動条件式（生の文字列） */
  conditionRaw?: string;
  /** 発動条件式（パース済み） */
  condition?: Condition;
  /** 効果パラメータ */
  effectParameters: EffectParameter;
  /** 条件の日本語解説 */
  conditionDescription?: string;
}

/**
 * パース結果
 */
export interface ParseResult {
  /** パース成功したスキル一覧 */
  skills: Skill[];
  /** サポートカード一覧（重複除去済み） */
  supportCards: SupportCard[];
  /** 警告メッセージ一覧 */
  warnings: string[];
  /** パースに失敗したブロック数 */
  failedBlocks: number;
}
