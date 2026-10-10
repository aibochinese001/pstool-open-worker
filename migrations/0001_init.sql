-- pstool D1 初始化脚本
-- 用法：
--   npx wrangler d1 create ps-tool-ads
--   npx wrangler d1 execute ps-tool-ads --remote --file=migrations/0001_init.sql

CREATE TABLE IF NOT EXISTS ads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  image_url   TEXT    NOT NULL DEFAULT '',
  link_url    TEXT    NOT NULL DEFAULT '',
  html        TEXT    NOT NULL DEFAULT '',
  enabled     INTEGER NOT NULL DEFAULT 1,
  sort        INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS visits (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  day         TEXT    NOT NULL,
  page        TEXT    NOT NULL,
  uv_hash     TEXT    NOT NULL,
  device      TEXT    NOT NULL DEFAULT '',
  ref_host    TEXT    NOT NULL DEFAULT '',
  country     TEXT    NOT NULL DEFAULT '',
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ads_sort        ON ads(sort);
CREATE INDEX IF NOT EXISTS idx_visits_day      ON visits(day);
CREATE INDEX IF NOT EXISTS idx_visits_day_page ON visits(day, page);
