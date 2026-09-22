import { sql, LEAD_COLUMNS, type Lead } from "@/lib/db";
import { listShares } from "@/lib/shares";
import CalendarClient from "./calendar-client";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const leads = await sql<Lead[]>`
    SELECT ${LEAD_COLUMNS} FROM leads WHERE start_date IS NOT NULL ORDER BY start_date ASC
  `;
  const shares = await listShares();

  return <CalendarClient leads={leads} shares={shares} />;
}
