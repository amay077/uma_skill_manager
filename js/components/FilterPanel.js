/**
 * フィルタパネルコンポーネント
 *
 * このモジュールは HTML で定義済みのフィルタ要素を補助するユーティリティを提供します。
 * フィルタ要素自体は index.html で定義されています。
 */

/**
 * フィルタパネルの状態を取得
 * @returns {object} フィルタの状態
 */
export function getFilterState() {
  return {
    runningStyles: getCheckedValues('running-style'),
    distances: getCheckedValues('distance'),
    grounds: getCheckedValues('ground'),
    phases: getCheckedValues('phase'),
    effectType: getRadioValue('effect-type'),
    orderRange: getRadioValue('order-range'),
    excludeDemerit: document.getElementById('exclude-demerit')?.checked || false,
  };
}

/**
 * チェックボックスの選択値を取得
 * @param {string} name - チェックボックスの name 属性
 * @returns {Array<string>} 選択された値の配列
 */
function getCheckedValues(name) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * ラジオボタンの選択値を取得
 * @param {string} name - ラジオボタンの name 属性
 * @returns {string} 選択された値
 */
function getRadioValue(name) {
  const radio = document.querySelector(`input[name="${name}"]:checked`);
  return radio?.value || '';
}

/**
 * フィルタパネルをリセット
 */
export function resetFilters() {
  // チェックボックスをすべて解除
  document.querySelectorAll('#advanced-panel input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });

  // ラジオボタンをデフォルトに戻す
  const effectTypeDefault = document.querySelector('input[name="effect-type"][value=""]');
  if (effectTypeDefault) effectTypeDefault.checked = true;

  const orderRangeDefault = document.querySelector('input[name="order-range"][value=""]');
  if (orderRangeDefault) orderRangeDefault.checked = true;
}

/**
 * フィルタが適用されているかどうかを判定
 * @returns {boolean} フィルタが適用されている場合 true
 */
export function hasActiveFilters() {
  const state = getFilterState();
  return (
    state.runningStyles.length > 0 ||
    state.distances.length > 0 ||
    state.grounds.length > 0 ||
    state.phases.length > 0 ||
    state.effectType !== '' ||
    state.orderRange !== '' ||
    state.excludeDemerit
  );
}

/**
 * フィルタ変更時のリスナーを設定
 * @param {function} onChange - 変更時のコールバック
 */
export function setupFilterListeners(onChange) {
  const panel = document.getElementById('advanced-panel');
  if (!panel) return;

  // チェックボックスとラジオボタンの変更を監視
  panel.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', onChange);
  });
}
