"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  async function onClick() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={onClick}
      className="text-xs uppercase tracking-wide text-[var(--c-muted)] hover:text-[var(--c-ink)] transition-colors"
    >
      Sair
    </button>
  );
}
