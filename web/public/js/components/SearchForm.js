/**
 * 検索フォームコンポーネント
 */

/**
 * 検索フォームの値を取得
 * @returns {object} フォームの値
 */
export function getFormValues() {
  return {
    // 基本検索
    name: document.getElementById('skill-name').value.trim(),
    types: getCheckedValues('skill-type'),
    minEvaluationPoint: document.getElementById('eval-min').value,
    maxEvaluationPoint: document.getElementById('eval-max').value,

    // 詳細検索
    runningStyles: getCheckedValues('running-style'),
    distances: getCheckedValues('distance'),
    grounds: getCheckedValues('ground'),
    phases: getCheckedValues('phase'),
    effectTypes: getCheckedValues('effect-type'),
    orders: getCheckedValues('order'),
    excludeDemerit: document.getElementById('exclude-demerit').checked,
  };
}

/**
 * チェックボックスグループから選択された値を配列で取得
 * @param {string} name - チェックボックスの name 属性
 * @returns {Array<string>} 選択された値の配列
 */
function getCheckedValues(name) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * フォームをクリア
 */
export function clearForm() {
  document.getElementById('skill-name').value = '';
  document.getElementById('eval-min').value = '';
  document.getElementById('eval-max').value = '';

  // 全チェックボックスをリセット
  document.querySelectorAll('#search-form input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
}

/**
 * 詳細検索が有効かどうかを判定
 * @returns {boolean} 詳細検索が有効な場合 true
 */
export function isAdvancedSearchActive() {
  const values = getFormValues();
  return !!(
    values.runningStyles.length > 0 ||
    values.distances.length > 0 ||
    values.grounds.length > 0 ||
    values.phases.length > 0 ||
    values.effectTypes.length > 0 ||
    values.orders.length > 0 ||
    values.excludeDemerit
  );
}

/**
 * 検索フォームのイベントリスナーを設定
 * @param {function} onSearch - 検索実行時のコールバック
 */
export function setupFormListeners(onSearch) {
  const form = document.getElementById('search-form');

  // フォーム送信（Enter キー等）
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    onSearch();
  });

  // テキスト入力のリアルタイム検索
  document.getElementById('skill-name').addEventListener('input', onSearch);
  document.getElementById('eval-min').addEventListener('input', onSearch);
  document.getElementById('eval-max').addEventListener('input', onSearch);

  // 種別チェックボックスの変更
  document.querySelectorAll('input[name="skill-type"]').forEach(cb => {
    cb.addEventListener('change', onSearch);
  });
}

/**
 * 保存された条件をフォームに復元
 * @param {object} conditions - 復元する条件オブジェクト
 */
export function restoreFormValues(conditions) {
  if (!conditions) return;

  // 既知の条件キー
  const knownKeys = [
    'name', 'types', 'minEvaluationPoint', 'maxEvaluationPoint',
    'runningStyles', 'distances', 'grounds', 'phases',
    'effectTypes', 'orders', 'excludeDemerit'
  ];

  // 不明な条件キーをチェック
  const unknownKeys = Object.keys(conditions).filter(key => !knownKeys.includes(key));
  if (unknownKeys.length > 0) {
    console.warn('不明な条件項目をスキップしました:', unknownKeys);
  }

  // スキル名
  if (conditions.name !== undefined) {
    const skillNameInput = document.getElementById('skill-name');
    if (skillNameInput) {
      skillNameInput.value = conditions.name;
    }
  }

  // 評価点
  if (conditions.minEvaluationPoint !== undefined) {
    const evalMinInput = document.getElementById('eval-min');
    if (evalMinInput) {
      evalMinInput.value = conditions.minEvaluationPoint;
    }
  }
  if (conditions.maxEvaluationPoint !== undefined) {
    const evalMaxInput = document.getElementById('eval-max');
    if (evalMaxInput) {
      evalMaxInput.value = conditions.maxEvaluationPoint;
    }
  }

  // チェックボックス系を復元
  restoreCheckboxGroup('skill-type', conditions.types);
  restoreCheckboxGroup('running-style', conditions.runningStyles);
  restoreCheckboxGroup('distance', conditions.distances);
  restoreCheckboxGroup('ground', conditions.grounds);
  restoreCheckboxGroup('phase', conditions.phases);
  restoreCheckboxGroup('effect-type', conditions.effectTypes);
  restoreCheckboxGroup('order', conditions.orders);

  // デバフ除外
  if (conditions.excludeDemerit !== undefined) {
    const excludeDemeritCheckbox = document.getElementById('exclude-demerit');
    if (excludeDemeritCheckbox) {
      excludeDemeritCheckbox.checked = conditions.excludeDemerit;
    }
  }
}

/**
 * チェックボックスグループを復元
 * @param {string} name - チェックボックスの name 属性
 * @param {Array<string>} values - 選択する値の配列
 */
function restoreCheckboxGroup(name, values) {
  if (!values || !Array.isArray(values)) return;

  const checkboxes = document.querySelectorAll(`input[name="${name}"]`);
  checkboxes.forEach(cb => {
    cb.checked = values.includes(cb.value);
  });
}
