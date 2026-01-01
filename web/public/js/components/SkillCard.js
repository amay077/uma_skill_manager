/**
 * スキルカードコンポーネント
 */

import { RUNNING_STYLES, DISTANCES, GROUNDS, PHASES, SKILL_TYPES } from '../db/constants.js';

/**
 * スキルカードの HTML を生成
 * @param {object} skill - スキルデータ
 * @returns {string} HTML 文字列
 */
export function renderSkillCard(skill) {
  // sub_type が inherited_unique の場合は継承固有として表示
  const displayType = skill.sub_type === 'inherited_unique' ? 'inherited_unique' : skill.type;
  const typeInfo = SKILL_TYPES[displayType] || { label: skill.type, className: '' };

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
          ${effectInfo.effectValue ? `<span class="skill-effect">効果量: ${effectInfo.effectValue}</span>` : ''}
          ${effectInfo.duration ? `<span class="skill-duration">効果時間: ${effectInfo.duration}s</span>` : ''}
        </div>
      </div>

      ${skill.support_card_full_name ? `
        <div class="skill-support">${escapeHtml(skill.support_card_full_name)}</div>
      ` : ''}

      <div class="skill-description">${escapeHtml(skill.description)}</div>

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
 * 効果パラメータを解析して効果量と効果時間を取得
 * @param {string} effectParams - "key:value,key:value,..." 形式の文字列
 * @returns {object} { effectValue, duration, effectType }
 */
function parseEffectParams(effectParams) {
  if (!effectParams) return {};

  const params = {};
  effectParams.split(',').forEach(pair => {
    const [key, value] = pair.split(':');
    if (key && value) {
      params[key.trim()] = parseFloat(value);
    }
  });

  // 効果量を決定（優先順位: targetSpeed > currentSpeed > acceleration > hpRecovery）
  let effectValue = null;
  let effectType = null;

  if (params.targetSpeed !== undefined) {
    effectValue = params.targetSpeed;
    effectType = 'speed';
  } else if (params.currentSpeed !== undefined) {
    effectValue = params.currentSpeed;
    effectType = 'speed';
  } else if (params.acceleration !== undefined) {
    effectValue = params.acceleration;
    effectType = 'accel';
  } else if (params.hpRecovery !== undefined) {
    effectValue = params.hpRecovery;
    effectType = 'stamina';
  }

  // 効果時間
  const duration = params.duration || null;

  return {
    effectValue: effectValue !== null ? effectValue.toFixed(2) : null,
    duration: duration !== null ? duration.toFixed(1) : null,
    effectType,
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
  container.innerHTML = skills.map(renderSkillCard).join('');

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
