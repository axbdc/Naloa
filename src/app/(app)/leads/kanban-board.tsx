"use client";

import { useState } from "react";
import type { Lead, LeadStatus } from "@/lib/db";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/sections";
import { patchLead } from "@/lib/api-client";
import EventDetailModal from "../event-detail-modal";

const columnAccent: Record<LeadStatus, string> = {
  todo: "border-t-[var(--c-muted-3)]",
  contactado: "border-t-[var(--c-amber-text)]",
  fechado: "border-t-[var(--c-green-text)]",
};

function Card({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
      }}
      onClick={onOpen}
      className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-lg p-3 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-[box-shadow,transform] active:cursor-grabbing"
    >
      <div className="font-semibold text-[13px] text-[var(--c-ink)] truncate">{lead.name}</div>
      <div className="text-[11px] text-[var(--c-muted)] mt-0.5 truncate">
        {[lead.date_label, lead.local].filter(Boolean).join(" · ") || "Sem data"}
      </div>
      {lead.service_type && (
        <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--c-surface)] text-[var(--c-muted)]">
          {lead.service_type}
        </span>
      )}
    </div>
  );
}

export default function KanbanBoard({
  leads,
  onUpdated,
}: {
  leads: Lead[];
  onUpdated: (lead: Lead) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<LeadStatus | null>(null);
  const openLead = leads.find((l) => l.id === openId) ?? null;

  async function moveTo(id: string, status: LeadStatus) {
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === status) return;
    onUpdated({ ...lead, status });
    try {
      const updated = await patchLead(id, { status });
      onUpdated(updated);
    } catch {
      onUpdated(lead);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {STATUS_ORDER.map((status) => {
        const columnLeads = leads.filter((l) => l.status === status);
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(status);
            }}
            onDragLeave={() => setDragOverCol((c) => (c === status ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverCol(null);
              const id = e.dataTransfer.getData("text/plain");
              if (id) moveTo(id, status);
            }}
            className={`bg-[var(--c-bg)] border-t-2 ${columnAccent[status]} rounded-lg p-2.5 min-h-[200px] transition-colors ${
              dragOverCol === status ? "bg-[var(--c-surface)]" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <h3 className="text-[12px] font-semibold uppercase tracking-wide text-[var(--c-muted)]">
                {STATUS_LABELS[status]}
              </h3>
              <span className="text-[11px] tabular-nums text-[var(--c-muted-2)]">{columnLeads.length}</span>
            </div>
            <div className="space-y-2">
              {columnLeads.map((lead) => (
                <Card key={lead.id} lead={lead} onOpen={() => setOpenId(lead.id)} />
              ))}
              {columnLeads.length === 0 && (
                <p className="text-[11px] text-[var(--c-muted-2)] text-center py-6">Arrasta cards para aqui</p>
              )}
            </div>
          </div>
        );
      })}

      {openLead && <EventDetailModal lead={openLead} onClose={() => setOpenId(null)} onUpdated={onUpdated} />}
    </div>
  );
}
