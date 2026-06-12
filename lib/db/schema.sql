-- Mundial 2026 IA Predictor — Schema SQLite
-- DDL completo. Ejecutar con better-sqlite3 al inicializar data/mundial.db.
-- Pragmas recomendados al abrir la conexion (no van en el DDL):
--   PRAGMA journal_mode = WAL;
--   PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- teams
-- attack_strength / defense_strength / home_advantage son los coeficientes
-- que el modelo de Poisson usa para derivar lambda. Centrados en ~1.0.
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
-- goals_per_minute almacenado para evitar divisiones por cero en el modelo
-- de goleadores. NULL cuando minutes_played = 0 (sin muestra).
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
-- home_goals / away_goals NULL hasta que el partido termina.
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
-- Una fila por (fixture_id, team_id): dos filas por partido.
-- Alimenta los modelos de corners y tarjetas.
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
-- Timeline de eventos. player_id NULL si el dato viene sin jugador.
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
-- Un ModelOutput por (fixture_id, market). probabilities serializado como
-- JSON en TEXT. Se conserva historico: cada corrida inserta una fila nueva
-- (computed_at distingue versiones), no se hace UPDATE in-place.
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

-- Lookup mas frecuente: la prediccion vigente de un partido y mercado.
CREATE INDEX IF NOT EXISTS idx_predictions_fixture_market
  ON predictions (fixture_id, market, computed_at DESC);

-- ---------------------------------------------------------------------------
-- run_log
-- Bitacora de cada corrida de un agent (script CLI o Server Action).
-- Patron insertar-al-inicio: la fila se inserta con status = 'running' al
-- arrancar el refresh y se actualiza a 'ok' / 'error' al terminar. Asi una
-- corrida que muere a mitad deja rastro (queda como 'running' huerfana).
-- finished_at / duration_ms son NULL mientras status = 'running'.
-- message: NULL cuando status IN ('ok', 'running'); texto de la excepcion
-- cuando 'error'.
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

-- La guarda de frescura consulta la ultima corrida ok por tiempo.
CREATE INDEX IF NOT EXISTS idx_run_log_started ON run_log (started_at DESC);
