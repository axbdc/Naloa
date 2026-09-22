"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <h1 className="text-[#F5EFE3] text-2xl mb-1 tracking-wide">naloa</h1>
        <p className="text-[#C9A96E] text-xs uppercase tracking-[0.15em] mb-8">Radar de Prospeção</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full bg-transparent border border-[#C9A96E]/40 text-[#F5EFE3] rounded-md px-4 py-3 mb-3 outline-none focus:border-[#C9A96E] transition-colors"
        />
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#C9A96E] text-[#0A0A0A] font-medium rounded-md px-4 py-3 disabled:opacity-50"
        >
          {loading ? "A entrar…" : "Entrar"}
        </button>
      </form>
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
