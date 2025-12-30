-- Uma Skill Manager Database Schema
-- Phase 2: データベース構築

-- サポートカードテーブル
CREATE TABLE IF NOT EXISTS support_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  costume_name TEXT NOT NULL,
  character_name TEXT NOT NULL,
  full_name TEXT NOT NULL UNIQUE
);

-- スキルテーブル
CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  support_card_id INTEGER,
  type TEXT NOT NULL CHECK (type IN ('unique', 'evolution', 'normal')),
  sub_type TEXT NOT NULL CHECK (sub_type IN ('unique', 'inherited_unique', 'gold', 'normal', 'evolution')),
  base_skill_name TEXT,
  sp_cost INTEGER,
  sp_total INTEGER,
  description TEXT NOT NULL,
  evaluation_point INTEGER NOT NULL,
  popularity TEXT,
  trigger_type TEXT,
  condition_raw TEXT,
  condition_description TEXT,
  FOREIGN KEY (support_card_id) REFERENCES support_cards(id)
);

-- 発動条件テーブル（正規化）
CREATE TABLE IF NOT EXISTS skill_conditions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id INTEGER NOT NULL,
  group_index INTEGER NOT NULL,
  condition_index INTEGER NOT NULL,
  variable TEXT NOT NULL,
  operator TEXT NOT NULL,
  value REAL NOT NULL,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- 効果パラメータテーブル（KV形式）
CREATE TABLE IF NOT EXISTS effect_parameters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id INTEGER NOT NULL,
  parameter_key TEXT NOT NULL,
  parameter_value REAL NOT NULL,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- 効果バリアントテーブル（USM-003: 複数効果パターン対応）
CREATE TABLE IF NOT EXISTS skill_effect_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id INTEGER NOT NULL,
  variant_index INTEGER NOT NULL,
  trigger_condition_raw TEXT,
  activation_condition_raw TEXT,
  activation_condition_description TEXT,
  effect_order INTEGER NOT NULL DEFAULT 0,
  is_demerit INTEGER NOT NULL DEFAULT 0,
  -- ビットフラグ条件カラム
  running_style_flags TEXT NOT NULL DEFAULT '1111',     -- 逃げ/先行/差し/追込（4桁）
  distance_flags TEXT NOT NULL DEFAULT '1111',          -- 短距離/マイル/中距離/長距離（4桁）
  ground_flags TEXT NOT NULL DEFAULT '11',              -- 芝/ダート（2桁）
  order_flags TEXT NOT NULL DEFAULT '111111111',        -- 1位〜9位（9桁）
  phase_flags TEXT NOT NULL DEFAULT '111',              -- 序盤/中盤/終盤（3桁）
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- バリアント効果パラメータテーブル
CREATE TABLE IF NOT EXISTS variant_parameters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id INTEGER NOT NULL,
  parameter_key TEXT NOT NULL,
  parameter_value REAL NOT NULL,
  FOREIGN KEY (variant_id) REFERENCES skill_effect_variants(id) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_type ON skills(type);
CREATE INDEX IF NOT EXISTS idx_skills_sub_type ON skills(sub_type);
CREATE INDEX IF NOT EXISTS idx_skills_support_card_id ON skills(support_card_id);
CREATE INDEX IF NOT EXISTS idx_skill_conditions_skill_id ON skill_conditions(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_conditions_variable ON skill_conditions(variable);
CREATE INDEX IF NOT EXISTS idx_effect_parameters_skill_id ON effect_parameters(skill_id);
CREATE INDEX IF NOT EXISTS idx_effect_parameters_key ON effect_parameters(parameter_key);
CREATE INDEX IF NOT EXISTS idx_skill_effect_variants_skill_id ON skill_effect_variants(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_effect_variants_effect_order ON skill_effect_variants(effect_order);
CREATE INDEX IF NOT EXISTS idx_skill_effect_variants_running_style_flags ON skill_effect_variants(running_style_flags);
CREATE INDEX IF NOT EXISTS idx_skill_effect_variants_distance_flags ON skill_effect_variants(distance_flags);
CREATE INDEX IF NOT EXISTS idx_skill_effect_variants_ground_flags ON skill_effect_variants(ground_flags);
CREATE INDEX IF NOT EXISTS idx_skill_effect_variants_order_flags ON skill_effect_variants(order_flags);
CREATE INDEX IF NOT EXISTS idx_skill_effect_variants_phase_flags ON skill_effect_variants(phase_flags);
CREATE INDEX IF NOT EXISTS idx_variant_parameters_variant_id ON variant_parameters(variant_id);

-- VIEW: スキル+サポカ+効果パラメータの結合ビュー
CREATE VIEW IF NOT EXISTS skill_full_view AS
SELECT
  s.id,
  s.name,
  s.type,
  s.sub_type,
  s.base_skill_name,
  s.sp_cost,
  s.sp_total,
  s.description,
  s.evaluation_point,
  s.popularity,
  s.trigger_type,
  s.condition_raw,
  s.condition_description,
  sc.id AS support_card_id,
  sc.costume_name,
  sc.character_name,
  sc.full_name AS support_card_full_name,
  GROUP_CONCAT(DISTINCT ep.parameter_key || ':' || ep.parameter_value) AS effect_params
FROM skills s
LEFT JOIN support_cards sc ON s.support_card_id = sc.id
LEFT JOIN effect_parameters ep ON s.id = ep.skill_id
GROUP BY s.id;

-- VIEW: 条件式での検索用ビュー
CREATE VIEW IF NOT EXISTS condition_search_view AS
SELECT
  s.id AS skill_id,
  s.name AS skill_name,
  s.type AS skill_type,
  s.sub_type AS skill_sub_type,
  s.description,
  sc.group_index,
  sc.condition_index,
  sc.variable,
  sc.operator,
  sc.value
FROM skills s
JOIN skill_conditions sc ON s.id = sc.skill_id;

-- VIEW: サポカごとのスキル一覧
CREATE VIEW IF NOT EXISTS support_card_skills_view AS
SELECT
  sc.id AS support_card_id,
  sc.costume_name,
  sc.character_name,
  sc.full_name,
  s.id AS skill_id,
  s.name AS skill_name,
  s.type AS skill_type,
  s.sub_type AS skill_sub_type,
  s.evaluation_point,
  s.description
FROM support_cards sc
JOIN skills s ON sc.id = s.support_card_id;

-- VIEW: 効果バリアント一覧（USM-003）
CREATE VIEW IF NOT EXISTS skill_variants_view AS
SELECT
  s.id AS skill_id,
  s.name AS skill_name,
  s.type AS skill_type,
  s.sub_type AS skill_sub_type,
  s.evaluation_point,
  sc.full_name AS support_card_full_name,
  sev.id AS variant_id,
  sev.variant_index,
  sev.effect_order,
  sev.is_demerit,
  sev.trigger_condition_raw,
  sev.activation_condition_raw,
  sev.activation_condition_description,
  GROUP_CONCAT(vp.parameter_key || ':' || vp.parameter_value) AS effect_params
FROM skills s
LEFT JOIN support_cards sc ON s.support_card_id = sc.id
JOIN skill_effect_variants sev ON s.id = sev.skill_id
LEFT JOIN variant_parameters vp ON sev.id = vp.variant_id
GROUP BY sev.id;
