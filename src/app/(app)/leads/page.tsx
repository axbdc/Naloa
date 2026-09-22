import { getAllLeads } from "@/lib/db";
import { sections } from "@/lib/sections";
import LeadsClient from "./leads-client";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await getAllLeads();
  const total = leads.length;
  const todo = leads.filter((l) => l.status === "todo").length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tabela de leads</h1>
          <p className="text-sm text-[#565b53] mt-1">
            Eventos com data + leads recorrentes para fotografia, vídeo e redes sociais.
          </p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums text-[#c76a1f]">{total}</div>
            <div className="text-[11px] uppercase tracking-wide text-[#565b53]">Linhas</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums text-[#c76a1f]">{todo}</div>
            <div className="text-[11px] uppercase tracking-wide text-[#565b53]">Por contactar</div>
          </div>
        </div>
      </div>

      {sections.map((section) => {
        const rows = leads.filter((l) => l.section === section.key);
        if (rows.length === 0) return null;
        return <LeadsClient key={section.key} section={section} leads={rows} />;
      })}
    </div>
  );
}
