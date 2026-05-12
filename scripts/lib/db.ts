/**
 * SQLite database layer for the crawler pipeline.
 * Provides connection management, schema migration, and CRUD helpers.
 *
 * Database file: data/crawler.db (committed to git)
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "crawler.db");

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  dbInstance = new Database(DB_PATH);
  dbInstance.pragma("journal_mode = WAL");
  dbInstance.pragma("foreign_keys = ON");
  return dbInstance;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function migrate(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS data_sources (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL UNIQUE,
      base_url    TEXT,
      enabled     INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS raw_crawl_log (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id     INTEGER NOT NULL REFERENCES data_sources(id),
      url           TEXT    NOT NULL,
      crawl_type    TEXT    NOT NULL DEFAULT 'incremental',
      http_status   INTEGER,
      content_hash  TEXT,
      error_message TEXT,
      started_at    TEXT    NOT NULL,
      completed_at  TEXT,
      success       INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_crawl_log_source ON raw_crawl_log(source_id);

    CREATE TABLE IF NOT EXISTS raw_models (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id     INTEGER NOT NULL REFERENCES data_sources(id),
      external_id   TEXT    NOT NULL,
      source_url    TEXT,
      raw_data      TEXT    NOT NULL,
      content_hash  TEXT    NOT NULL,
      first_seen_at TEXT    NOT NULL DEFAULT (datetime('now')),
      last_seen_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      is_active     INTEGER NOT NULL DEFAULT 1,
      UNIQUE(source_id, external_id)
    );
    CREATE INDEX IF NOT EXISTS idx_raw_models_source ON raw_models(source_id, is_active);

    CREATE TABLE IF NOT EXISTS models (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      slug              TEXT    NOT NULL UNIQUE,
      name              TEXT    NOT NULL,
      alternate_name    TEXT,
      developer         TEXT    NOT NULL,
      developer_url     TEXT,
      developer_logo_url TEXT,
      params            TEXT,
      context_window    TEXT,
      license           TEXT,
      license_status    TEXT    NOT NULL DEFAULT 'closed',
      category          TEXT,
      release_date      TEXT,
      description_zh    TEXT,
      description_ja    TEXT,
      strengths         TEXT,
      weaknesses        TEXT,
      use_cases         TEXT,
      links_json        TEXT,
      hf_model_id       TEXT,
      datalearner_slug  TEXT,
      pricing_json      TEXT,
      is_core           INTEGER NOT NULL DEFAULT 0,
      is_japanese       INTEGER NOT NULL DEFAULT 0,
      priority          INTEGER NOT NULL DEFAULT 0,
      created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS model_translations (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id        INTEGER NOT NULL REFERENCES models(id),
      language        TEXT    NOT NULL,
      field_name      TEXT    NOT NULL,
      translated_text TEXT    NOT NULL,
      is_ai_generated INTEGER NOT NULL DEFAULT 1,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(model_id, language, field_name)
    );

    CREATE TABLE IF NOT EXISTS leaderboard_scores (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id      INTEGER NOT NULL REFERENCES models(id),
      benchmark     TEXT    NOT NULL,
      score         REAL,
      source_url    TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(model_id, benchmark, source_url)
    );

    CREATE TABLE IF NOT EXISTS pricing_entries (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id        INTEGER,
      model_name      TEXT    NOT NULL,
      provider        TEXT    NOT NULL,
      billing_mode    TEXT    NOT NULL DEFAULT 'standard',
      input_price     REAL    NOT NULL,
      output_price    REAL    NOT NULL,
      input_modality  TEXT    NOT NULL DEFAULT 'text',
      output_modality TEXT    NOT NULL DEFAULT 'text',
      currency        TEXT    NOT NULL DEFAULT 'USD',
      notes           TEXT,
      source_url      TEXT,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(model_name, provider, billing_mode)
    );

    CREATE TABLE IF NOT EXISTS model_source_map (
      model_id      INTEGER NOT NULL REFERENCES models(id),
      raw_model_id  INTEGER NOT NULL REFERENCES raw_models(id),
      confidence    TEXT    NOT NULL DEFAULT 'medium',
      PRIMARY KEY (model_id, raw_model_id)
    );
  `);

  // Seed data_sources if empty
  const count = db.prepare("SELECT COUNT(*) as c FROM data_sources").get() as { c: number };
  if (count.c === 0) {
    const insert = db.prepare(
      "INSERT INTO data_sources (name, base_url) VALUES (?, ?)"
    );
    insert.run("datalearner", "https://www.datalearner.com");
    insert.run("huggingface", "https://huggingface.co");
    insert.run("manual", null);
    insert.run("leaderboard", "https://lmarena.ai");
    insert.run("pricing", null);
  }
}

// ── Content hashing ──

export function contentHash(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 16);
}

// ── Source helpers ──

export function getSourceId(name: string): number {
  const db = getDb();
  const row = db.prepare("SELECT id FROM data_sources WHERE name = ?").get(name) as { id: number } | undefined;
  if (!row) throw new Error(`Data source "${name}" not found. Run migrate() first.`);
  return row.id;
}

// ── Crawl log ──

export function startCrawlLog(sourceId: number, url: string, crawlType: string): number {
  const db = getDb();
  const result = db.prepare(
    "INSERT INTO raw_crawl_log (source_id, url, crawl_type, started_at) VALUES (?, ?, ?, datetime('now'))"
  ).run(sourceId, url, crawlType);
  return result.lastInsertRowid as number;
}

export function endCrawlLog(logId: number, httpStatus: number, hash: string | null, error: string | null): void {
  const db = getDb();
  db.prepare(
    `UPDATE raw_crawl_log SET completed_at = datetime('now'), http_status = ?, content_hash = ?, error_message = ?, success = ? WHERE id = ?`
  ).run(httpStatus, hash, error, error ? 0 : 1, logId);
}

// ── Raw models ──

export interface RawModelInput {
  sourceId: number;
  externalId: string;
  sourceUrl: string;
  rawData: Record<string, unknown>;
}

export function upsertRawModel(input: RawModelInput): { changed: boolean; id: number } {
  const db = getDb();
  const jsonStr = JSON.stringify(input.rawData);
  const hash = contentHash(jsonStr);

  const existing = db.prepare(
    "SELECT id, content_hash FROM raw_models WHERE source_id = ? AND external_id = ?"
  ).get(input.sourceId, input.externalId) as { id: number; content_hash: string } | undefined;

  if (existing) {
    if (existing.content_hash === hash) {
      // No change, just update last_seen_at
      db.prepare("UPDATE raw_models SET last_seen_at = datetime('now') WHERE id = ?").run(existing.id);
      return { changed: false, id: existing.id };
    }
    // Content changed
    db.prepare(
      `UPDATE raw_models SET raw_data = ?, content_hash = ?, source_url = ?, last_seen_at = datetime('now') WHERE id = ?`
    ).run(jsonStr, hash, input.sourceUrl, existing.id);
    return { changed: true, id: existing.id };
  }

  // New model
  const result = db.prepare(
    `INSERT INTO raw_models (source_id, external_id, source_url, raw_data, content_hash) VALUES (?, ?, ?, ?, ?)`
  ).run(input.sourceId, input.externalId, input.sourceUrl, jsonStr, hash);
  return { changed: true, id: result.lastInsertRowid as number };
}

export function getExistingExternalIds(sourceId: number): Set<string> {
  const db = getDb();
  const rows = db.prepare(
    "SELECT external_id FROM raw_models WHERE source_id = ? AND is_active = 1"
  ).all(sourceId) as { external_id: string }[];
  return new Set(rows.map((r) => r.external_id));
}

export function getChangedRawModels(sourceId: number, since: string): RawModelInput[] {
  const db = getDb();
  const rows = db.prepare(
    "SELECT id, external_id, source_url, raw_data FROM raw_models WHERE source_id = ? AND last_seen_at > ? AND is_active = 1"
  ).all(sourceId, since) as { id: number; external_id: string; source_url: string; raw_data: string }[];
  return rows.map((r) => ({
    sourceId,
    externalId: r.external_id,
    sourceUrl: r.source_url,
    rawData: JSON.parse(r.raw_data),
  }));
}

// ── Models ──

export interface ModelRecord {
  id: number;
  slug: string;
  name: string;
  alternate_name: string | null;
  developer: string;
  developer_url: string | null;
  developer_logo_url: string | null;
  params: string | null;
  context_window: string | null;
  license: string | null;
  license_status: string;
  category: string | null;
  release_date: string | null;
  description_zh: string | null;
  description_ja: string | null;
  strengths: string | null;
  weaknesses: string | null;
  use_cases: string | null;
  links_json: string | null;
  hf_model_id: string | null;
  datalearner_slug: string | null;
  pricing_json: string | null;
  is_core: number;
  is_japanese: number;
  priority: number;
}

export function getModelsBySlug(slug: string): ModelRecord | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM models WHERE slug = ?").get(slug) as ModelRecord | undefined;
}

export function getAllModelSlugs(): string[] {
  const db = getDb();
  const rows = db.prepare("SELECT slug FROM models ORDER BY priority DESC, release_date DESC").all() as { slug: string }[];
  return rows.map((r) => r.slug);
}

export function getModelsNeedingProcessing(): ModelRecord[] {
  const db = getDb();
  return db.prepare(
    "SELECT * FROM models WHERE description_ja IS NULL AND is_core = 0 ORDER BY release_date DESC"
  ).all() as ModelRecord[];
}

export function upsertModel(model: Partial<ModelRecord> & { slug: string; name: string; developer: string }): number {
  const db = getDb();

  const existing = db.prepare("SELECT id, is_core, priority FROM models WHERE slug = ?").get(model.slug) as { id: number; is_core: number; priority: number } | undefined;

  if (existing) {
    // Don't overwrite core models unless explicitly allowed
    if (existing.is_core && (model.priority ?? 0) < existing.priority) {
      // Only fill in NULL fields for core models
      const fields: string[] = [];
      const values: unknown[] = [];
      for (const [key, value] of Object.entries(model)) {
        if (value !== undefined && value !== null && key !== "id" && key !== "slug" && key !== "is_core" && key !== "priority") {
          // Check if current value is NULL
          const current = db.prepare(`SELECT ${key} FROM models WHERE id = ?`).get(existing.id) as Record<string, unknown>;
          if (!current || current[key] === null || current[key] === undefined) {
            fields.push(`${key} = ?`);
            values.push(value);
          }
        }
      }
      if (fields.length > 0) {
        fields.push("updated_at = datetime('now')");
        db.prepare(`UPDATE models SET ${fields.join(", ")} WHERE id = ?`).run(...values, existing.id);
      }
      return existing.id;
    }

    // Non-core or lower priority: update freely
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, value] of Object.entries(model)) {
      if (value !== undefined && key !== "id" && key !== "slug") {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')");
      db.prepare(`UPDATE models SET ${fields.join(", ")} WHERE id = ?`).run(...values, existing.id);
    }
    return existing.id;
  }

  // Insert new model
  const cols: string[] = [];
  const vals: unknown[] = [];
  const placeholders: string[] = [];
  for (const [key, value] of Object.entries(model)) {
    if (value !== undefined && key !== "id") {
      cols.push(key);
      vals.push(value);
      placeholders.push("?");
    }
  }
  const result = db.prepare(
    `INSERT INTO models (${cols.join(", ")}) VALUES (${placeholders.join(", ")})`
  ).run(...vals);
  return result.lastInsertRowid as number;
}

export function getModelCount(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as c FROM models").get() as { c: number };
  return row.c;
}

export function getRawModelCount(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as c FROM raw_models WHERE is_active = 1").get() as { c: number };
  return row.c;
}