import { NextRequest, NextResponse } from "next/server";
import { updateLead, type LeadUpdateInput, type EquipmentItem } from "@/lib/db";

const STATUS_VALUES = new Set(["todo", "contactado", "fechado"]);
const SERVICE_TYPE_VALUES = new Set(["fotografia", "video", "ambos", "drone", "outro"]);
const PAYMENT_STATUS_VALUES = new Set(["pendente", "pago"]);

const STRING_FIELDS = [
  "redes_sociais",
  "site",
  "contacto",
  "notas",
  "start_time",
  "end_time",
  "team",
] as const;

function isEquipmentArray(value: unknown): value is EquipmentItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as EquipmentItem).item === "string" &&
        typeof (item as EquipmentItem).checked === "boolean"
    )
  );
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const updates: LeadUpdateInput = {};

  if ("status" in body) {
    if (typeof body.status !== "string" || !STATUS_VALUES.has(body.status)) {
      return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    }
    updates.status = body.status;
  }

  for (const field of STRING_FIELDS) {
    if (field in body) {
      const value = body[field];
      if (value !== null && typeof value !== "string") {
        return NextResponse.json({ error: `${field}_must_be_string_or_null` }, { status: 400 });
      }
      updates[field] = value === "" ? null : value;
    }
  }

  if ("service_type" in body) {
    const value = body.service_type;
    if (value !== null && (typeof value !== "string" || !SERVICE_TYPE_VALUES.has(value))) {
      return NextResponse.json({ error: "invalid_service_type" }, { status: 400 });
    }
    updates.service_type = value;
  }

  if ("payment_status" in body) {
    const value = body.payment_status;
    if (value !== null && (typeof value !== "string" || !PAYMENT_STATUS_VALUES.has(value))) {
      return NextResponse.json({ error: "invalid_payment_status" }, { status: 400 });
    }
    updates.payment_status = value;
  }

  if ("budget" in body) {
    const value = body.budget;
    if (value !== null && (typeof value !== "number" || Number.isNaN(value) || value < 0)) {
      return NextResponse.json({ error: "invalid_budget" }, { status: 400 });
    }
    updates.budget = value;
  }

  if ("equipment" in body) {
    if (!isEquipmentArray(body.equipment)) {
      return NextResponse.json({ error: "invalid_equipment" }, { status: 400 });
    }
    updates.equipment = body.equipment;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no_fields" }, { status: 400 });
  }

  const lead = await updateLead(id, updates);
  if (!lead) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ lead });
}
