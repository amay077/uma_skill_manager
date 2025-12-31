/**
 * ウマ娘 DB CSS セレクタ定義
 */

export const SELECTORS = {
  /** 検索結果テーブル */
  RESULT_TABLE: 'table.b-table',

  /** テーブル行 */
  TABLE_ROW: 'tbody tr',

  /** ユーザー ID */
  USER_ID: '.header span',

  /** 因子セレクタ */
  FACTOR: {
    /** 青因子（ステータス因子） */
    BLUE: '.factor1',
    /** 赤因子（適性因子） */
    RED: '.factor2',
    /** 緑因子（固有スキル因子） */
    GREEN: '.factor3',
    /** 白因子（共通スキル） */
    WHITE_SKILL: '.factor4',
    /** 白因子（レース） */
    WHITE_RACE: '.factor5',
    /** 白因子（シナリオ） */
    WHITE_SCENARIO: '.factor6',
  },

  /** 白因子セクションボタン */
  WHITE_FACTOR_SECTION: 'button:has-text("白因子（共通スキル）")',

  /** スキル選択コンテナ（vue-select） */
  SKILL_SELECT_CONTAINER: '.v-select',

  /** スキル選択欄のドロップダウントグル */
  SKILL_SELECT_TOGGLE: '.v-select .vs__dropdown-toggle',

  /** スキル選択欄（展開後の検索入力） */
  SKILL_SELECT_INPUT: '.v-select .vs__search',

  /** ドロップダウンメニュー */
  DROPDOWN_MENU: '.vs__dropdown-menu',

  /** ドロップダウンオプション */
  DROPDOWN_OPTION: '.vs__dropdown-menu .vs__dropdown-option',

  /** 検索ボタン */
  SEARCH_BUTTON: 'button:has-text("検索")',

  /** リセットボタン */
  RESET_BUTTON: 'button:has-text("リセット")',

  /** 検索結果件数 */
  RESULT_COUNT: 'text=/検索結果.*件/',

  /** ローディングインジケータ */
  LOADING: '.loading, .spinner',

  /** 広告ダイアログ */
  AD_DIALOG: '.modal, [role="dialog"]',

  /** 白因子行削除ボタン */
  DELETE_ROW_BUTTON: 'button:has-text("削除"), button.delete-btn, .remove-btn',

  /** 白因子（共通スキル）セクション */
  WHITE_SKILL: {
    /** セクションラベル */
    LABEL: '白因子（共通スキル）',
    /** スキル選択コンテナ */
    CONTAINER: '#common_factor_skill',
    /** 追加ボタン内の + アイコン */
    ADD_ICON: '.svg-inline--fa.fa-plus',
  },

  /** 検索条件セクション（実際のサイトで確認された ID） */
  SEARCH_CONDITIONS: {
    /** 白因子合計数入力 */
    WHITE_FACTOR_INPUT: '#white_factor_count',
    /** 勝数入力 */
    WIN_COUNT_INPUT: '#win_count',
    /** G1勝数入力 */
    G1_WINS_INPUT: '#g1_win_count',
    /** 検索件数入力 */
    SEARCH_COUNT_INPUT: '#search_count',
  },

  /** 因子セクションのラベル */
  FACTOR_LABELS: {
    /** 白因子（共通スキル）セクション */
    WHITE_SKILL: 'label:has-text("白因子（共通スキル）")',
    /** 青因子セクション */
    BLUE: 'label:has-text("青因子")',
    /** 赤因子セクション */
    RED: 'label:has-text("赤因子")',
  },

  /** ページネーション */
  PAGINATION: {
    /** ページネーションコンテナ */
    CONTAINER: 'ul.pagination.b-pagination',
    /** 次ページボタン */
    NEXT_PAGE: 'button[aria-label="Go to next page"]',
    /** 最終ページボタン */
    LAST_PAGE: 'button[aria-label="Go to last page"]',
    /** アクティブなページ */
    ACTIVE_PAGE: '.page-item.active button',
    /** ページ番号ボタン */
    PAGE_BUTTON: 'button[aria-label^="Go to page"]',
  },
} as const;

/** ウマ娘 DB の URL */
export const UMA_DB_URL = 'https://uma.pure-db.com/#/search';
