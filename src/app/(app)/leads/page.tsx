import { getAllLeads } from "@/lib/db";
import { sections } from "@/lib/sections";
import LeadsPageClient from "./leads-page-client";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await getAllLeads();
  return <LeadsPageClient sections={sections} leads={leads} />;
}
