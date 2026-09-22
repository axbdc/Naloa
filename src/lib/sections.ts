export interface SectionMeta {
  key: string;
  label: string;
  tag: string;
  note: string;
}

export const sections: SectionMeta[] = [
  { key: "motorsport", label: "Motorsport", tag: "evento datado",
    note: "A tua maior vantagem: acesso MEDIA FPAK. Automóveis primeiro, sempre — portfolio já feito desde 2021." },
  { key: "crosssell", label: "Cross-sell auto/moto", tag: "pitch recorrente",
    note: "Leads já prospetados para web — segunda conversa fácil, contacto já existe." },
  { key: "feiras", label: "Feiras B2B — conteúdo para expositores", tag: "evento datado",
    note: "As feiras grandes e conhecidas já têm cobertura oficial fechada com agências — baixa prioridade. As feiras pequenas da Exponor são onde os expositores individuais normalmente não têm ninguém a fazer conteúdo próprio." },
  { key: "imobiliario", label: "Imobiliário de luxo", tag: "pitch recorrente",
    note: "Sem feiras no calendário até dezembro. A oportunidade é conteúdo fixo por imóvel, não evento." },
  { key: "barcos", label: "Barcos / iates", tag: "pitch recorrente",
    note: "Mesma lógica do imobiliário: conteúdo por anúncio." },
  { key: "vinhos", label: "Vinhos & gastronomia", tag: "misto",
    note: "O que resta na janela é pequena escala e tradição local — mercados de Natal são grandes e saturados." },
  { key: "hoteis", label: "Congressos médicos em hotéis", tag: "evento datado",
    note: "Patrocinadores farmacêuticos com orçamento, sem fotógrafo dedicado, quase ninguém a competir." },
  { key: "outros", label: "Moda / tecnologia / hotelaria / música", tag: "exploratório",
    note: "Pouco de concreto para out–dez além do que já está listado acima." },
  { key: "continental", label: "Portugal Continental — fins de semana", tag: "evento datado",
    note: "Vale a pena se o pagamento/prestígio cobrir viagem + estadia e ainda sobrar lucro." },
  { key: "manual", label: "Adicionados por ti", tag: "novo",
    note: "Eventos que criaste diretamente no calendário." },
];

export function sectionMeta(key: string): SectionMeta {
  return sections.find((s) => s.key === key) ?? { key, label: key, tag: "", note: "" };
}

export const STATUS_LABELS: Record<string, string> = {
  todo: "Por contactar",
  contactado: "Contactado",
  fechado: "Fechado",
};

export const STATUS_ORDER = ["todo", "contactado", "fechado"] as const;
