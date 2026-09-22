"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { EquipmentItem, Lead, PaymentStatus, ServiceType } from "@/lib/db";
import { patchLead, duplicateLeadRequest } from "@/lib/api-client";
import { formatDateRangeShort } from "@/lib/dates";
import StatusButtons from "./status-buttons";

const inputClass =
  "w-full bg-[var(--c-bg)] border border-[var(--c-border)] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[var(--c-ink)] transition-colors";
const labelClass = "text-[11px] uppercase tracking-wide text-[var(--c-muted)] mb-1 block";

const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: "fotografia", label: "Fotografia" },
  { value: "video", label: "Vídeo" },
  { value: "ambos", label: "Fotografia + vídeo" },
  { value: "drone", label: "Drone" },
  { value: "outro", label: "Outro" },
];

const PAYMENT_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Pago" },
];

function TextField({
  label,
  value,
  placeholder,
  type = "text",
  onSave,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  onSave: (value: string) => Promise<void>;
}) {
  const [val, setVal] = useState(value);
  const [saved, setSaved] = useState(true);

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        className={`${inputClass} ${saved ? "" : "border-[var(--c-accent)]"}`}
        value={val}
        placeholder={placeholder}
        onChange={(e) => {
          setVal(e.target.value);
          setSaved(false);
        }}
        onBlur={async () => {
          if (val === value) {
            setSaved(true);
            return;
          }
          await onSave(val);
          setSaved(true);
        }}
      />
    </div>
  );
}

