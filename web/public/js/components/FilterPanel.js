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
    runningStyleUnrestricted: isUnrestrictedChecked('running-style-unrestricted'),
    distances: getCheckedValues('distance'),
    distanceUnrestricted: isUnrestrictedChecked('distance-unrestricted'),
    grounds: getCheckedValues('ground'),
    groundUnrestricted: isUnrestrictedChecked('ground-unrestricted'),
    phases: getCheckedValues('phase'),
    phaseUnrestricted: isUnrestrictedChecked('phase-unrestricted'),
    effectTypes: getCheckedValues('effect-type'),
    orders: getCheckedValues('order'),
    excludeDemerit: document.getElementById('exclude-demerit')?.checked || false,
  };
}

/**
 * 「制限なし」チェックボックスの状態を取得
 * @param {string} name - チェックボックスの name 属性
 * @returns {boolean} チェックされていれば true
 */
function isUnrestrictedChecked(name) {
  const checkbox = document.querySelector(`input[name="${name}"]`);
  return checkbox?.checked || false;
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
 * フィルタパネルをリセット
 */
export function resetFilters() {
  // チェックボックスをすべて解除
  document.querySelectorAll('#advanced-panel input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
}

/**
 * フィルタが適用されているかどうかを判定
 * @returns {boolean} フィルタが適用されている場合 true
 */
export function hasActiveFilters() {
  const state = getFilterState();
  return (
    state.runningStyles.length > 0 ||
    state.runningStyleUnrestricted ||
    state.distances.length > 0 ||
    state.distanceUnrestricted ||
    state.grounds.length > 0 ||
    state.groundUnrestricted ||
    state.phases.length > 0 ||
    state.phaseUnrestricted ||
    state.effectTypes.length > 0 ||
    state.orders.length > 0 ||
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

  // ビットフラグ系フィルターの排他制御を設定
  setupBitFlagExclusivity('running-style', 'running-style-unrestricted');
  setupBitFlagExclusivity('distance', 'distance-unrestricted');
  setupBitFlagExclusivity('ground', 'ground-unrestricted');
  setupBitFlagExclusivity('phase', 'phase-unrestricted');

  // チェックボックスとラジオボタンの変更を監視
  panel.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', onChange);
  });
}

/**
 * ビットフラグ系フィルターの排他制御を設定
 * 「制限なし」と他のオプションが排他になるようにする
 * @param {string} optionsName - 個別オプションの name 属性
 * @param {string} unrestrictedName - 「制限なし」の name 属性
 */
function setupBitFlagExclusivity(optionsName, unrestrictedName) {
  const optionCheckboxes = document.querySelectorAll(`input[name="${optionsName}"]`);
  const unrestrictedCheckbox = document.querySelector(`input[name="${unrestrictedName}"]`);

  if (!unrestrictedCheckbox || optionCheckboxes.length === 0) return;

  // 「制限なし」がチェックされたら、他のオプションを OFF
  unrestrictedCheckbox.addEventListener('change', () => {
    if (unrestrictedCheckbox.checked) {
      optionCheckboxes.forEach(cb => {
        cb.checked = false;
      });
    }
  });

  // 個別オプションがチェックされたら、「制限なし」を OFF
  optionCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        unrestrictedCheckbox.checked = false;
      }
    });
  });
}
