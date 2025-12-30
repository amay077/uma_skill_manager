import { advancedSearch } from '../src/db/queries.js';

// デフォルト: 通常スキル(normal)と固有スキル(unique)を対象
// gold(金), inherited_unique(継承固有), evolution(進化)は除外
const results = advancedSearch({
  runningStyle: 'nige',
  phase: 'non_late',
  effectType: 'speed',
  orderRange: 'top4',
  skillSubType: ['normal', 'unique'],
  excludeDemerit: true,
  limit: 500,
});

// 距離条件なしのスキルのみフィルタ（distance_type, distance>=, ground_type を除外）
const filtered = results.filter(r => {
  if (!r.activation_condition_raw) return true;
  const cond = r.activation_condition_raw;
  // 距離種別条件を含まない
  if (cond.includes('distance_type==')) return false;
  // 距離メートル条件を含まない
  if (/distance>=|distance<=|distance==/.test(cond)) return false;
  // バ場条件を含まない（ダート/芝限定を除外）
  if (cond.includes('ground_type==')) return false;
  return true;
});

for (const r of filtered) {
  console.log(`${r.skill_name} (${r.skill_sub_type}, ${r.evaluation_point}pt)`);
  console.log(`  条件: ${(r.activation_condition_description || r.activation_condition_raw || '').slice(0, 60)}`);
  console.log(`  効果: ${(r.effect_params || '').slice(0, 60)}`);
  console.log('');
}

console.log('合計: ' + filtered.length + ' 件');
