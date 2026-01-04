/**
 * 保存済み検索条件管理コンポーネント
 *
 * localStorage への検索条件の保存・読み込み・削除機能を提供する。
 */

const STORAGE_KEY = 'uma-skill-search-saved';
const MAX_SAVED_CONDITIONS = 10;

/**
 * localStorage が利用可能かチェック
 * @returns {boolean} 利用可能な場合 true
 */
export function isStorageAvailable() {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 保存済み条件の一覧を取得
 * @returns {Array<{name: string, conditions: object, savedAt: string}>} 保存済み条件の配列
 */
export function getSavedConditions() {
  if (!isStorageAvailable()) {
    return [];
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('保存済み条件の読み込みに失敗しました:', e);
    return [];
  }
}

/**
 * 条件名が既に存在するかチェック
 * @param {string} name - 条件名
 * @returns {boolean} 存在する場合 true
 */
export function conditionNameExists(name) {
  const saved = getSavedConditions();
  return saved.some(item => item.name === name);
}

/**
 * 検索条件を保存
 * @param {string} name - 条件名
 * @param {object} conditions - 検索条件オブジェクト
 * @returns {{success: boolean, error?: string}} 結果
 */
export function saveCondition(name, conditions) {
  if (!isStorageAvailable()) {
    return { success: false, error: 'ブラウザの設定により検索条件を保存できません。' };
  }

  const trimmedName = name?.trim();
  if (!trimmedName) {
    return { success: false, error: '条件名を入力してください。' };
  }

  const saved = getSavedConditions();
  const existingIndex = saved.findIndex(item => item.name === trimmedName);

  // 上書きでなく新規追加の場合、件数制限をチェック
  if (existingIndex === -1 && saved.length >= MAX_SAVED_CONDITIONS) {
    return { success: false, error: '保存上限（10件）に達しています。不要な条件を削除してください。' };
  }

  const newItem = {
    name: trimmedName,
    conditions,
    savedAt: new Date().toISOString(),
  };

  if (existingIndex !== -1) {
    // 上書き
    saved[existingIndex] = newItem;
  } else {
    // 新規追加
    saved.push(newItem);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return { success: true };
  } catch (e) {
    console.error('保存に失敗しました:', e);
    return { success: false, error: '保存に失敗しました。' };
  }
}

/**
 * 保存済み条件を削除
 * @param {string} name - 削除する条件名
 * @returns {{success: boolean, error?: string}} 結果
 */
export function deleteCondition(name) {
  if (!isStorageAvailable()) {
    return { success: false, error: 'ブラウザの設定により操作できません。' };
  }

  const saved = getSavedConditions();
  const index = saved.findIndex(item => item.name === name);

  if (index === -1) {
    return { success: false, error: '指定された条件が見つかりません。' };
  }

  saved.splice(index, 1);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return { success: true };
  } catch (e) {
    console.error('削除に失敗しました:', e);
    return { success: false, error: '削除に失敗しました。' };
  }
}

/**
 * 指定した名前の条件を取得
 * @param {string} name - 条件名
 * @returns {object|null} 条件オブジェクト、見つからない場合は null
 */
export function getConditionByName(name) {
  const saved = getSavedConditions();
  const item = saved.find(item => item.name === name);
  return item ? item.conditions : null;
}

/**
 * 保存済み条件の件数を取得
 * @returns {number} 件数
 */
export function getSavedConditionCount() {
  return getSavedConditions().length;
}
