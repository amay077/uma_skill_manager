/**
 * スキルカードコンポーネント
 */

import { RUNNING_STYLES, DISTANCES, GROUNDS, PHASES, SKILL_TYPES } from '../db/constants.js';

/**
 * 効果種別のアイコン定義
 */
const EFFECT_ICONS = {
  targetSpeed: { icon: '⚡', label: '速度', className: 'effect-speed' },
  currentSpeed: { icon: '⚡', label: '速度', className: 'effect-speed' },
  acceleration: { icon: '🚀', label: '加速', className: 'effect-accel' },
  hpRecovery: { icon: '💚', label: '回復', className: 'effect-recovery' },
};


/**
 * スキルカードの HTML を生成
 * @param {object} skill - スキルデータ
 * @returns {string} HTML 文字列
 */
export function renderSkillCard(skill) {
  // sub_type を基準に表示タイプを決定
  const typeInfo = SKILL_TYPES[skill.sub_type] || { label: skill.sub_type || skill.type, className: '' };

  // 効果パラメータを解析
  const effectInfo = parseEffectParams(skill.effect_params);

  return `
    <div class="skill-card" data-skill-id="${skill.id}">
      <div class="skill-card-header">
        <div>
          <span class="skill-type ${typeInfo.className}">${typeInfo.label}</span>
          <span class="skill-name">${escapeHtml(skill.name)}</span>
        </div>
        <div class="skill-meta">
          <span class="skill-eval">評価点: ${skill.evaluation_point}</span>
          ${effectInfo.duration ? `<span class="skill-duration">⏱ ${effectInfo.duration}s</span>` : ''}
        </div>
      </div>

      ${skill.support_card_full_name ? `
        <div class="skill-support">${escapeHtml(skill.support_card_full_name)}</div>
      ` : ''}

      <div class="skill-description">${escapeHtml(skill.description)}</div>

      ${renderEffects(effectInfo.effects)}
      ${renderOrderBadges(skill.order_flags)}
      ${renderFlags(skill)}

      <button type="button" class="skill-details-toggle" data-skill-id="${skill.id}">
        ▼ 詳細を表示
      </button>

      <div class="skill-details" id="details-${skill.id}" style="display: none;">
        ${renderDetails(skill)}
      </div>
    </div>
  `;
}

/**
 * 効果量を複数表示（アイコン付き）
 * @param {Array} effects - 効果配列
 * @returns {string} HTML 文字列
 */
function renderEffects(effects) {
  if (!effects || effects.length === 0) return '';

  const effectsHtml = effects.map(e => `
    <span class="skill-effect ${e.className}">
      ${e.icon} ${e.label}: ${e.value}
    </span>
  `).join('');

  return `<div class="skill-effects">${effectsHtml}</div>`;
}

/**
 * 発動順位（1位〜9位）のバッジを表示
 * @param {string} flags - "111111111" 形式のフラグ文字列（9桁）
 * @returns {string} HTML 文字列
 */
function renderOrderBadges(flags) {
  if (!flags) return '';

  const badges = [];
  for (let i = 0; i < 9; i++) {
    const isActive = flags[i] === '1';
    badges.push(`<span class="order-badge ${isActive ? 'active' : ''}">${i + 1}</span>`);
  }

  return `
    <div class="order-badges">
      <span class="badge-label">順位:</span>
      ${badges.join('')}
    </div>
  `;
}

/**
 * 効果パラメータを解析して全ての効果と効果時間を取得
 * @param {string} effectParams - "key:value,key:value,..." 形式の文字列
 * @returns {object} { effects: Array<{key, value, icon, label, className}>, duration }
 */
