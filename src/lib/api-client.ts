// Pequenos helpers para chamar a API a partir de componentes client.
import type { Lead } from "./db";

export async function patchLead(id: string, body: Record<string, unknown>): Promise<Lead> {
  const res = await fetch(`/api/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("save_failed");
  const data = await res.json();
  return data.lead as Lead;
}

export async function duplicateLeadRequest(
  id: string,
  startDate: string,
  endDate: string | null
): Promise<Lead> {
  const res = await fetch(`/api/leads/${id}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ start_date: startDate, end_date: endDate }),
  });
  if (!res.ok) throw new Error("duplicate_failed");
  const data = await res.json();
  return data.lead as Lead;
}
