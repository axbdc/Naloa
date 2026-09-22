import { NextRequest, NextResponse } from "next/server";
import { duplicateLead } from "@/lib/db";
import { formatDateRangeShort } from "@/lib/dates";

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const start_date = str(body?.start_date);
  if (!start_date) {
    return NextResponse.json({ error: "start_date_required" }, { status: 400 });
  }
  const end_date = str(body?.end_date);
  const date_label = formatDateRangeShort(start_date, end_date);

  const lead = await duplicateLead(id, start_date, end_date, date_label);
  if (!lead) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ lead });
}
