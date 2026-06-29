-- World Cup 2026 Prediction Simulator - SQLite schema
-- Full DDL. Run with better-sqlite3 to initialise data/mundial.db.
-- Recommended pragmas when opening the connection (not part of DDL):
--   PRAGMA journal_mode = WAL;
--   PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- teams
-- attack_strength / defense_strength / home_advantage are the Poisson model
-- coefficients used to derive lambda. Centred at ~1.0.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
  id                  INTEGER PRIMARY KEY,
  name                TEXT    NOT NULL,
  "group"             TEXT    NOT NULL,
  fifa_ranking        INTEGER,
  attack_strength     REAL    NOT NULL DEFAULT 1.0,
  defense_strength    REAL    NOT NULL DEFAULT 1.0,
  home_advantage      REAL    NOT NULL DEFAULT 1.0,
  recent_form         REAL,
  avg_goals_scored    REAL,
  avg_goals_conceded  REAL
);

CREATE INDEX IF NOT EXISTS idx_teams_group ON teams ("group");

-- ---------------------------------------------------------------------------
-- players
-- goals_per_minute stored to avoid division by zero in the top-scorer model.
-- NULL when minutes_played = 0 (no sample).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS players (
  id               INTEGER PRIMARY KEY,
  team_id          INTEGER NOT NULL,
  name             TEXT    NOT NULL,
  position         TEXT    NOT NULL CHECK (position IN ('GK', 'DF', 'MF', 'FW')),
  goals_scored     INTEGER NOT NULL DEFAULT 0,
  minutes_played   INTEGER NOT NULL DEFAULT 0,
  goals_per_minute REAL,
  FOREIGN KEY (team_id) REFERENCES teams (id)
);

CREATE INDEX IF NOT EXISTS idx_players_team_id ON players (team_id);

-- ---------------------------------------------------------------------------
-- fixtures
-- home_goals / away_goals are NULL until the match finishes.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fixtures (
  id            INTEGER PRIMARY KEY,
  home_team_id  INTEGER NOT NULL,
  away_team_id  INTEGER NOT NULL,
  kickoff_utc   TEXT    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled', 'live', 'finished')),
  home_goals    INTEGER,
  away_goals    INTEGER,
  round         TEXT,
  FOREIGN KEY (home_team_id) REFERENCES teams (id),
  FOREIGN KEY (away_team_id) REFERENCES teams (id)
);

CREATE INDEX IF NOT EXISTS idx_fixtures_kickoff ON fixtures (kickoff_utc);
CREATE INDEX IF NOT EXISTS idx_fixtures_status ON fixtures (status);
CREATE INDEX IF NOT EXISTS idx_fixtures_home_team ON fixtures (home_team_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_away_team ON fixtures (away_team_id);

-- ---------------------------------------------------------------------------
-- match_stats
-- One row per (fixture_id, team_id): two rows per match.
-- Feeds the corners and cards models.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_stats (
  fixture_id       INTEGER NOT NULL,
  team_id          INTEGER NOT NULL,
  corners          INTEGER,
  yellow_cards     INTEGER,
  red_cards        INTEGER,
  shots_on_target  INTEGER,
  possession       REAL,
  PRIMARY KEY (fixture_id, team_id),
  FOREIGN KEY (fixture_id) REFERENCES fixtures (id),
  FOREIGN KEY (team_id) REFERENCES teams (id)
);

CREATE INDEX IF NOT EXISTS idx_match_stats_team ON match_stats (team_id);

-- ---------------------------------------------------------------------------
-- match_events
-- Event timeline. player_id is NULL when the data arrives without a player.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_events (
  id          INTEGER PRIMARY KEY,
  fixture_id  INTEGER NOT NULL,
  type        TEXT    NOT NULL
                CHECK (type IN ('goal', 'yellow_card', 'red_card', 'substitution')),
  team_id     INTEGER NOT NULL,
  player_id   INTEGER,
  minute      INTEGER NOT NULL,
  FOREIGN KEY (fixture_id) REFERENCES fixtures (id),
  FOREIGN KEY (team_id) REFERENCES teams (id),
  FOREIGN KEY (player_id) REFERENCES players (id)
);

CREATE INDEX IF NOT EXISTS idx_match_events_fixture ON match_events (fixture_id);
CREATE INDEX IF NOT EXISTS idx_match_events_player ON match_events (player_id);

-- ---------------------------------------------------------------------------
-- predictions
-- One ModelOutput per (fixture_id, market). probabilities serialised as JSON
-- in TEXT. History is preserved: each run inserts a new row
-- (computed_at distinguishes versions); no UPDATE in-place.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  fixture_id     INTEGER,
  market         TEXT    NOT NULL,
  probabilities  TEXT    NOT NULL,
  confidence     TEXT    NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  model_version  TEXT    NOT NULL,
  computed_at    TEXT    NOT NULL,
  FOREIGN KEY (fixture_id) REFERENCES fixtures (id)
);

-- Most frequent lookup: current prediction for a given fixture and market.
CREATE INDEX IF NOT EXISTS idx_predictions_fixture_market
  ON predictions (fixture_id, market, computed_at DESC);

-- ---------------------------------------------------------------------------
-- run_log
-- Audit log of each agent run (CLI script or Server Action).
-- Insert-at-start pattern: the row is inserted with status = 'running' when
-- the refresh starts and updated to 'ok' / 'error' when it finishes. A run
-- that dies mid-way leaves a trace (stays as orphaned 'running').
-- finished_at / duration_ms are NULL while status = 'running'.
-- message: NULL when status IN ('ok', 'running'); exception text when 'error'.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS run_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_name   TEXT    NOT NULL CHECK (agent_name IN ('cli_refresh', 'server_action')),
  started_at   TEXT    NOT NULL,
  finished_at  TEXT,
  duration_ms  INTEGER,
  status       TEXT    NOT NULL CHECK (status IN ('ok', 'error', 'running')),
  message      TEXT
);

-- Freshness guard queries the last successful run by time.
CREATE INDEX IF NOT EXISTS idx_run_log_started ON run_log (started_at DESC);

-- ---------------------------------------------------------------------------
-- users
-- Simple authentication table. password_hash is bcrypt(password, salt=10).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  created_at    TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
