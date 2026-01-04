/**
 * ウマ娘スキル検索アプリケーション
 *
 * エントリーポイントモジュール。
 * DuckDB-WASM の初期化、検索機能、UI イベントの統合を行う。
 */

import { initDatabase } from './db/init.js';
import { advancedSearch, countAdvancedSearch } from './db/queries.js';
import { PAGINATION } from './db/constants.js';
import { getFormValues, clearForm, setupFormListeners, restoreFormValues } from './components/SearchForm.js';
import {
  isStorageAvailable,
  getSavedConditions,
  saveCondition,
  deleteCondition,
  getConditionByName,
  conditionNameExists,
} from './components/SavedSearchManager.js';
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
  saveConditionBtn: null,
  savedConditionsSelect: null,
  deleteConditionBtn: null,
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
  elements.saveConditionBtn = document.getElementById('save-condition-btn');
  elements.savedConditionsSelect = document.getElementById('saved-conditions-select');
  elements.deleteConditionBtn = document.getElementById('delete-condition-btn');

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

    // 保存済み条件 UI の初期化
    initSavedConditionsUI();

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
      // 保存済み条件のセレクトボックスもリセット
      if (elements.savedConditionsSelect) {
        elements.savedConditionsSelect.value = '';
      }
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

  // 保存ボタン
  if (elements.saveConditionBtn) {
    elements.saveConditionBtn.addEventListener('click', handleSaveCondition);
  }

  // 保存済み条件の選択
  if (elements.savedConditionsSelect) {
    elements.savedConditionsSelect.addEventListener('change', handleSelectCondition);
  }

  // 削除ボタン
  if (elements.deleteConditionBtn) {
    elements.deleteConditionBtn.addEventListener('click', handleDeleteCondition);
  }
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

/**
 * 保存済み条件 UI の初期化
 */
function initSavedConditionsUI() {
  // localStorage が利用できない場合は保存機能を無効化
  if (!isStorageAvailable()) {
    if (elements.saveConditionBtn) {
      elements.saveConditionBtn.disabled = true;
      elements.saveConditionBtn.title = 'ブラウザの設定により検索条件を保存できません。';
    }
    return;
  }

  // 保存済み条件をセレクトボックスに反映
  refreshSavedConditionsSelect();
}

/**
 * 保存済み条件セレクトボックスを更新
 */
function refreshSavedConditionsSelect() {
  if (!elements.savedConditionsSelect) return;

  const savedConditions = getSavedConditions();

  // 既存のオプションをクリア（最初の placeholder 以外）
  while (elements.savedConditionsSelect.options.length > 1) {
    elements.savedConditionsSelect.remove(1);
  }

  // 保存済み条件を追加
  savedConditions.forEach(item => {
    const option = document.createElement('option');
    option.value = item.name;
    option.textContent = item.name;
    elements.savedConditionsSelect.appendChild(option);
  });

  // 削除ボタンの状態を更新
  updateDeleteButtonState();
}

/**
 * 削除ボタンの有効/無効を更新
 */
function updateDeleteButtonState() {
  if (!elements.deleteConditionBtn || !elements.savedConditionsSelect) return;

  const hasSelection = elements.savedConditionsSelect.value !== '';
  elements.deleteConditionBtn.disabled = !hasSelection;
}

/**
 * 条件保存の処理
 */
function handleSaveCondition() {
  if (!isStorageAvailable()) {
    alert('ブラウザの設定により検索条件を保存できません。');
    return;
  }

  const name = prompt('条件名を入力してください:');

  // キャンセルされた場合
  if (name === null) {
    return;
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    alert('条件名を入力してください。');
    return;
  }

  // 重複チェック
  if (conditionNameExists(trimmedName)) {
    const confirmOverwrite = confirm(`「${trimmedName}」は既に存在します。上書きしますか？`);
    if (!confirmOverwrite) {
      return;
    }
  }

  // 現在の検索条件を取得
  const formValues = getFormValues();
  const filterState = getFilterState();

  const conditions = {
    name: formValues.name,
    types: formValues.types,
    minEvaluationPoint: formValues.minEvaluationPoint,
    maxEvaluationPoint: formValues.maxEvaluationPoint,
    runningStyles: filterState.runningStyles,
    distances: filterState.distances,
    grounds: filterState.grounds,
    phases: filterState.phases,
    effectTypes: filterState.effectTypes,
    orders: filterState.orders,
    excludeDemerit: filterState.excludeDemerit,
  };

  const result = saveCondition(trimmedName, conditions);

  if (result.success) {
    refreshSavedConditionsSelect();
    // 保存した条件を選択状態にする
    if (elements.savedConditionsSelect) {
      elements.savedConditionsSelect.value = trimmedName;
      updateDeleteButtonState();
    }
  } else {
    alert(result.error);
  }
}

/**
 * 条件選択時の処理
 */
async function handleSelectCondition() {
  const selectedName = elements.savedConditionsSelect?.value;

  // 削除ボタンの状態を更新
  updateDeleteButtonState();

  if (!selectedName) {
    return;
  }

  const conditions = getConditionByName(selectedName);
  if (!conditions) {
    alert('条件の読み込みに失敗しました。');
    return;
  }

  // フォームをクリアしてから復元
  clearForm();
  resetFilters();
  restoreFormValues(conditions);

  // 検索を実行
  state.currentPage = 1;
  await performSearch();
}

/**
 * 条件削除時の処理
 */
function handleDeleteCondition() {
  const selectedName = elements.savedConditionsSelect?.value;

  if (!selectedName) {
    return;
  }

  const confirmDelete = confirm(`「${selectedName}」を削除しますか？`);
  if (!confirmDelete) {
    return;
  }

  const result = deleteCondition(selectedName);

  if (result.success) {
    refreshSavedConditionsSelect();
    // セレクトボックスをリセット
    if (elements.savedConditionsSelect) {
      elements.savedConditionsSelect.value = '';
      updateDeleteButtonState();
    }
  } else {
    alert(result.error);
  }
}

// DOM 読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', init);
