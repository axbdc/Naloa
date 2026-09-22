"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { LeadStatus } from "@/lib/db";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/sections";
import { patchLead } from "@/lib/api-client";

const textStyles: Record<LeadStatus, string> = {
  todo: "text-[var(--c-muted-3)]",
  contactado: "text-[var(--c-amber-text)]",
  fechado: "text-[var(--c-green-text)]",
};
const highlightStyles: Record<LeadStatus, string> = {
  todo: "bg-[var(--c-surface-2)]",
  contactado: "bg-[var(--c-amber-bg-2)]",
  fechado: "bg-[var(--c-green-bg)]",
};

export default function StatusButtons({
  id,
  status,
  onChanged,
}: {
  id: string;
  status: LeadStatus;
  onChanged?: (status: LeadStatus) => void;
}) {
  const [current, setCurrent] = useState(status);
  const [saving, setSaving] = useState(false);

  async function setStatus(next: LeadStatus) {
    if (next === current) return;
    const prev = current;
    setCurrent(next);
    setSaving(true);
    try {
      await patchLead(id, { status: next });
      onChanged?.(next);
    } catch {
      setCurrent(prev);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative inline-flex rounded-full border border-[var(--c-border)] overflow-hidden text-[11px] font-semibold uppercase tracking-wide bg-[var(--c-card)]">
      {STATUS_ORDER.map((s) => (
        <button
          key={s}
          onClick={() => setStatus(s)}
          disabled={saving}
          className={`relative px-2.5 py-1 transition-colors ${current === s ? textStyles[s] : "text-[var(--c-muted-2)] hover:bg-[var(--c-bg)]"}`}
        >
          {current === s && (
            <motion.span
              layoutId={`status-highlight-${id}`}
              className={`absolute inset-0 -z-10 ${highlightStyles[s]}`}
              transition={{ type: "spring", stiffness: 500, damping: 34 }}
            />
          )}
          {STATUS_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
