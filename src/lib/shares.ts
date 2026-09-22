import { nanoid } from "nanoid";
import { sql, LEAD_COLUMNS, type Lead } from "./db";

export interface Share {
  token: string;
  kind: "event" | "calendar";
  lead_id: string | null;
  label: string | null;
  created_at: string;
  expires_at: string | null;
  revoked: boolean;
}

export async function createShare(kind: "event" | "calendar", leadId: string | null, label?: string): Promise<Share> {
  const token = nanoid(12);
  const rows = await sql<Share[]>`
    INSERT INTO shares (token, kind, lead_id, label)
    VALUES (${token}, ${kind}, ${leadId}, ${label ?? null})
    RETURNING *
  `;
  return rows[0];
}

export async function listShares(): Promise<Share[]> {
  return sql<Share[]>`SELECT * FROM shares WHERE revoked = false ORDER BY created_at DESC`;
}

export async function revokeShare(token: string): Promise<void> {
  await sql`UPDATE shares SET revoked = true WHERE token = ${token}`;
}

export async function resolveShare(
  token: string
): Promise<{ share: Share; lead: Lead | null; allLeads: Lead[] | null } | null> {
  const rows = await sql<Share[]>`SELECT * FROM shares WHERE token = ${token} AND revoked = false LIMIT 1`;
  const share = rows[0];
  if (!share) return null;
  if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) return null;

  if (share.kind === "event" && share.lead_id) {
    const leadRows = await sql<Lead[]>`SELECT ${LEAD_COLUMNS} FROM leads WHERE id = ${share.lead_id} LIMIT 1`;
    return { share, lead: leadRows[0] ?? null, allLeads: null };
  }

  if (share.kind === "calendar") {
    const leads = await sql<Lead[]>`
      SELECT ${LEAD_COLUMNS} FROM leads WHERE start_date IS NOT NULL ORDER BY start_date ASC
    `;
    return { share, lead: null, allLeads: leads };
  }

  return null;
}
