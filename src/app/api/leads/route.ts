import { NextRequest, NextResponse } from "next/server";
import { createLead } from "@/lib/db";
import { formatDateRangeShort } from "@/lib/dates";

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = str(body?.name);
  if (!name) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  const start_date = str(body?.start_date);
  const end_date = str(body?.end_date);
  const local = str(body?.local);
  const angle = str(body?.angle);
  const link = str(body?.link);

  const date_label = start_date ? formatDateRangeShort(start_date, end_date) : null;

  const lead = await createLead({
    name,
    section: "manual",
    start_date,
    end_date,
    date_label,
    local,
    angle,
    link,
  });

  return NextResponse.json({ lead });
}
