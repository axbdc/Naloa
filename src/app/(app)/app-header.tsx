"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import LogoutButton from "./logout-button";

export default function AppHeader() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "/leads", label: "Leads" },
    { href: "/calendario", label: "Calendário" },
  ];

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-xl bg-[#f4f5f2]/80 transition-shadow duration-300 ${
        scrolled ? "shadow-[0_1px_0_0_rgba(23,25,22,0.12)]" : ""
      }`}
    >
      <div className="max-w-[1080px] mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3">
          <span className="font-semibold tracking-wide text-lg">naloa</span>
          <span className="text-xs uppercase tracking-[0.1em] text-[#565b53]">Radar de Prospeção</span>
        </div>
        <nav className="relative flex items-center gap-1 bg-[#eceee9] border border-[#d8dbd3] rounded-full p-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  active ? "text-[#171916]" : "text-[#565b53] hover:text-[#171916]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-highlight"
                    className="absolute inset-0 -z-10 bg-white rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
                {link.label}
              </Link>
            );
          })}
        </nav>
        <LogoutButton />
      </div>
    </header>
  );
}
