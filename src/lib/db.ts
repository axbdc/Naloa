import postgres from "postgres";

declare global {
  var __naloaSql: ReturnType<typeof postgres> | undefined;
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL (ou POSTGRES_URL) não está definida. Configura a ligação à base de dados."
  );
}

// Reutiliza a ligação entre hot-reloads em dev e entre invocações serverless quando possível.
export const sql =
  global.__naloaSql ??
  postgres(connectionString, {
    ssl: connectionString.includes("localhost") ? false : "require",
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  global.__naloaSql = sql;
}

export type LeadStatus = "todo" | "contactado" | "fechado";

export interface Lead {
  id: string;
  section: string;
  sort_order: number;
  date_label: string | null;
  start_date: string | null;
  end_date: string | null;
  name: string;
  sub: string | null;
  local: string | null;
  angle: string | null;
  link: string | null;
  redes_sociais: string | null;
  site: string | null;
  contacto: string | null;
  notas: string | null;
  status: LeadStatus;
  updated_at: string;
}

// Nota: castamos start_date/end_date para texto porque o driver "postgres" devolve
// colunas DATE como objetos Date por omissão — queremos sempre strings "YYYY-MM-DD".
export const LEAD_COLUMNS = sql`
  id, section, sort_order, date_label, start_date::text, end_date::text,
  name, sub, local, angle, link, redes_sociais, site, contacto, notas, status, updated_at
`;

export async function getAllLeads(): Promise<Lead[]> {
  const rows = await sql<Lead[]>`
    SELECT ${LEAD_COLUMNS} FROM leads ORDER BY sort_order ASC
  `;
  return rows;
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const rows = await sql<Lead[]>`SELECT ${LEAD_COLUMNS} FROM leads WHERE id = ${id} LIMIT 1`;
  return rows[0] ?? null;
}
