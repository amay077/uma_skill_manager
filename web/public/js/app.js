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
};

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
 * イベントリスナーの設定
 */
function setupEventListeners() {
  // 検索フォームの送信
  if (elements.searchForm) {
    elements.searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      state.currentPage = 1;
      await performSearch();
    });
  }

  // クリアボタン
  if (elements.clearBtn) {
    elements.clearBtn.addEventListener('click', async () => {
      clearForm();
      resetFilters();
      state.currentPage = 1;
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
  setLoadingState(true);

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
      limit: PAGINATION.PAGE_SIZE,
      offset: (state.currentPage - 1) * PAGINATION.PAGE_SIZE,
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
    setLoadingState(false);
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
  updateResultsCount(state.totalCount, state.currentPage, PAGINATION.PAGE_SIZE);

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
      pageSize: PAGINATION.PAGE_SIZE,
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
 * ローディング状態を設定
 * @param {boolean} isLoading - ローディング中かどうか
 */
function setLoadingState(isLoading) {
  const submitBtn = elements.searchForm?.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? '検索中...' : '検索';
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
