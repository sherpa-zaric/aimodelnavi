import { Pool, type QueryResult } from "pg";

const globalForPool = globalThis as unknown as { pgPool: Pool };

export const pool =
  globalForPool.pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPool.pgPool = pool;
}

export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function initializeDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS comments (
      id         SERIAL PRIMARY KEY,
      slug       VARCHAR(255) NOT NULL,
      name       VARCHAR(100) NOT NULL,
      content    TEXT NOT NULL,
      parent_id  INTEGER REFERENCES comments(id),
      status     VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      ip_hash    VARCHAR(64)
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(slug, status)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id)`);

  await query(`
    CREATE TABLE IF NOT EXISTS likes (
      id         SERIAL PRIMARY KEY,
      slug       VARCHAR(255) NOT NULL,
      target     VARCHAR(20) DEFAULT 'post',
      target_id  INTEGER,
      ip_hash    VARCHAR(64),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(slug, target, target_id, ip_hash)
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_likes_slug ON likes(slug, target)`);

  await query(`
    CREATE TABLE IF NOT EXISTS ads (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(200) NOT NULL,
      position   VARCHAR(50) NOT NULL,
      ad_code    TEXT NOT NULL,
      width      INTEGER,
      height     INTEGER,
      enabled    BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_ads_position ON ads(position, enabled)`);
}

export function hashIp(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "127.0.0.1";
}
