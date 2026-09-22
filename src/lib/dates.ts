// Helpers de datas em português. Evitamos toLocaleDateString("pt-PT", { day, month: "short" })
// sem "year" porque essa combinação específica cai para um formato numérico em alguns
// motores ICU (bug observado, não intencional) — construímos o rótulo à mão para ter sempre
// "05 out" em vez de "05/10".

const MONTHS_SHORT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export function formatShortDate(isoDate: string): string {
  const [, m, d] = isoDate.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS_SHORT[m - 1]}`;
}

export function formatDateRangeShort(startIso: string, endIso: string | null): string {
  const start = formatShortDate(startIso);
  if (!endIso || endIso === startIso) return start;
  return `${start} – ${formatShortDate(endIso)}`;
}
