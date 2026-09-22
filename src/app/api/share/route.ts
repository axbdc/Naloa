import { NextRequest, NextResponse } from "next/server";
import { createShare, listShares } from "@/lib/shares";

export async function GET() {
  const shares = await listShares();
  return NextResponse.json({ shares });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const kind = body?.kind;
  if (kind !== "event" && kind !== "calendar") {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }
  const leadId = kind === "event" ? body?.leadId : null;
  if (kind === "event" && typeof leadId !== "string") {
    return NextResponse.json({ error: "missing_lead_id" }, { status: 400 });
  }
  const label = typeof body?.label === "string" ? body.label : undefined;

  const share = await createShare(kind, leadId ?? null, label);
  const url = new URL(`/partilha/${share.token}`, req.url).toString();
  return NextResponse.json({ share, url });
}
