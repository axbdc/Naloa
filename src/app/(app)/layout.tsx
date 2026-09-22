import Link from "next/link";
import LogoutButton from "./logout-button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f5f2] text-[#171916]">
      <header className="border-b-[3px] border-[#171916] bg-[#f4f5f2]">
        <div className="max-w-[1080px] mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-baseline gap-3">
            <span className="font-semibold tracking-wide text-lg">naloa</span>
            <span className="text-xs uppercase tracking-[0.1em] text-[#565b53]">Radar de Prospeção</span>
          </div>
          <nav className="flex items-center gap-1 bg-[#eceee9] border border-[#d8dbd3] rounded-full p-1">
            <Link
              href="/leads"
              className="px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white transition-colors"
            >
              Leads
            </Link>
            <Link
              href="/calendario"
              className="px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white transition-colors"
            >
              Calendário
            </Link>
          </nav>
          <LogoutButton />
        </div>
      </header>
      <main className="max-w-[1080px] mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
