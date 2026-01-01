/**
 * 効果パラメータ
 * 目標速度・加速などの数値はゲーム内部の相対値
 */
export interface EffectParameter {
  /** 目標速度値 */
  targetSpeed?: number;
  /** 加速度値 */
  acceleration?: number;
  /** 現在速度値 */
  currentSpeed?: number;
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
 * 効果バリアント
 * 同一スキルの複数効果パターンを表現
 */
export interface EffectVariant {
  /** バリアントインデックス（条件分岐での順序、0が最大効果） */
  variantIndex: number;
  /** 多段発動の順序（0=1回目、1=2回目、...） */
  effectOrder: number;
  /** デメリット効果かどうか */
  isDemerit: boolean;
  /** 連続発動の前半条件（A->B の A 部分、生文字列） */
  triggerConditionRaw?: string;
  /** 発動条件式（生文字列） */
  activationConditionRaw?: string;
  /** 発動条件式（パース済み） */
  activationCondition?: Condition;
  /** 発動条件の日本語解説 */
  activationConditionDescription?: string;
  /** 効果パラメータ */
  effectParameters: EffectParameter;
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
 * スキル種別（大分類）
 */
export type SkillType = 'unique' | 'evolution' | 'normal';

/**
 * スキル詳細種別（小分類）
 * - unique: 固有スキル（同名スキルが存在しない type='unique' のスキル）
 * - inherited_unique: 継承固有スキル（同名の固有スキルが存在する場合、評価点が低い方）
 * - gold: 金スキル（SP合計表記あり）
 * - normal: 通常スキル（SPのみ）
 * - evolution: 進化スキル
 */
export type SkillSubType = 'unique' | 'inherited_unique' | 'gold' | 'normal' | 'evolution';

/**
 * スキルデータ
 */
export interface Skill {
  /** スキル名 */
  name: string;
  /** サポートカード情報（通常スキルは null） */
  supportCard: SupportCard | null;
  /** スキル種別（大分類） */
  type: SkillType;
  /** スキル詳細種別（小分類） */
  subType: SkillSubType;
  /** 進化元スキル名（進化スキルのみ） */
  baseSkillName?: string;
  /** スキルポイント消費（習得に必要なSP） */
  spCost?: number;
  /** スキルポイント合計（金スキルの場合、下位スキルとの合計） */
  spTotal?: number;
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
  /** 効果パラメータ（後方互換性のため維持、最大効果を返す） */
  effectParameters: EffectParameter;
  /** 条件の日本語解説 */
  conditionDescription?: string;
  /** 効果バリアント一覧（複数効果パターン対応） */
  effectVariants?: EffectVariant[];
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
