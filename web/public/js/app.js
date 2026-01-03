/**
 * ウマ娘スキル検索アプリケーション
 *
 * エントリーポイントモジュール。
 * DuckDB-WASM の初期化、検索機能、UI イベントの統合を行う。
 */

import { initDatabase } from './db/init.js';
import { advancedSearch, countAdvancedSearch } from './db/queries.js';
import { PAGINATION } from './db/constants.js';
import { getFormValues, clearForm, setupFormListeners } from './components/SearchForm.js';
import { renderSkillCards } from './components/SkillCard.js';
import { renderPagination, updateResultsCount } from './components/Pagination.js';
import { getFilterState, resetFilters, hasActiveFilters, setupFilterListeners } from './components/FilterPanel.js';

// 状態管理
const state = {
  currentPage: 1,
  pageSize: PAGINATION.defaultPageSize,
  totalCount: 0,
  isLoading: false,
};

// DOM 要素
const elements = {
  loading: null,
  searchSection: null,
  resultsSection: null,
  searchForm: null,
  resultsList: null,
  clearBtn: null,
  advancedToggleMobile: null,
  advancedPanel: null,
  pageSizeSelect: null,
};

// モバイル判定のブレークポイント
const MOBILE_BREAKPOINT = 767;

/**
 * アプリケーションの初期化
 */
async function init() {
  // DOM 要素の取得
  elements.loading = document.getElementById('loading');
  elements.searchSection = document.getElementById('search-section');
  elements.resultsSection = document.getElementById('results-section');
  elements.searchForm = document.getElementById('search-form');
  elements.resultsList = document.getElementById('results-list');
  elements.clearBtn = document.getElementById('clear-btn');
  elements.advancedToggleMobile = document.getElementById('advanced-toggle-mobile');
  elements.advancedPanel = document.getElementById('advanced-panel');
  elements.pageSizeSelect = document.getElementById('page-size');

  try {
    // DuckDB-WASM の初期化
    await initDatabase((status) => {
      const loadingText = elements.loading?.querySelector('p');
      if (loadingText) {
        loadingText.textContent = status;
      }
    });

    // UI を表示
    showUI();

    // モバイル用折りたたみ機能の初期化
    initMobileAdvancedPanel();

    // イベントリスナーの設定
    setupEventListeners();

    // 初期検索を実行
    await performSearch();
  } catch (error) {
    console.error('初期化エラー:', error);
    showError('データベースの読み込みに失敗しました。ページを再読み込みしてください。');
  }
}

/**
 * UI を表示状態にする
 */
function showUI() {
  if (elements.loading) {
    elements.loading.style.display = 'none';
  }
  if (elements.searchSection) {
    elements.searchSection.style.display = 'block';
  }
  if (elements.resultsSection) {
    elements.resultsSection.style.display = 'block';
  }
}

/**
 * エラーメッセージを表示
 * @param {string} message - エラーメッセージ
 */
function showError(message) {
  if (elements.loading) {
    elements.loading.innerHTML = `
      <div style="color: var(--danger-color); text-align: center;">
        <p>⚠️ ${message}</p>
      </div>
    `;
  }
}

/**
 * モバイルかどうかを判定
 * @returns {boolean} モバイルの場合 true
 */
function isMobile() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

/**
 * モバイル用詳細パネルの初期化
 */
function initMobileAdvancedPanel() {
  if (!elements.advancedToggleMobile || !elements.advancedPanel) return;

  // モバイルの場合は初期状態で折りたたみ
  if (isMobile()) {
    elements.advancedPanel.classList.add('collapsed');
    elements.advancedToggleMobile.classList.remove('expanded');
  }

  // トグルボタンのクリックイベント
  elements.advancedToggleMobile.addEventListener('click', () => {
    toggleAdvancedPanel();
  });

  // 画面サイズ変更時の対応
  window.addEventListener('resize', debounce(() => {
    handleResize();
  }, 100));
}

/**
 * 詳細パネルの展開・折りたたみを切り替え
 */
function toggleAdvancedPanel() {
  if (!elements.advancedToggleMobile || !elements.advancedPanel) return;

  const isCollapsed = elements.advancedPanel.classList.contains('collapsed');

  if (isCollapsed) {
    // 展開
    elements.advancedPanel.classList.remove('collapsed');
    elements.advancedToggleMobile.classList.add('expanded');
  } else {
    // 折りたたみ
    elements.advancedPanel.classList.add('collapsed');
    elements.advancedToggleMobile.classList.remove('expanded');
  }
}

/**
 * 画面サイズ変更時の処理
 */
