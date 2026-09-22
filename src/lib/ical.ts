import type { Lead } from "./db";

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// Dobra linhas com mais de 75 octetos, como pede a RFC 5545.
function foldLine(line: string): string {
  const bytes = Buffer.byteLength(line, "utf8");
  if (bytes <= 75) return line;
  const out: string[] = [];
  let rest = line;
  let first = true;
  while (rest.length > 0) {
    const limit = first ? 75 : 74; // linhas seguintes começam com um espaço
    let chunk = rest.slice(0, limit);
    // não corta um caráter multibyte a meio
    while (Buffer.byteLength(chunk, "utf8") > limit && chunk.length > 0) {
      chunk = chunk.slice(0, -1);
    }
    out.push(first ? chunk : ` ${chunk}`);
    rest = rest.slice(chunk.length);
    first = false;
  }
  return out.join("\r\n");
}

function dateStamp(iso: string): string {
  return iso.replace(/-/g, "");
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function nowStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function leadToVEvent(lead: Lead, hostUrl: string): string[] {
  const lines: string[] = [];
  lines.push("BEGIN:VEVENT");
  lines.push(`UID:naloa-${lead.id}@${new URL(hostUrl).host}`);
  lines.push(`DTSTAMP:${nowStamp()}`);

  const start = lead.start_date!;
  const end = lead.end_date ?? lead.start_date!;

  if (lead.start_time) {
    // Evento com hora: DTSTART/DTEND em hora local "flutuante" (sem fuso), simples e
    // suficiente para uso pessoal — a maioria dos calendários interpreta como hora local.
    const startTime = lead.start_time.replace(":", "") + "00";
    const endTime = (lead.end_time ?? lead.start_time).replace(":", "") + "00";
    lines.push(`DTSTART:${dateStamp(start)}T${startTime}`);
    lines.push(`DTEND:${dateStamp(end)}T${endTime}`);
  } else {
    // Evento de dia inteiro: DTEND é exclusivo, por isso soma-se 1 dia.
    lines.push(`DTSTART;VALUE=DATE:${dateStamp(start)}`);
    lines.push(`DTEND;VALUE=DATE:${dateStamp(addDays(end, 1))}`);
  }

  lines.push(`SUMMARY:${escapeText(lead.name)}`);
  if (lead.local) lines.push(`LOCATION:${escapeText(lead.local)}`);

  const descriptionParts = [lead.angle, lead.notas].filter(Boolean) as string[];
  if (descriptionParts.length > 0) {
    lines.push(`DESCRIPTION:${escapeText(descriptionParts.join("\n\n"))}`);
  }

  lines.push("END:VEVENT");
  return lines;
}

export function buildIcs(leads: Lead[], calendarName: string, hostUrl: string): string {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//Naloa//Radar de Prospecao//PT");
  lines.push("CALSCALE:GREGORIAN");
  lines.push(`X-WR-CALNAME:${escapeText(calendarName)}`);

  for (const lead of leads) {
    if (!lead.start_date) continue;
    lines.push(...leadToVEvent(lead, hostUrl));
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
