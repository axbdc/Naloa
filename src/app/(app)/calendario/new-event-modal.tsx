"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Lead } from "@/lib/db";

const inputClass =
  "w-full bg-[#f4f5f2] border border-[#d8dbd3] rounded-lg px-3 py-2 text-[14px] outline-none focus:border-[#171916] transition-colors";
const labelClass = "text-[11px] uppercase tracking-wide text-[#565b53] mb-1 block";

export default function NewEventModal({ onCreated }: { onCreated: (lead: Lead) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    local: "",
    angle: "",
    link: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setForm({ name: "", start_date: "", end_date: "", local: "", angle: "", link: "" });
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.start_date) {
      setError("Preenche pelo menos o nome e a data.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      onCreated(data.lead as Lead);
      reset();
      setOpen(false);
    } catch {
      setError("Não foi possível guardar. Tenta outra vez.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="bg-[#c76a1f] text-white text-sm font-medium rounded-full px-4 py-2 shadow-sm"
      >
        + Novo evento
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm px-0 sm:px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !saving) setOpen(false);
            }}
          >
            <motion.form
              onSubmit={onSubmit}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              className="w-full sm:w-[440px] bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Novo evento</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-[#9a9d97] hover:text-[#171916] text-xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Nome *</label>
                  <input
                    autoFocus
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Nome do evento ou lead"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Data início *</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={form.start_date}
                      onChange={(e) => update("start_date", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Data fim</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={form.end_date}
                      onChange={(e) => update("end_date", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Local</label>
                  <input
                    className={inputClass}
                    value={form.local}
                    onChange={(e) => update("local", e.target.value)}
                    placeholder="Cidade / local"
                  />
                </div>
                <div>
                  <label className={labelClass}>Nota / ângulo</label>
                  <textarea
                    className={`${inputClass} min-h-[64px] resize-none`}
                    value={form.angle}
                    onChange={(e) => update("angle", e.target.value)}
                    placeholder="Porque é que vale a pena, o que vender, etc."
                  />
                </div>
                <div>
                  <label className={labelClass}>Link</label>
                  <input
                    className={inputClass}
                    value={form.link}
                    onChange={(e) => update("link", e.target.value)}
                    placeholder="https://…"
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-[13px] mt-3">{error}</p>}

              <div className="flex gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-[#d8dbd3] rounded-full py-2.5 text-sm font-medium hover:bg-[#f4f5f2] transition-colors"
                >
                  Cancelar
                </button>
                <motion.button
                  type="submit"
                  disabled={saving}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 bg-[#171916] text-white rounded-full py-2.5 text-sm font-medium disabled:opacity-50"
                >
                  {saving ? "A guardar…" : "Criar evento"}
                </motion.button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