export default function EventDetailModal({
  lead,
  onClose,
  onUpdated,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdated: (lead: Lead) => void;
}) {
  const [newItem, setNewItem] = useState("");
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateDate, setDuplicateDate] = useState("");
  const [showDuplicateForm, setShowDuplicateForm] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null);

  async function save(field: string, value: unknown) {
    const updated = await patchLead(lead.id, { [field]: value });
    onUpdated(updated);
  }

  async function toggleEquipment(index: number) {
    const next: EquipmentItem[] = lead.equipment.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    );
    await save("equipment", next);
  }

  async function addEquipment() {
    const name = newItem.trim();
    if (!name) return;
    const next: EquipmentItem[] = [...lead.equipment, { item: name, checked: false }];
    setNewItem("");
    await save("equipment", next);
  }

  async function removeEquipment(index: number) {
    const next = lead.equipment.filter((_, i) => i !== index);
    await save("equipment", next);
  }

  async function onDuplicate() {
    if (!duplicateDate) return;
    setDuplicating(true);
    try {
      await duplicateLeadRequest(lead.id, duplicateDate, null);
      setDuplicateMessage("Criado! Vês o evento novo na tabela/calendário.");
      setShowDuplicateForm(false);
      setDuplicateDate("");
    } catch {
      setDuplicateMessage("Não foi possível duplicar. Tenta outra vez.");
    } finally {
      setDuplicating(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[var(--c-overlay)] backdrop-blur-sm px-0 sm:px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 340, damping: 32 }}
          className="w-full sm:w-[520px] bg-[var(--c-card)] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <h2 className="text-lg font-bold">{lead.name}</h2>
              <p className="text-[13px] text-[var(--c-muted)] mt-0.5">
                {lead.start_date ? formatDateRangeShort(lead.start_date, lead.end_date) : "Sem data"}
                {lead.local ? ` · ${lead.local}` : ""}
              </p>
            </div>
            <button onClick={onClose} className="text-[var(--c-muted-2)] hover:text-[var(--c-ink)] text-xl leading-none shrink-0">
              ×
            </button>
          </div>

          {lead.angle && <p className="text-[13px] text-[var(--c-ink)] mt-2">{lead.angle}</p>}

          <div className="mt-4">
            <StatusButtons id={lead.id} status={lead.status} onChanged={(s) => onUpdated({ ...lead, status: s })} />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <TextField label="Hora de início" type="time" value={lead.start_time ?? ""} onSave={(v) => save("start_time", v)} />
            <TextField label="Hora de fim" type="time" value={lead.end_time ?? ""} onSave={(v) => save("end_time", v)} />
          </div>

          <div className="mt-3">
            <label className={labelClass}>Tipo de serviço</label>
            <div className="flex flex-wrap gap-1.5">
              {SERVICE_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => save("service_type", lead.service_type === opt.value ? null : opt.value)}
                  className={`text-[12px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                    lead.service_type === opt.value
                      ? "bg-[var(--c-button-primary-bg)] text-[var(--c-button-primary-text)] border-transparent"
                      : "border-[var(--c-border)] text-[var(--c-muted)] hover:bg-[var(--c-bg)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <TextField label="Equipa / quem vai" value={lead.team ?? ""} placeholder="Nomes separados por vírgula" onSave={(v) => save("team", v)} />
          </div>

          <div className="mt-4">
            <label className={labelClass}>Material necessário</label>
            <div className="space-y-1">
              {lead.equipment.map((item, i) => (
                <div key={`${item.item}-${i}`} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleEquipment(i)}
                    className="accent-[var(--c-accent)] w-4 h-4"
                  />
                  <span className={`text-[13px] flex-1 ${item.checked ? "line-through text-[var(--c-muted-2)]" : ""}`}>
                    {item.item}
                  </span>
                  <button
                    onClick={() => removeEquipment(i)}
                    className="text-[var(--c-muted-2)] hover:text-[var(--c-ink)] opacity-0 group-hover:opacity-100 transition-opacity text-sm px-1"
                    aria-label="Remover"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addEquipment();
                  }
                }}
                placeholder="Adicionar item (ex. drone, luz LED)"
                className={inputClass}
              />
              <button
                onClick={addEquipment}
                className="shrink-0 text-[13px] font-medium px-3 rounded-lg border border-[var(--c-border)] hover:bg-[var(--c-bg)]"
              >
                Adicionar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <TextField
              label="Orçamento (€)"
              type="number"
              value={lead.budget !== null ? String(lead.budget) : ""}
              onSave={(v) => save("budget", v === "" ? null : Number(v))}
            />
            <div>
              <label className={labelClass}>Pagamento</label>
              <div className="flex gap-1.5">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => save("payment_status", lead.payment_status === opt.value ? null : opt.value)}
                    className={`text-[12px] font-medium px-2.5 py-1.5 rounded-full border transition-colors ${
                      lead.payment_status === opt.value
                        ? opt.value === "pago"
                          ? "bg-[var(--c-green-bg)] text-[var(--c-green-text)] border-transparent"
                          : "bg-[var(--c-amber-bg)] text-[var(--c-accent-deep)] border-transparent"
                        : "border-[var(--c-border)] text-[var(--c-muted)] hover:bg-[var(--c-bg)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-dashed border-[var(--c-surface-2)]">
            <TextField label="Redes sociais" value={lead.redes_sociais ?? ""} placeholder="—" onSave={(v) => save("redes_sociais", v)} />
            <TextField label="Site" value={lead.site ?? ""} placeholder="—" onSave={(v) => save("site", v)} />
            <TextField label="Contacto" value={lead.contacto ?? ""} placeholder="—" onSave={(v) => save("contacto", v)} />
          </div>
          <div className="mt-3">
            <label className={labelClass}>Notas</label>
            <textarea
              defaultValue={lead.notas ?? ""}
              onBlur={(e) => save("notas", e.target.value)}
              placeholder="Sem notas"
              className={`${inputClass} min-h-[64px] resize-none`}
            />
          </div>

          {lead.start_date && (
            <div className="mt-5 pt-4 border-t border-dashed border-[var(--c-surface-2)]">
              {!showDuplicateForm ? (
                <button
                  onClick={() => setShowDuplicateForm(true)}
                  className="text-[13px] font-semibold uppercase tracking-wide text-[var(--c-muted)] hover:text-[var(--c-ink)]"
                >
                  Duplicar evento →
                </button>
              ) : (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className={labelClass}>Nova data</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={duplicateDate}
                      onChange={(e) => setDuplicateDate(e.target.value)}
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    disabled={duplicating || !duplicateDate}
                    onClick={onDuplicate}
                    className="bg-[var(--c-button-primary-bg)] text-[var(--c-button-primary-text)] text-sm font-medium rounded-lg px-3 py-2 disabled:opacity-50"
                  >
                    {duplicating ? "…" : "Duplicar"}
                  </motion.button>
                </div>
              )}
              {duplicateMessage && <p className="text-[12px] text-[var(--c-muted)] mt-2">{duplicateMessage}</p>}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
