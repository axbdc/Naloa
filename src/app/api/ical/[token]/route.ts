import { NextRequest, NextResponse } from "next/server";
import { resolveShare } from "@/lib/shares";
import { buildIcs } from "@/lib/ical";

export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const resolved = await resolveShare(token);
  if (!resolved) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const leads = resolved.allLeads ?? (resolved.lead ? [resolved.lead] : []);
  const calendarName = resolved.share.label || "Naloa · Calendário";
  const ics = buildIcs(leads, calendarName, req.url);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="naloa-calendario.ics"',
      "Cache-Control": "no-store",
    },
  });
}
