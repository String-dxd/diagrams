-- Run once against your NeonDB database to set up the schema.

CREATE TABLE IF NOT EXISTS users (
  uuid       TEXT PRIMARY KEY,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id         SERIAL PRIMARY KEY,
  user_uuid  TEXT NOT NULL REFERENCES users(uuid),
  tool       TEXT NOT NULL, -- 'circuit-symbol' | 'circuit-object' | 'circuit-secjc' | 'water-tank' | 'isometric-cube' | 'seed-dispersal'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_tool_created ON events(tool, created_at);
CREATE INDEX IF NOT EXISTS events_user_tool    ON events(user_uuid, tool, created_at);
