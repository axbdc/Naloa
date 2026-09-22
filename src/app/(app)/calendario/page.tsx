import { getLeadsWithDates } from "@/lib/db";
import { listShares } from "@/lib/shares";
import CalendarClient from "./calendar-client";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const leads = await getLeadsWithDates();
  const shares = await listShares();

  return <CalendarClient leads={leads} shares={shares} />;
}
