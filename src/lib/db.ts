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

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export interface NewLeadInput {
  name: string;
  section?: string;
  date_label?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  sub?: string | null;
  local?: string | null;
  angle?: string | null;
  link?: string | null;
}

export async function createLead(input: NewLeadInput): Promise<Lead> {
  const base = slugify(input.name) || "evento";
  const id = `manual-${base}-${Math.random().toString(36).slice(2, 7)}`;
  const rows = await sql<Lead[]>`
    INSERT INTO leads (
      id, section, sort_order, date_label, start_date, end_date, name, sub, local, angle, link
    ) VALUES (
      ${id}, ${input.section ?? "manual"}, ${Math.floor(Date.now() / 1000)}, ${input.date_label ?? null},
      ${input.start_date ?? null}, ${input.end_date ?? null}, ${input.name},
      ${input.sub ?? null}, ${input.local ?? null}, ${input.angle ?? null}, ${input.link ?? null}
    )
    RETURNING ${LEAD_COLUMNS}
  `;
  return rows[0];
}
