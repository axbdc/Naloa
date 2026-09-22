"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Lead, LeadStatus } from "@/lib/db";
import type { SectionMeta } from "@/lib/sections";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/sections";

async function patchLead(id: string, body: Record<string, string>) {
  const res = await fetch(`/api/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("save_failed");
  return res.json();
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 320, damping: 30 } },
};

function StatusButtons({ id, status }: { id: string; status: LeadStatus }) {
  const [current, setCurrent] = useState(status);
  const [saving, setSaving] = useState(false);

  async function setStatus(next: LeadStatus) {
    if (next === current) return;
    const prev = current;
    setCurrent(next);
    setSaving(true);
    try {
      await patchLead(id, { status: next });
    } catch {
      setCurrent(prev);
    } finally {
      setSaving(false);
    }
  }

  const textStyles: Record<LeadStatus, string> = {
    todo: "text-[#6b6f68]",
    contactado: "text-[#8a6d1f]",
    fechado: "text-[#3f6b3f]",
  };
  const highlightStyles: Record<LeadStatus, string> = {
    todo: "bg-[#e6e7e2]",
    contactado: "bg-[#f1e6c6]",
    fechado: "bg-[#dfe9de]",
  };

  return (
    <div className="relative inline-flex rounded-full border border-[#d8dbd3] overflow-hidden text-[11px] font-semibold uppercase tracking-wide bg-white">
      {STATUS_ORDER.map((s) => (
        <button
          key={s}
          onClick={() => setStatus(s)}
          disabled={saving}
          className={`relative px-2.5 py-1 transition-colors ${current === s ? textStyles[s] : "text-[#9a9d97] hover:bg-[#f4f5f2]"}`}
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
      placeholder={placeholder}
      className={`w-full bg-transparent border-b text-[13px] py-1 outline-none transition-colors ${
        saved ? "border-transparent hover:border-[#d8dbd3]" : "border-[#c76a1f]"
      } focus:border-[#c76a1f]`}
    />
  );
}

export default function LeadsClient({ section, leads }: { section: SectionMeta; leads: Lead[] }) {
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
          <span className="text-[12px] font-semibold normal-case px-2.5 py-0.5 rounded-full bg-[#f4dfc8] text-[#5a2d0c]">
            {section.tag}
          </span>
        )}
      </h2>
      {section.note && <p className="text-[13px] text-[#565b53] max-w-[70ch] mb-3">{section.note}</p>}

      <motion.div
        variants={listVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="bg-white border border-[#d8dbd3] rounded-xl overflow-hidden divide-y divide-[#d8dbd3]"
      >
        {leads.map((lead) => (
          <motion.div key={lead.id} variants={itemVariants} className="p-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[13px] tabular-nums text-[#565b53]">{lead.date_label}</span>
                  {lead.link ? (
                    <a
                      href={lead.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#171916] border-b border-[#c76a1f] hover:text-[#5a2d0c]"
                    >
                      {lead.name}
                    </a>
                  ) : (
                    <span className="font-semibold text-[#171916]">{lead.name}</span>
                  )}
                  {lead.local && <span className="text-[13px] text-[#565b53]">· {lead.local}</span>}
                </div>
                {lead.sub && <div className="text-[12px] text-[#565b53] mt-0.5">{lead.sub}</div>}
                {lead.angle && <div className="text-[13px] text-[#171916] mt-1">{lead.angle}</div>}
              </div>
              <StatusButtons id={lead.id} status={lead.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 mt-3 pt-3 border-t border-dashed border-[#e6e7e2]">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-[#9a9d97]">Redes sociais</div>
                <EditableField id={lead.id} field="redes_sociais" value={lead.redes_sociais} placeholder="—" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-[#9a9d97]">Site</div>
                <EditableField id={lead.id} field="site" value={lead.site} placeholder="—" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-[#9a9d97]">Contacto</div>
                <EditableField id={lead.id} field="contacto" value={lead.contacto} placeholder="—" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-[10px] uppercase tracking-wide text-[#9a9d97]">Notas</div>
              <EditableField id={lead.id} field="notas" value={lead.notas} placeholder="Sem notas" />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
