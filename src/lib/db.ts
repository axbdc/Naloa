$dbContent = @'
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

declare global {
  var __naloaFirestore: ReturnType<typeof getFirestore> | undefined;
}

function initFirestore() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    // No Firestore Emulator: usamos as credenciais de serviço.
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      throw new Error(
        "FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY não estão definidas. Configura as credenciais do Firebase."
      );
    }
  }

  if (!getApps().length) {
    initializeApp(
      process.env.FIRESTORE_EMULATOR_HOST
        ? { projectId: projectId ?? "naloa-dev" }
        : { credential: cert({ projectId, clientEmail, privateKey }) }
    );
  }

  return getFirestore();
}

// Inicializa o Firestore só quando é mesmo preciso (não ao importar o módulo) —
// o Next.js importa este ficheiro durante o build para inspecionar as rotas, e
// nessa fase ainda não há garantia das credenciais estarem disponíveis.
// Reutiliza a ligação entre hot-reloads em dev e entre invocações serverless.
let firestoreInstance: ReturnType<typeof getFirestore> | undefined;

export function getDb(): ReturnType<typeof getFirestore> {
  if (process.env.NODE_ENV !== "production" && global.__naloaFirestore) {
    return global.__naloaFirestore;
  }
  if (!firestoreInstance) {
    firestoreInstance = initFirestore();
    if (process.env.NODE_ENV !== "production") {
      global.__naloaFirestore = firestoreInstance;
    }
  }
  return firestoreInstance;
}

function leadsCol() {
  return getDb().collection("leads");
}

export type LeadStatus = "todo" | "contactado" | "fechado";
export type ServiceType = "fotografia" | "video" | "ambos" | "drone" | "outro";
export type PaymentStatus = "pendente" | "pago";

export interface EquipmentItem {
  item: string;
  checked: boolean;
}

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
  // Ficha de evento (funcionalidades de gestão de cobertura)
  start_time: string | null;
  end_time: string | null;
  service_type: ServiceType | null;
  team: string | null;
  equipment: EquipmentItem[];
  budget: number | null;
  payment_status: PaymentStatus | null;
}

// Campos opcionais com omissão explícita -> null, para o documento ficar sempre
// com as mesmas chaves (facilita ler/editar no Firebase Console).
function normalizeLeadDoc(id: string, data: FirebaseFirestore.DocumentData): Lead {
  return {
    id,
    section: data.section,
    sort_order: data.sort_order ?? 0,
    date_label: data.date_label ?? null,
    start_date: data.start_date ?? null,
    end_date: data.end_date ?? null,
    name: data.name,
    sub: data.sub ?? null,
    local: data.local ?? null,
    angle: data.angle ?? null,
    link: data.link ?? null,
    redes_sociais: data.redes_sociais ?? null,
    site: data.site ?? null,
    contacto: data.contacto ?? null,
    notas: data.notas ?? null,
    status: (data.status ?? "todo") as LeadStatus,
    updated_at: data.updated_at ?? new Date(0).toISOString(),
    start_time: data.start_time ?? null,
    end_time: data.end_time ?? null,
    service_type: data.service_type ?? null,
    team: data.team ?? null,
    equipment: Array.isArray(data.equipment) ? data.equipment : [],
    budget: typeof data.budget === "number" ? data.budget : null,
    payment_status: data.payment_status ?? null,
  };
}

export async function getAllLeads(): Promise<Lead[]> {
  const snap = await leadsCol().orderBy("sort_order", "asc").get();
  return snap.docs.map((d) => normalizeLeadDoc(d.id, d.data()));
}

// Equivalente a "WHERE start_date IS NOT NULL ORDER BY start_date ASC".
// Filtramos/ordenamos em JS em vez de usar uma query composta do Firestore
// (evita ter de criar um índice composto manualmente) — a coleção é pequena.
export async function getLeadsWithDates(): Promise<Lead[]> {
  const all = await getAllLeads();
  return all
    .filter((l) => l.start_date)
    .sort((a, b) => (a.start_date! < b.start_date! ? -1 : a.start_date! > b.start_date! ? 1 : 0));
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const doc = await leadsCol().doc(id).get();
  if (!doc.exists) return null;
  return normalizeLeadDoc(doc.id, doc.data()!);
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
  start_time?: string | null;
  end_time?: string | null;
  service_type?: ServiceType | null;
  team?: string | null;
  equipment?: EquipmentItem[];
  budget?: number | null;
  payment_status?: PaymentStatus | null;
}

export async function createLead(input: NewLeadInput): Promise<Lead> {
  const base = slugify(input.name) || "evento";
  const id = `manual-${base}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const data = {
    section: input.section ?? "manual",
    sort_order: Math.floor(Date.now() / 1000),
    date_label: input.date_label ?? null,
    start_date: input.start_date ?? null,
    end_date: input.end_date ?? null,
    name: input.name,
    sub: input.sub ?? null,
    local: input.local ?? null,
    angle: input.angle ?? null,
    link: input.link ?? null,
    redes_sociais: null,
    site: null,
    contacto: null,
    notas: null,
    status: "todo" as LeadStatus,
    updated_at: now,
    start_time: input.start_time ?? null,
    end_time: input.end_time ?? null,
    service_type: input.service_type ?? null,
    team: input.team ?? null,
    equipment: input.equipment ?? [],
    budget: input.budget ?? null,
    payment_status: input.payment_status ?? null,
  };
  await leadsCol().doc(id).set(data);
  return { id, ...data };
}

export const EDITABLE_LEAD_FIELDS = [
  "status",
  "redes_sociais",
  "site",
  "contacto",
  "notas",
  "start_time",
  "end_time",
  "service_type",
  "team",
] as const;
export type EditableLeadField = (typeof EDITABLE_LEAD_FIELDS)[number];

export interface LeadUpdateInput {
  status?: LeadStatus;
  redes_sociais?: string | null;
  site?: string | null;
  contacto?: string | null;
  notas?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  service_type?: ServiceType | null;
  team?: string | null;
  equipment?: EquipmentItem[];
  budget?: number | null;
  payment_status?: PaymentStatus | null;
}

export async function updateLead(id: string, updates: LeadUpdateInput): Promise<Lead | null> {
  const ref = leadsCol().doc(id);
  const doc = await ref.get();
  if (!doc.exists) return null;

  await ref.update({
    ...updates,
    updated_at: new Date().toISOString(),
  });

  const updated = await ref.get();
  return normalizeLeadDoc(updated.id, updated.data()!);
}

export async function duplicateLead(
  id: string,
  newStartDate: string,
  newEndDate: string | null,
  dateLabel: string | null
): Promise<Lead | null> {
  const source = await getLeadById(id);
  if (!source) return null;
  return createLead({
    name: source.name,
    section: source.section === "manual" ? "manual" : source.section,
    start_date: newStartDate,
    end_date: newEndDate,
    date_label: dateLabel,
    sub: source.sub,
    local: source.local,
    angle: source.angle,
    link: source.link,
    start_time: source.start_time,
    end_time: source.end_time,
    service_type: source.service_type,
    team: source.team,
    equipment: source.equipment.map((e) => ({ item: e.item, checked: false })),
    budget: source.budget,
    payment_status: null,
  });
}
'@
[System.IO.File]::WriteAllText("$PWD\src\lib\db.ts", $dbContent, [System.Text.UTF8Encoding]::new($false))

$sharesContent = @'
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
'@
[System.IO.File]::WriteAllText("$PWD\src\lib\shares.ts", $sharesContent, [System.Text.UTF8Encoding]::new($false))

Write-Host "Ficheiros escritos com sucesso."