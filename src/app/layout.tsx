import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Naloa · Radar de Prospeção",
  description: "Tabela de leads e calendário privado da Naloa.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
