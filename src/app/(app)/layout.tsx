import AppHeader from "./app-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-ink)]">
      <AppHeader />
      <main className="max-w-[1080px] mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
