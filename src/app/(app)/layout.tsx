import AppHeader from "./app-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f5f2] text-[#171916]">
      <AppHeader />
      <main className="max-w-[1080px] mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
