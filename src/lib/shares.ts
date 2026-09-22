import { nanoid } from "nanoid";
import { getDb, getLeadById, getLeadsWithDates, type Lead } from "./db";

export interface Share {
  token: string;
  kind: "event" | "calendar";
  lead_id: string | null;
  label: string | null;
  created_at: string;
  expires_at: string | null;
  revoked: boolean;
}

function sharesCol() {
  return getDb().collection("shares");
}

function normalizeShareDoc(token: string, data: FirebaseFirestore.DocumentData): Share {
  return {
    token,
    kind: data.kind,
    lead_id: data.lead_id ?? null,
    label: data.label ?? null,
    created_at: data.created_at ?? new Date(0).toISOString(),
    expires_at: data.expires_at ?? null,
    revoked: data.revoked ?? false,
  };
}

export async function createShare(
  kind: "event" | "calendar",
  leadId: string | null,
  label?: string
): Promise<Share> {
  const token = nanoid(12);
  const data = {
    kind,
    lead_id: leadId,
    label: label ?? null,
    created_at: new Date().toISOString(),
    expires_at: null,
    revoked: false,
  };
  await sharesCol().doc(token).set(data);
  return { token, ...data };
}

// A coleção de partilhas é pequena (algumas dezenas no máximo) — filtramos e
// ordenamos em JS para evitar precisar de um índice composto no Firestore.
export async function listShares(): Promise<Share[]> {
  const snap = await sharesCol().get();
  return snap.docs
    .map((d) => normalizeShareDoc(d.id, d.data()))
    .filter((s) => !s.revoked)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
}

export async function revokeShare(token: string): Promise<void> {
  await sharesCol().doc(token).set({ revoked: true }, { merge: true });
}

export async function resolveShare(
  token: string
): Promise<{ share: Share; lead: Lead | null; allLeads: Lead[] | null } | null> {
  const doc = await sharesCol().doc(token).get();
  if (!doc.exists) return null;
  const share = normalizeShareDoc(doc.id, doc.data()!);
  if (share.revoked) return null;
  if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) return null;

  if (share.kind === "event" && share.lead_id) {
    const lead = await getLeadById(share.lead_id);
    return { share, lead, allLeads: null };
  }

  if (share.kind === "calendar") {
    const leads = await getLeadsWithDates();
    return { share, lead: null, allLeads: leads };
  }

  return null;
}