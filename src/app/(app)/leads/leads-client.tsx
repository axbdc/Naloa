"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Lead } from "@/lib/db";
import type { SectionMeta } from "@/lib/sections";
import { patchLead } from "@/lib/api-client";
import StatusButtons from "../status-buttons";
import EventDetailModal from "../event-detail-modal";

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 320, damping: 30 } },
};

function EditableField({
  id,
  field,
  value,
  placeholder,
}: {
  id: string;
  field: "redes_sociais" | "site" | "contacto" | "notas";
  value: string | null;
  placeholder: string;
}) {
  const [val, setVal] = useState(value ?? "");
  const [saved, setSaved] = useState(true);

  async function onBlur() {
    setSaved(false);
    try {
      await patchLead(id, { [field]: val });
    } finally {
      setSaved(true);
    }
  }

  return (
    <input
      value={val}
      onChange={(e) => {
        setVal(e.target.value);
        setSaved(false);
      }}
      onBlur={onBlur}
      onClick={(e) => e.stopPropagation()}
      placeholder={placeholder}
      className={`w-full bg-transparent border-b text-[13px] py-1 outline-none transition-colors ${
        saved ? "border-transparent hover:border-[var(--c-border)]" : "border-[var(--c-accent)]"
      } focus:border-[var(--c-accent)]`}
    />
  );
}

export default function LeadsClient({
  section,
  leads,
  onUpdated,
}: {
  section: SectionMeta;
  leads: Lead[];
  onUpdated: (lead: Lead) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openLead = leads.find((l) => l.id === openId) ?? null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="mb-8"
    >
      <h2 className="flex items-baseline gap-2.5 text-lg font-semibold mb-1">
        {section.label}
        {section.tag && (
          <span className="text-[12px] font-semibold normal-case px-2.5 py-0.5 rounded-full bg-[var(--c-amber-bg)] text-[var(--c-accent-deep)]">
            {section.tag}
          </span>
        )}
      </h2>
      {section.note && <p className="text-[13px] text-[var(--c-muted)] max-w-[70ch] mb-3">{section.note}</p>}

      <motion.div
        variants={listVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="bg-[var(--c-card)] border border-[var(--c-border)] rounded-xl overflow-hidden divide-y divide-[var(--c-border)]"
      >
        {leads.map((lead) => (
          <motion.div
            key={lead.id}
            variants={itemVariants}
            className="p-3.5 cursor-pointer hover:bg-[var(--c-bg)] transition-colors"
            onClick={() => setOpenId(lead.id)}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[13px] tabular-nums text-[var(--c-muted)]">{lead.date_label}</span>
                  {lead.link ? (
                    <a
                      href={lead.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-[var(--c-ink)] border-b border-[var(--c-accent)] hover:text-[var(--c-accent-deep)]"
                    >
                      {lead.name}
                    </a>
                  ) : (
                    <span className="font-semibold text-[var(--c-ink)]">{lead.name}</span>
                  )}
                  {lead.local && <span className="text-[13px] text-[var(--c-muted)]">· {lead.local}</span>}
                </div>
                {lead.sub && <div className="text-[12px] text-[var(--c-muted)] mt-0.5">{lead.sub}</div>}
                {lead.angle && <div className="text-[13px] text-[var(--c-ink)] mt-1">{lead.angle}</div>}
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <StatusButtons id={lead.id} status={lead.status} onChanged={(s) => onUpdated({ ...lead, status: s })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 mt-3 pt-3 border-t border-dashed border-[var(--c-surface-2)]">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--c-muted-2)]">Redes sociais</div>
                <EditableField id={lead.id} field="redes_sociais" value={lead.redes_sociais} placeholder="—" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--c-muted-2)]">Site</div>
                <EditableField id={lead.id} field="site" value={lead.site} placeholder="—" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--c-muted-2)]">Contacto</div>
                <EditableField id={lead.id} field="contacto" value={lead.contacto} placeholder="—" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-[10px] uppercase tracking-wide text-[var(--c-muted-2)]">Notas</div>
              <EditableField id={lead.id} field="notas" value={lead.notas} placeholder="Sem notas" />
            </div>
            <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--c-muted-2)]">
              Ver detalhes do evento →
            </div>
          </motion.div>
        ))}
      </motion.div>

      {openLead && (
        <EventDetailModal
          lead={openLead}
          onClose={() => setOpenId(null)}
          onUpdated={onUpdated}
        />
      )}
    </motion.section>
  );
}
