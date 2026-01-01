/**
 * 検索フォームコンポーネント
 */

/**
 * 検索フォームの値を取得
 * @returns {object} フォームの値
 */
export function getFormValues() {
  const form = document.getElementById('search-form');

  return {
    // 基本検索
    name: document.getElementById('skill-name').value.trim(),
    type: form.querySelector('input[name="skill-type"]:checked')?.value || '',
    minEvaluationPoint: document.getElementById('eval-min').value,
    maxEvaluationPoint: document.getElementById('eval-max').value,

    // 詳細検索
    runningStyle: getSelectedCheckboxValue('running-style'),
    distanceType: getSelectedCheckboxValue('distance'),
    groundType: getSelectedCheckboxValue('ground'),
    phase: getSelectedCheckboxValue('phase'),
    effectType: form.querySelector('input[name="effect-type"]:checked')?.value || '',
    orderRange: form.querySelector('input[name="order-range"]:checked')?.value || '',
    excludeDemerit: document.getElementById('exclude-demerit').checked,
  };
}

/**
 * チェックボックスグループから選択された値を取得
 * 複数選択の場合は最初の1つを返す（単一選択として扱う）
 * @param {string} name - チェックボックスの name 属性
 * @returns {string} 選択された値
 */
function getSelectedCheckboxValue(name) {
  const checked = document.querySelectorAll(`input[name="${name}"]:checked`);
  if (checked.length === 0) return '';
  if (checked.length === 1) return checked[0].value;
  // 複数選択は現在未対応、最初の値を返す
  return checked[0].value;
}

/**
 * フォームをクリア
 */
export function clearForm() {
  document.getElementById('skill-name').value = '';
  document.getElementById('eval-min').value = '';
  document.getElementById('eval-max').value = '';

  // ラジオボタンをリセット
  document.querySelector('input[name="skill-type"][value=""]').checked = true;
  document.querySelector('input[name="effect-type"][value=""]').checked = true;
  document.querySelector('input[name="order-range"][value=""]').checked = true;

  // チェックボックスをリセット
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
}

/**
 * 詳細検索パネルの表示/非表示を切り替え
 */
export function toggleAdvancedPanel() {
  const panel = document.getElementById('advanced-panel');
  const toggle = document.getElementById('toggle-advanced');
  const isVisible = panel.style.display !== 'none';

  panel.style.display = isVisible ? 'none' : 'block';
  toggle.classList.toggle('active', !isVisible);
  toggle.innerHTML = isVisible
    ? '<span class="toggle-icon">▼</span> 詳細検索を表示'
    : '<span class="toggle-icon">▼</span> 詳細検索を隠す';
}

/**
 * 詳細検索が有効かどうかを判定
 * @returns {boolean} 詳細検索が有効な場合 true
 */
export function isAdvancedSearchActive() {
  const values = getFormValues();
  return !!(
    values.runningStyle ||
    values.distanceType ||
    values.groundType ||
    values.phase ||
    values.effectType ||
    values.orderRange ||
    values.excludeDemerit
  );
}

/**
 * 検索フォームのイベントリスナーを設定
 * @param {function} onSearch - 検索実行時のコールバック
 */
export function setupFormListeners(onSearch) {
  const form = document.getElementById('search-form');
  const toggleBtn = document.getElementById('toggle-advanced');
  const clearBtn = document.getElementById('clear-btn');

  // フォーム送信
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    onSearch();
  });

  // 詳細検索トグル
  toggleBtn.addEventListener('click', toggleAdvancedPanel);

  // クリアボタン
  clearBtn.addEventListener('click', () => {
    clearForm();
    onSearch();
  });

  // Enter キーで検索
  document.getElementById('skill-name').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch();
    }
  });
}
