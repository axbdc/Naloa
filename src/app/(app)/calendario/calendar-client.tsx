"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Lead } from "@/lib/db";
import type { Share } from "@/lib/shares";
import { formatDateRangeShort } from "@/lib/dates";
import NewEventModal from "./new-event-modal";

function formatRange(lead: Lead): string {
  return formatDateRangeShort(lead.start_date!, lead.end_date);
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  const label = d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
};

function ShareBox({ path, onRevoke }: { path: string; onRevoke: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="mt-2 flex items-center gap-2 bg-[#f4dfc8] rounded-lg px-2.5 py-1.5 text-[12px] overflow-hidden"
    >
      <input
        readOnly
        value={path}
        onFocus={(e) => e.currentTarget.select()}
        className="flex-1 min-w-0 bg-transparent outline-none text-[#5a2d0c] truncate"
      />
      <button
        onClick={async () => {
          const absolute = new URL(path, window.location.href).toString();
          await navigator.clipboard.writeText(absolute);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="shrink-0 font-semibold text-[#5a2d0c] hover:underline"
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
      <button onClick={onRevoke} className="shrink-0 text-[#8a6d1f] hover:underline">
        Remover
      </button>
    </motion.div>
  );
}

export default function CalendarClient({
  leads: initialLeads,
  shares: initialShares,
}: {
  leads: Lead[];
  shares: Share[];
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [shares, setShares] = useState(initialShares);
  const [creating, setCreating] = useState<string | null>(null);

  const shareByLead = useMemo(() => {
    const map = new Map<string, Share>();
    for (const s of shares) if (s.kind === "event" && s.lead_id) map.set(s.lead_id, s);
    return map;
  }, [shares]);

  const calendarShare = shares.find((s) => s.kind === "calendar") ?? null;

  const groups = useMemo(() => {
    const byMonth = new Map<string, Lead[]>();
    for (const lead of leads) {
      if (!lead.start_date) continue;
      const key = monthKey(lead.start_date);
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(lead);
    }
    for (const list of byMonth.values()) list.sort((a, b) => (a.start_date! < b.start_date! ? -1 : 1));
    return Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [leads]);

  async function createShare(kind: "event" | "calendar", leadId?: string, label?: string) {
    setCreating(leadId ?? "calendar");
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, leadId, label }),
      });
      const data = await res.json();
      setShares((prev) => [data.share, ...prev]);
    } finally {
      setCreating(null);
    }
  }

  async function revoke(token: string) {
    setShares((prev) => prev.filter((s) => s.token !== token));
    await fetch(`/api/share/${token}`, { method: "DELETE" });
  }

  function pathFor(token: string) {
    return `/partilha/${token}`;
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-wrap items-start justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold">Calendário</h1>
          <p className="text-sm text-[#565b53] mt-1">
            Só tu vês isto por omissão. Cada evento tem um link de partilha próprio, ou partilha o
            calendário inteiro.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewEventModal onCreated={(lead) => setLeads((prev) => [...prev, lead])} />
          {calendarShare ? (
            <ShareBox path={pathFor(calendarShare.token)} onRevoke={() => revoke(calendarShare.token)} />
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => createShare("calendar", undefined, "Calendário completo")}
              disabled={creating === "calendar"}
              className="bg-[#171916] text-white text-sm font-medium rounded-full px-4 py-2 disabled:opacity-50"
            >
              {creating === "calendar" ? "A criar link…" : "Partilhar calendário inteiro"}
            </motion.button>
          )}
        </div>
      </motion.div>

      {groups.length === 0 && (
        <p className="text-sm text-[#9a9d97] text-center py-16">
          Ainda não há eventos com data. Cria o primeiro com &ldquo;+ Novo evento&rdquo;.
        </p>
      )}

      {groups.map(([key, monthLeads], groupIndex) => (
        <motion.section
          key={key}
          className="mb-7"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: Math.min(groupIndex * 0.05, 0.3) }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#565b53] mb-2">
            {monthLabel(key)}
          </h2>
          <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="bg-white border border-[#d8dbd3] rounded-xl overflow-hidden divide-y divide-[#d8dbd3]"
          >
            {monthLeads.map((lead) => {
              const share = shareByLead.get(lead.id);
              return (
                <motion.div
                  key={lead.id}
                  variants={itemVariants}
                  className="p-3.5 flex flex-wrap items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[13px] tabular-nums text-[#c76a1f] font-semibold">
                        {formatRange(lead)}
                      </span>
                      <span className="font-semibold">{lead.name}</span>
                      {lead.local && <span className="text-[13px] text-[#565b53]">· {lead.local}</span>}
                    </div>
                    {lead.angle && <div className="text-[13px] text-[#565b53] mt-1">{lead.angle}</div>}
                    <AnimatePresence>
                      {share && (
                        <ShareBox key={share.token} path={pathFor(share.token)} onRevoke={() => revoke(share.token)} />
                      )}
                    </AnimatePresence>
                  </div>
                  {!share && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => createShare("event", lead.id, lead.name)}
                      disabled={creating === lead.id}
                      className="shrink-0 text-[12px] font-semibold uppercase tracking-wide border border-[#d8dbd3] rounded-full px-3 py-1.5 hover:bg-[#f4f5f2] disabled:opacity-50"
                    >
                      {creating === lead.id ? "…" : "Partilhar"}
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>
      ))}
    </div>
  );
}
