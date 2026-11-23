-- CAMPANIA LIFE — schema iniziale PostgreSQL
-- Eseguito automaticamente all'avvio se le tabelle non esistono.

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY,
    name          VARCHAR(60) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login    TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email_lower ON users (lower(email));

CREATE TABLE IF NOT EXISTS characters (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(40) NOT NULL,
    surname     VARCHAR(40) NOT NULL,
    look        JSONB NOT NULL DEFAULT '{}'::jsonb,
    perk        VARCHAR(30) NOT NULL DEFAULT 'nativo',
    level       INTEGER NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_saves (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    payload     JSONB NOT NULL,
    version     INTEGER NOT NULL DEFAULT 1,
    saved_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind        VARCHAR(40) NOT NULL,
    amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS achievements (
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code         VARCHAR(60) NOT NULL,
    unlocked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, code)
);

CREATE INDEX IF NOT EXISTS idx_saves_saved_at ON game_saves(saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_time ON transactions(user_id, created_at DESC);

-- Vista classifica: legge i valori dal salvataggio JSONB.
CREATE OR REPLACE VIEW v_leaderboard AS
SELECT u.id AS user_id,
       u.name,
       COALESCE((s.payload->>'level')::int, 1) AS level,
       COALESCE((s.payload->>'money')::numeric, 0) AS money,
       COALESCE((s.payload->>'bank')::numeric, 0) AS bank,
       COALESCE((s.payload->'stats'->>'caught')::int, 0) AS creatures_caught,
       s.saved_at
FROM users u
JOIN game_saves s ON s.user_id = u.id;
