import { notFound } from "next/navigation";
import { resolveShare } from "@/lib/shares";

export const dynamic = "force-dynamic";

function formatRange(startDate: string, endDate: string | null): string {
  const start = new Date(startDate + "T00:00:00");
  const startStr = start.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
  if (!endDate || endDate === startDate) return startStr;
  const end = new Date(endDate + "T00:00:00");
  const endStr = end.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" });
  return `${startStr} – ${endStr}`;
}

export default async function PartilhaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const resolved = await resolveShare(token);
  if (!resolved) notFound();
  const { share, lead, allLeads } = resolved;

  return (
    <div className="min-h-screen bg-[#f4f5f2] text-[#171916] px-4 py-10">
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-baseline gap-2 mb-8">
          <span className="font-semibold tracking-wide">naloa</span>
          <span className="text-xs uppercase tracking-[0.1em] text-[#565b53]">
            {share.kind === "calendar" ? "Calendário partilhado" : "Evento partilhado"}
          </span>
        </div>

        {share.kind === "event" && lead && (
          <div className="bg-white border border-[#d8dbd3] rounded-xl p-6">
            <div className="text-[13px] tabular-nums text-[#c76a1f] font-semibold mb-1">
              {lead.start_date ? formatRange(lead.start_date, lead.end_date) : lead.date_label}
            </div>
            <h1 className="text-2xl font-bold mb-2">{lead.name}</h1>
            {lead.local && <p className="text-[#565b53] mb-3">{lead.local}</p>}
            {lead.angle && <p className="text-[15px] leading-relaxed">{lead.angle}</p>}
            {(lead.site || lead.redes_sociais) && (
              <div className="mt-4 pt-4 border-t border-dashed border-[#e6e7e2] text-sm space-y-1">
                {lead.site && lead.site !== "—" && <div>Site: {lead.site}</div>}
                {lead.redes_sociais && lead.redes_sociais !== "—" && <div>Redes: {lead.redes_sociais}</div>}
              </div>
            )}
          </div>
        )}

        {share.kind === "calendar" && allLeads && (
          <div className="space-y-3">
            {allLeads.map((lead) => (
              <div key={lead.id} className="bg-white border border-[#d8dbd3] rounded-xl p-4">
                <div className="text-[13px] tabular-nums text-[#c76a1f] font-semibold mb-1">
                  {lead.start_date ? formatRange(lead.start_date, lead.end_date) : lead.date_label}
                </div>
                <div className="font-semibold">{lead.name}</div>
                {lead.local && <div className="text-[13px] text-[#565b53]">{lead.local}</div>}
              </div>
            ))}
          </div>
        )}

        <p className="text-[12px] text-[#9a9d97] mt-8">
          Link privado partilhado por Naloa. Se não devias ter recebido isto, ignora esta página.
        </p>
      </div>
    </div>
  );
}
