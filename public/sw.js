// Service worker mínimo — existe só para tornar a app instalável (ícone no
// ecrã principal, abre em ecrã inteiro). Não faz cache de nada: os dados
// (leads, calendário) são sempre pedidos à rede, nunca servidos "antigos".
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