function handleResize() {
  if (!elements.advancedPanel) return;

  if (isMobile()) {
    // モバイル: 折りたたみ状態を維持（何もしない）
  } else {
    // デスクトップ/タブレット: 常に展開
    elements.advancedPanel.classList.remove('collapsed');
    if (elements.advancedToggleMobile) {
      elements.advancedToggleMobile.classList.remove('expanded');
    }
  }
}

/**
 * イベントリスナーの設定
 */
function setupEventListeners() {
  // クリアボタン
  if (elements.clearBtn) {
    elements.clearBtn.addEventListener('click', async () => {
      clearForm();
      resetFilters();
      state.currentPage = 1;
      await performSearch();
    });
  }

  // 表示件数セレクタ
  if (elements.pageSizeSelect) {
    elements.pageSizeSelect.addEventListener('change', async (e) => {
      state.pageSize = parseInt(e.target.value, 10);
      state.currentPage = 1; // ページを1にリセット
      await performSearch();
    });
  }

  // 検索フォームの変更監視（リアルタイム検索）
  // 注: setupFormListeners 内で toggle-advanced のイベントも設定される
  setupFormListeners(debounce(async () => {
    state.currentPage = 1;
    await performSearch();
  }, 300));

  // フィルタパネルの変更監視
  setupFilterListeners(debounce(async () => {
    state.currentPage = 1;
    await performSearch();
  }, 300));
}

/**
 * 検索を実行
 */
async function performSearch() {
  if (state.isLoading) return;

  state.isLoading = true;

  try {
    const formValues = getFormValues();
    const filterState = getFilterState();

    // 検索オプションを構築
    const options = buildSearchOptions(formValues, filterState);

    // 件数を取得
    state.totalCount = await countAdvancedSearch(options);

    // 検索を実行
    const skills = await advancedSearch({
      ...options,
      limit: state.pageSize,
      offset: (state.currentPage - 1) * state.pageSize,
    });

    // 結果を表示
    renderResults(skills);
  } catch (error) {
    console.error('検索エラー:', error.message, error.stack);
    if (elements.resultsList) {
      elements.resultsList.innerHTML = `
        <div style="color: var(--danger-color); text-align: center; padding: 2rem;">
          <p>検索中にエラーが発生しました</p>
          <p style="font-size: 0.75rem; color: #999;">${error.message || 'Unknown error'}</p>
        </div>
      `;
    }
  } finally {
    state.isLoading = false;
  }
}

/**
 * 検索オプションを構築
 * @param {object} formValues - フォームの値
 * @param {object} filterState - フィルタの状態
 * @returns {object} 検索オプション
 */
function buildSearchOptions(formValues, filterState) {
  const options = {};

  // 基本検索
  if (formValues.name) {
    options.name = formValues.name;
  }
  // 種別フィルタ（配列）
  if (formValues.types && formValues.types.length > 0) {
    options.types = formValues.types;
  }
  if (formValues.minEvaluationPoint !== '') {
    options.minEvaluationPoint = formValues.minEvaluationPoint;
  }
  if (formValues.maxEvaluationPoint !== '') {
    options.maxEvaluationPoint = formValues.maxEvaluationPoint;
  }

  // 詳細フィルタ（すべて配列で渡す）
  options.runningStyles = filterState.runningStyles;
  options.distances = filterState.distances;
  options.grounds = filterState.grounds;
  options.phases = filterState.phases;
  options.effectTypes = filterState.effectTypes;
  options.orders = filterState.orders;

  if (filterState.excludeDemerit) {
    options.excludeDemerit = true;
  }

  return options;
}

/**
 * 検索結果を表示
 * @param {Array} skills - スキル配列
 */
function renderResults(skills) {
  // 件数を更新
  updateResultsCount(state.totalCount, state.currentPage, state.pageSize);

  // スキルカードを表示
  if (elements.resultsList) {
    renderSkillCards(skills, elements.resultsList);
  }

  // ページネーションを表示
  const paginationContainer = document.getElementById('pagination');
  if (paginationContainer) {
    renderPagination({
      currentPage: state.currentPage,
      totalItems: state.totalCount,
      pageSize: state.pageSize,
      onPageChange: async (page) => {
        state.currentPage = page;
        await performSearch();
        // ページ変更時にスクロール
        elements.resultsSection?.scrollIntoView({ behavior: 'smooth' });
      }
    }, paginationContainer);
  }
}

/**
 * デバウンス関数
 * @param {Function} func - 実行する関数
 * @param {number} wait - 待機時間（ミリ秒）
 * @returns {Function} デバウンスされた関数
 */
function debounce(func, wait) {
  let timeoutId = null;
  return function (...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

// DOM 読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', init);
