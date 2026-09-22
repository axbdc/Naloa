"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Instalação como app falha silenciosamente em navegadores sem suporte — não é crítico.
    });
  }, []);

  return null;
}
