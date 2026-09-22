import { NextRequest, NextResponse } from "next/server";
import { updateLead, EDITABLE_LEAD_FIELDS, type EditableLeadField } from "@/lib/db";

const STATUS_VALUES = new Set(["todo", "contactado", "fechado"]);

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const updates: Partial<Record<EditableLeadField, string>> = {};
  for (const field of EDITABLE_LEAD_FIELDS) {
    if (field in body) {
      const value = body[field];
      if (typeof value !== "string") {
        return NextResponse.json({ error: `${field}_must_be_string` }, { status: 400 });
      }
      if (field === "status" && !STATUS_VALUES.has(value)) {
        return NextResponse.json({ error: "invalid_status" }, { status: 400 });
      }
      updates[field] = value;
    }
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
