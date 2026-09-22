-- Esquema do Radar de Prospeção Naloa

CREATE TABLE IF NOT EXISTS leads (
  id            TEXT PRIMARY KEY,
  section       TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  date_label    TEXT,
  start_date    DATE,
  end_date      DATE,
  name          TEXT NOT NULL,
  sub           TEXT,
  local         TEXT,
  angle         TEXT,
  link          TEXT,
  redes_sociais TEXT,
  site          TEXT,
  contacto      TEXT,
  notas         TEXT,
  status        TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'contactado', 'fechado')),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_section_idx ON leads (section, sort_order);
CREATE INDEX IF NOT EXISTS leads_start_date_idx ON leads (start_date);

CREATE TABLE IF NOT EXISTS shares (
  token       TEXT PRIMARY KEY,
  kind        TEXT NOT NULL CHECK (kind IN ('event', 'calendar')),
  lead_id     TEXT REFERENCES leads(id) ON DELETE CASCADE,
  label       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ,
  revoked     BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS shares_lead_idx ON shares (lead_id);
