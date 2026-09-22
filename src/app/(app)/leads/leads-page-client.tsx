"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Lead } from "@/lib/db";
import type { SectionMeta } from "@/lib/sections";
import LeadsClient from "./leads-client";
import KanbanBoard from "./kanban-board";

type View = "tabela" | "kanban";

function matchesSearch(lead: Lead, query: string): boolean {
  if (!query) return true;
  const haystack = `${lead.name} ${lead.local ?? ""} ${lead.sub ?? ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export default function LeadsPageClient({
  sections,
  leads: initialLeads,
}: {
  sections: SectionMeta[];
  leads: Lead[];
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [view, setView] = useState<View>("tabela");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => leads.filter((l) => matchesSearch(l, search)), [leads, search]);
  const total = leads.length;
  const todo = leads.filter((l) => l.status === "todo").length;

  function onUpdated(updated: Lead) {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Tabela de leads</h1>
          <p className="text-sm text-[var(--c-muted)] mt-1">
            Eventos com data + leads recorrentes para fotografia, vídeo e redes sociais.
          </p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums text-[var(--c-accent)]">{total}</div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--c-muted)]">Linhas</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums text-[var(--c-accent)]">{todo}</div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--c-muted)]">Por contactar</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px] max-w-[360px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome ou local…"
            className="w-full bg-[var(--c-card)] border border-[var(--c-border)] rounded-full pl-9 pr-3 py-2 text-[13px] outline-none focus:border-[var(--c-ink)] transition-colors"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-muted-2)]"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        <div className="relative inline-flex rounded-full border border-[var(--c-border)] overflow-hidden text-[12px] font-semibold uppercase tracking-wide bg-[var(--c-card)]">
          {(["tabela", "kanban"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`relative px-3 py-1.5 transition-colors ${
                view === v ? "text-[var(--c-ink)]" : "text-[var(--c-muted-2)] hover:bg-[var(--c-bg)]"
              }`}
            >
              {view === v && (
                <motion.span
                  layoutId="leads-view-highlight"
                  className="absolute inset-0 -z-10 bg-[var(--c-surface)]"
                  transition={{ type: "spring", stiffness: 500, damping: 34 }}
                />
              )}
              {v === "tabela" ? "Tabela" : "Kanban"}
            </button>
          ))}
        </div>
      </div>

      {view === "kanban" ? (
        <KanbanBoard leads={filtered} onUpdated={onUpdated} />
      ) : (
        <>
          {sections.map((section) => {
            const rows = filtered.filter((l) => l.section === section.key);
            if (rows.length === 0) return null;
            return <LeadsClient key={section.key} section={section} leads={rows} onUpdated={onUpdated} />;
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-[var(--c-muted-2)] text-center py-16">Nenhum resultado para &ldquo;{search}&rdquo;.</p>
          )}
        </>
      )}
    </div>
  );
}