function parseEffectParams(effectParams) {
  if (!effectParams) return { effects: [], duration: null };

  const params = {};
  effectParams.split(',').forEach(pair => {
    const [key, value] = pair.split(':');
    if (key && value) {
      params[key.trim()] = parseFloat(value);
    }
  });

  // 全ての効果を収集
  const effects = [];
  const effectKeys = ['targetSpeed', 'currentSpeed', 'acceleration', 'hpRecovery'];

  for (const key of effectKeys) {
    if (params[key] !== undefined) {
      const iconInfo = EFFECT_ICONS[key];
      // currentSpeed と targetSpeed が両方ある場合は targetSpeed を優先
      if (key === 'currentSpeed' && params.targetSpeed !== undefined) {
        continue;
      }
      effects.push({
        key,
        value: params[key],
        icon: iconInfo.icon,
        label: iconInfo.label,
        className: iconInfo.className,
      });
    }
  }

  // 効果時間
  const duration = params.duration || null;

  return {
    effects,
    duration: duration !== null ? duration.toFixed(1) : null,
  };
}

/**
 * フラグ表示を生成
 * @param {object} skill - スキルデータ
 * @returns {string} HTML 文字列
 */
function renderFlags(skill) {
  // バリアント情報がない場合は空を返す
  if (!skill.running_style_flags && !skill.distance_flags) {
    return '';
  }

  return `
    <div class="skill-flags">
      ${renderFlagGroup('🏃', RUNNING_STYLES, skill.running_style_flags)}
      ${renderFlagGroup('📏', DISTANCES, skill.distance_flags)}
      ${renderFlagGroup('🌿', GROUNDS, skill.ground_flags)}
      ${renderFlagGroup('📍', PHASES, skill.phase_flags)}
    </div>
  `;
}

/**
 * フラググループを生成
 * @param {string} icon - アイコン
 * @param {object} flagDef - フラグ定義
 * @param {string} flags - フラグ文字列（例: "1101"）
 * @returns {string} HTML 文字列
 */
function renderFlagGroup(icon, flagDef, flags) {
  if (!flags) return '';

  const values = Object.entries(flagDef).map(([key, def]) => {
    const isActive = flags[def.index] === '1';
    return `<span class="flag-value ${isActive ? 'active' : ''}">${def.label}</span>`;
  }).join('');

  return `
    <div class="flag-group">
      <span class="flag-icon">${icon}</span>
      <div class="flag-values">${values}</div>
    </div>
  `;
}

/**
 * 詳細情報を生成
 * @param {object} skill - スキルデータ
 * @returns {string} HTML 文字列
 */
function renderDetails(skill) {
  let html = '';

  // 発動条件
  if (skill.condition_raw) {
    html += `
      <h4>発動条件</h4>
      <pre>${escapeHtml(skill.condition_raw)}</pre>
    `;
  }

  if (skill.condition_description) {
    html += `<p>${escapeHtml(skill.condition_description)}</p>`;
  }

  // 順位フラグ（詳細表示）
  if (skill.order_flags) {
    const orderLabels = [];
    for (let i = 0; i < 9; i++) {
      if (skill.order_flags[i] === '1') {
        orderLabels.push(`${i + 1}位`);
      }
    }
    if (orderLabels.length > 0 && orderLabels.length < 9) {
      html += `<p><strong>発動順位:</strong> ${orderLabels.join(', ')}</p>`;
    }
  }

  return html || '<p>詳細情報はありません</p>';
}

/**
 * スキルカードリストを描画
 * @param {Array} skills - スキル配列
 * @param {HTMLElement} container - 描画先のコンテナ
 */
export function renderSkillCards(skills, container) {
  // skill_id でグループ化（同じスキルが複数バリアントで重複表示されるのを防ぐ）
  const uniqueSkills = [];
  const seenIds = new Set();

  for (const skill of skills) {
    if (!seenIds.has(skill.id)) {
      uniqueSkills.push(skill);
      seenIds.add(skill.id);
    }
  }

  container.innerHTML = uniqueSkills.map(renderSkillCard).join('');

  // 詳細トグルのイベントリスナーを設定
  container.querySelectorAll('.skill-details-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const skillId = btn.dataset.skillId;
      const details = document.getElementById(`details-${skillId}`);
      const isVisible = details.style.display !== 'none';

      details.style.display = isVisible ? 'none' : 'block';
      btn.textContent = isVisible ? '▼ 詳細を表示' : '▲ 詳細を隠す';
    });
  });
}

/**
 * HTML エスケープ
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
