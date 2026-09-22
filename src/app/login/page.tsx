"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Password incorreta.");
        setLoading(false);
        return;
      }
      const next = params.get("next") || "/leads";
      router.push(next);
      router.refresh();
    } catch {
      setError("Não foi possível ligar. Tenta outra vez.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4">
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        className="w-full max-w-sm"
      >
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-[#F5EFE3] text-2xl mb-1 tracking-wide"
        >
          naloa
        </motion.h1>
        <p className="text-[#C9A96E] text-xs uppercase tracking-[0.15em] mb-8">Radar de Prospeção</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full bg-transparent border border-[#C9A96E]/40 text-[#F5EFE3] rounded-md px-4 py-3 mb-3 outline-none focus:border-[#C9A96E] transition-colors"
        />
        {error && (
          <motion.p
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-red-400 text-sm mb-3"
          >
            {error}
          </motion.p>
        )}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-[#C9A96E] text-[#0A0A0A] font-medium rounded-md px-4 py-3 disabled:opacity-50"
        >
          {loading ? "A entrar…" : "Entrar"}
        </motion.button>
      </motion.form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
