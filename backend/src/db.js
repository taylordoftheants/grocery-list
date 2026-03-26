import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/grocery.db');

mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

const SCHEMA_VERSION = 15;
const { user_version } = db.prepare('PRAGMA user_version').get();

if (user_version < 1) {
  // Fresh install — wipe any stale pre-auth schema
  db.exec('DROP TABLE IF EXISTS items');
  db.exec('DROP TABLE IF EXISTS lists');
  db.exec('DROP TABLE IF EXISTS users');
}
// v1 → v2: only add new tables, no destructive changes
// v2 → v3: add category and sort_order to recipes
if (user_version === 2) {
  db.exec("ALTER TABLE recipes ADD COLUMN category TEXT NOT NULL DEFAULT 'Core Meals'");
  db.exec('ALTER TABLE recipes ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0');
}
// v3 → v4: add is_weekly flag to meal_plan_entries
if (user_version === 3) {
  db.exec('ALTER TABLE meal_plan_entries ADD COLUMN is_weekly INTEGER NOT NULL DEFAULT 0');
}
// v4 → v5: add is_optional to recipe_ingredients; add selected_optional_ids to meal_plan_entries
if (user_version === 4) {
  db.exec('ALTER TABLE recipe_ingredients ADD COLUMN is_optional INTEGER NOT NULL DEFAULT 0');
  db.exec("ALTER TABLE meal_plan_entries ADD COLUMN selected_optional_ids TEXT NOT NULL DEFAULT ''");
}
// v5 → v6: add optional_category to recipe_ingredients; migrate Protein Options recipes to Core Meals
if (user_version === 5) {
  db.exec("ALTER TABLE recipe_ingredients ADD COLUMN optional_category TEXT NOT NULL DEFAULT ''");
  db.exec("UPDATE recipe_ingredients SET optional_category = 'sides' WHERE is_optional = 1");
  db.exec("UPDATE recipes SET category = 'Core Meals' WHERE category = 'Protein Options'");
}
// v6 → v7: add source_recipe to items
if (user_version === 6) {
  db.exec('ALTER TABLE items ADD COLUMN source_recipe TEXT');
}
// v7 → v8: add amount to items
if (user_version === 7) {
  db.exec("ALTER TABLE items ADD COLUMN amount TEXT NOT NULL DEFAULT ''");
}
// v8 → v9: add is_spice to items
if (user_version === 8) {
  db.exec('ALTER TABLE items ADD COLUMN is_spice INTEGER NOT NULL DEFAULT 0');
}
// v9 → v10: add last_login and is_admin to users; grant admin to first user
if (user_version === 9) {
  db.exec('ALTER TABLE users ADD COLUMN last_login TEXT');
  db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0');
  db.exec('UPDATE users SET is_admin = 1 WHERE id = (SELECT MIN(id) FROM users)');
}
// v10 → v11: add is_leftovers to meal_plan_entries
if (user_version === 10) {
  db.exec('ALTER TABLE meal_plan_entries ADD COLUMN is_leftovers INTEGER NOT NULL DEFAULT 0');
}
// v11 → v12: add kroger_tokens table (new table only, no ALTER TABLE needed)
// v12 → v13: add kroger_product_selections table (new table only, no ALTER TABLE needed)
// v13 → v14: add sort_order to lists
if (user_version === 13) {
  db.exec('ALTER TABLE lists ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0');
  db.exec('UPDATE lists SET sort_order = id');
}
// v14 → v15: add location_name to kroger_tokens
if (user_version === 14) {
  db.exec('ALTER TABLE kroger_tokens ADD COLUMN location_name TEXT');
}

if (user_version < SCHEMA_VERSION) {
  db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS lists (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, name)
  );

  CREATE TABLE IF NOT EXISTS items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id    INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    amount     TEXT NOT NULL DEFAULT '',
    purchased  INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS recipes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    category   TEXT NOT NULL DEFAULT 'Core Meals',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id         INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    amount            TEXT NOT NULL DEFAULT '',
    is_optional       INTEGER NOT NULL DEFAULT 0,
    optional_category TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS meal_plan_entries (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id               INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date                  TEXT NOT NULL,
    recipe_id             INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
    label                 TEXT NOT NULL,
    sort_order            INTEGER NOT NULL DEFAULT 0,
    is_weekly             INTEGER NOT NULL DEFAULT 0,
    selected_optional_ids TEXT NOT NULL DEFAULT '',
    is_leftovers          INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS kroger_tokens (
    user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    access_token  TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at    TEXT NOT NULL,
    location_id   TEXT NOT NULL,
    location_name TEXT,
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS kroger_product_selections (
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_name   TEXT NOT NULL,
    upc         TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    brand       TEXT NOT NULL DEFAULT '',
    size        TEXT NOT NULL DEFAULT '',
    selected_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, item_name)
  );
`);

export default db;
