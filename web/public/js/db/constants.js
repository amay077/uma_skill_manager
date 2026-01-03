/**
 * 定数定義モジュール
 */

// 作戦タイプ
export const RUNNING_STYLES = {
  nige: { index: 0, label: '逃', fullLabel: '逃げ' },
  senkou: { index: 1, label: '先', fullLabel: '先行' },
  sashi: { index: 2, label: '差', fullLabel: '差し' },
  oikomi: { index: 3, label: '追', fullLabel: '追込' },
};

// 距離タイプ
export const DISTANCES = {
  short: { index: 0, label: '短', fullLabel: '短距離' },
  mile: { index: 1, label: 'マ', fullLabel: 'マイル' },
  middle: { index: 2, label: '中', fullLabel: '中距離' },
  long: { index: 3, label: '長', fullLabel: '長距離' },
};

// バ場タイプ
export const GROUNDS = {
  turf: { index: 0, label: '芝', fullLabel: '芝' },
  dirt: { index: 1, label: 'ダ', fullLabel: 'ダート' },
};

// フェーズタイプ
export const PHASES = {
  early: { index: 0, label: '序', fullLabel: '序盤' },
  mid: { index: 1, label: '中', fullLabel: '中盤' },
  late: { index: 2, label: '終', fullLabel: '終盤' },
};

// 効果種別
export const EFFECT_TYPES = {
  speed: { label: '速度', pattern: 'targetSpeed|currentSpeed' },
  accel: { label: '加速', pattern: 'acceleration' },
  stamina: { label: '回復', pattern: 'hpRecovery' },
  position: { label: '位置', pattern: 'positionKeep|temptationDecay' },
  debuff: { label: 'デバフ', isDemerit: true },
};

// 順位条件
export const ORDER_RANGES = {
  top1: { label: '1位', positions: [1] },
  top2: { label: '2位以内', positions: [1, 2] },
  top4: { label: '4位以内', positions: [1, 2, 3, 4] },
  top6: { label: '6位以内', positions: [1, 2, 3, 4, 5, 6] },
  mid: { label: '中団', positions: [4, 5, 6] },
  back: { label: '後方', positions: [6, 7, 8, 9] },
};

// スキルタイプの表示名（sub_type ベース）
export const SKILL_TYPES = {
  evolution: { label: '進化', className: 'evolution' },
  unique: { label: '固有', className: 'unique' },
  inherited_unique: { label: '継承固有', className: 'inherited-unique' },
  gold: { label: '金', className: 'gold' },
  normal: { label: '白', className: 'normal' },
};

// ページネーション設定
export const PAGINATION = {
  PAGE_SIZE: 20,
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100, 300],
};
