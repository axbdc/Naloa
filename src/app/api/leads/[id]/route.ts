import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const EDITABLE_FIELDS = ["status", "redes_sociais", "site", "contacto", "notas"] as const;
type EditableField = (typeof EDITABLE_FIELDS)[number];

const STATUS_VALUES = new Set(["todo", "contactado", "fechado"]);

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const updates: Partial<Record<EditableField, string>> = {};
  for (const field of EDITABLE_FIELDS) {
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

  const rows = await sql`
    UPDATE leads SET
      status = COALESCE(${updates.status ?? null}, status),
      redes_sociais = CASE WHEN ${"redes_sociais" in updates} THEN ${updates.redes_sociais ?? null} ELSE redes_sociais END,
      site = CASE WHEN ${"site" in updates} THEN ${updates.site ?? null} ELSE site END,
      contacto = CASE WHEN ${"contacto" in updates} THEN ${updates.contacto ?? null} ELSE contacto END,
      notas = CASE WHEN ${"notas" in updates} THEN ${updates.notas ?? null} ELSE notas END,
      updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ lead: rows[0] });
}
