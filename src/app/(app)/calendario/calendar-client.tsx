"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Lead } from "@/lib/db";
import type { Share } from "@/lib/shares";
import { formatDateRangeShort } from "@/lib/dates";
import NewEventModal from "./new-event-modal";
import EventDetailModal from "../event-detail-modal";

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

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIsoDate(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

// Devolve a matriz de dias (semanas x 7) de um mês, incluindo os dias de
// preenchimento do mês anterior/seguinte para completar a grelha (semana começa à 2ª).
function buildMonthGrid(year: number, month: number): { iso: string; inMonth: boolean }[] {
  const first = new Date(year, month, 1);
  const firstWeekday = (first.getDay() + 6) % 7; // 0 = Segunda
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { iso: string; inMonth: boolean }[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    const d = daysInPrevMonth - firstWeekday + 1 + i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    cells.push({ iso: toIsoDate(prevYear, prevMonth, d), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ iso: toIsoDate(year, month, d), inMonth: true });
  }
  while (cells.length % 7 !== 0 || cells.length < 35) {
    const last = cells[cells.length - 1];
    const [ly, lm, ld] = last.iso.split("-").map(Number);
    const next = new Date(ly, lm - 1, ld + 1);
    cells.push({ iso: toIsoDate(next.getFullYear(), next.getMonth(), next.getDate()), inMonth: false });
  }
  return cells;
}

function ShareBox({
  path,
  icalPath,
  onRevoke,
}: {
  path: string;
  icalPath?: string;
  onRevoke: () => void;
}) {
  const [copied, setCopied] = useState<"link" | "ical" | null>(null);

  async function copy(value: string, which: "link" | "ical") {
    const absolute = new URL(value, window.location.href).toString();
    await navigator.clipboard.writeText(absolute);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="mt-2 bg-[var(--c-amber-bg)] rounded-lg px-2.5 py-1.5 text-[12px] overflow-hidden"
    >
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={path}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 bg-transparent outline-none text-[var(--c-accent-deep)] truncate"
        />
        <button onClick={() => copy(path, "link")} className="shrink-0 font-semibold text-[var(--c-accent-deep)] hover:underline">
          {copied === "link" ? "Copiado" : "Copiar"}
        </button>
        <button onClick={onRevoke} className="shrink-0 text-[var(--c-amber-text)] hover:underline">
          Remover
        </button>
      </div>
      {icalPath && (
        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-dashed border-[var(--c-accent-deep)]/20">
          <span className="text-[var(--c-amber-text)]">Subscrever no telemóvel:</span>
          <button onClick={() => copy(icalPath, "ical")} className="shrink-0 font-semibold text-[var(--c-accent-deep)] hover:underline">
            {copied === "ical" ? "Copiado" : "Copiar link .ics"}
          </button>
        </div>
      )}
    </motion.div>
  );
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
};

type View = "grid" | "list";

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
  const [view, setView] = useState<View>("grid");
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const today = useMemo(() => new Date(), []);
  const firstWithEvents = leads.find((l) => l.start_date)?.start_date;
  const [cursor, setCursor] = useState(() => {
    const base = firstWithEvents ? new Date(firstWithEvents) : today;
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  const openLead = leads.find((l) => l.id === openId) ?? null;

  const shareByLead = useMemo(() => {
    const map = new Map<string, Share>();
    for (const s of shares) if (s.kind === "event" && s.lead_id) map.set(s.lead_id, s);
    return map;
  }, [shares]);

  const calendarShare = shares.find((s) => s.kind === "calendar") ?? null;

  const visibleLeads = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.trim().toLowerCase();
    return leads.filter((l) => `${l.name} ${l.local ?? ""}`.toLowerCase().includes(q));
  }, [leads, search]);

  const leadsByDate = useMemo(() => {
    const map = new Map<string, Lead[]>();
    for (const lead of visibleLeads) {
      if (!lead.start_date) continue;
      const key = lead.start_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(lead);
    }
    return map;
  }, [visibleLeads]);

  const groups = useMemo(() => {
    const byMonth = new Map<string, Lead[]>();
    for (const lead of visibleLeads) {
      if (!lead.start_date) continue;
      const key = monthKey(lead.start_date);
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(lead);
    }
    for (const list of byMonth.values()) list.sort((a, b) => (a.start_date! < b.start_date! ? -1 : 1));
    return Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [visibleLeads]);

  const grid = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);
  const todayIso = toIsoDate(today.getFullYear(), today.getMonth(), today.getDate());

  function onUpdated(updated: Lead) {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  }

  function onCreated(lead: Lead) {
    setLeads((prev) => [...prev, lead]);
    if (lead.start_date) {
      const d = new Date(lead.start_date);
      setCursor({ year: d.getFullYear(), month: d.getMonth() });
    }
  }

  function changeMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

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

  function icalPathFor(token: string) {
    return `/api/ical/${token}`;
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
          <p className="text-sm text-[var(--c-muted)] mt-1">
            Só tu vês isto por omissão. Cada evento tem um link de partilha próprio, ou partilha o
            calendário inteiro.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <NewEventModal onCreated={onCreated} />
          {calendarShare ? (
            <ShareBox
              path={pathFor(calendarShare.token)}
              icalPath={icalPathFor(calendarShare.token)}
              onRevoke={() => revoke(calendarShare.token)}
            />
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => createShare("calendar", undefined, "Calendário completo")}
              disabled={creating === "calendar"}
              className="bg-[var(--c-button-primary-bg)] text-[var(--c-button-primary-text)] text-sm font-medium rounded-full px-4 py-2 disabled:opacity-50"
            >
              {creating === "calendar" ? "A criar link…" : "Partilhar calendário inteiro"}
            </motion.button>
          )}
        </div>
      </motion.div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {view === "grid" ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => changeMonth(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-[var(--c-border)] hover:bg-[var(--c-surface)] text-[var(--c-muted)]"
              aria-label="Mês anterior"
            >
              ‹
            </button>
            <h2 className="text-sm font-semibold uppercase tracking-wide min-w-[140px] text-center">
              {monthLabel(`${cursor.year}-${pad(cursor.month + 1)}`)}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-[var(--c-border)] hover:bg-[var(--c-surface)] text-[var(--c-muted)]"
              aria-label="Mês seguinte"
            >
              ›
            </button>
          </div>
        ) : (
          <div />
        )}

        <div className="relative flex-1 min-w-[180px] max-w-[280px] order-3 sm:order-none">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar…"
            className="w-full bg-[var(--c-card)] border border-[var(--c-border)] rounded-full pl-8 pr-3 py-1.5 text-[13px] outline-none focus:border-[var(--c-ink)] transition-colors"
          />
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--c-muted-2)]"
            width="13"
            height="13"
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
          {(["grid", "list"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`relative px-3 py-1.5 transition-colors ${
                view === v ? "text-[var(--c-ink)]" : "text-[var(--c-muted-2)] hover:bg-[var(--c-bg)]"
              }`}
            >
              {view === v && (
                <motion.span
                  layoutId="view-highlight"
                  className="absolute inset-0 -z-10 bg-[var(--c-surface)]"
                  transition={{ type: "spring", stiffness: 500, damping: 34 }}
                />
              )}
              {v === "grid" ? "Grelha" : "Lista"}
            </button>
          ))}
        </div>
      </div>

      {view === "grid" ? (
        <motion.div
          key={`${cursor.year}-${cursor.month}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-xl overflow-hidden"
        >
          <div className="grid grid-cols-7 border-b border-[var(--c-border)]">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[var(--c-muted-2)]">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((cell, i) => {
              const dayLeads = leadsByDate.get(cell.iso) ?? [];
              const dayNum = Number(cell.iso.slice(8, 10));
              const isToday = cell.iso === todayIso;
              return (
                <div
                  key={cell.iso + i}
                  className={`min-h-[92px] p-1.5 border-b border-r border-[var(--c-border)] [&:nth-child(7n)]:border-r-0 ${
                    cell.inMonth ? "" : "bg-[var(--c-bg)]/50"
                  }`}
                >
                  <div
                    className={`text-[11px] font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday
                        ? "bg-[var(--c-button-primary-bg)] text-[var(--c-button-primary-text)]"
                        : cell.inMonth
                          ? "text-[var(--c-muted)]"
                          : "text-[var(--c-muted-2)]"
                    }`}
                  >
                    {dayNum}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {dayLeads.slice(0, 3).map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => setOpenId(lead.id)}
                        title={lead.name}
                        className="w-full text-left text-[10.5px] leading-tight px-1 py-0.5 rounded bg-[var(--c-amber-bg)] text-[var(--c-accent-deep)] truncate hover:opacity-80 transition-opacity"
                      >
                        {lead.name}
                      </button>
                    ))}
                    {dayLeads.length > 3 && (
                      <div className="text-[10px] text-[var(--c-muted-2)] px-1">+{dayLeads.length - 3} mais</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <>
          {groups.length === 0 && (
            <p className="text-sm text-[var(--c-muted-2)] text-center py-16">
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
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--c-muted)] mb-2">
                {monthLabel(key)}
              </h2>
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-xl overflow-hidden divide-y divide-[var(--c-border)]"
              >
                {monthLeads.map((lead) => {
                  const share = shareByLead.get(lead.id);
                  return (
                    <motion.div
                      key={lead.id}
                      variants={itemVariants}
                      className="p-3.5 flex flex-wrap items-start justify-between gap-3 cursor-pointer hover:bg-[var(--c-bg)] transition-colors"
                      onClick={() => setOpenId(lead.id)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-[13px] tabular-nums text-[var(--c-accent)] font-semibold">
                            {formatRange(lead)}
                          </span>
                          <span className="font-semibold">{lead.name}</span>
                          {lead.local && <span className="text-[13px] text-[var(--c-muted)]">· {lead.local}</span>}
                        </div>
                        {lead.angle && <div className="text-[13px] text-[var(--c-muted)] mt-1">{lead.angle}</div>}
                        <AnimatePresence>
                          {share && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <ShareBox key={share.token} path={pathFor(share.token)} onRevoke={() => revoke(share.token)} />
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                      {!share && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            createShare("event", lead.id, lead.name);
                          }}
                          disabled={creating === lead.id}
                          className="shrink-0 text-[12px] font-semibold uppercase tracking-wide border border-[var(--c-border)] rounded-full px-3 py-1.5 hover:bg-[var(--c-bg)] disabled:opacity-50"
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
        </>
      )}

      {openLead && <EventDetailModal lead={openLead} onClose={() => setOpenId(null)} onUpdated={onUpdated} />}
    </div>
  );
}
