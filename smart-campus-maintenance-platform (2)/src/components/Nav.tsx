"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench, ClipboardPen, ListChecks, LayoutDashboard, GraduationCap, HardHat, Home } from "lucide-react";
import { useRole } from "@/lib/useStudent";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/report", label: "Report Issue", icon: ClipboardPen },
  { href: "/tickets", label: "Live Tickets", icon: ListChecks },
  { href: "/dashboard", label: "Staff Dashboard", icon: LayoutDashboard },
];

export default function Nav() {
  const pathname = usePathname();
  const [role, setRole] = useRole();

  return (
    <header className="sticky top-0 z-50 bg-navy text-white shadow-lg shadow-navy/20">
      <div className="hazard h-1" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3 h-16">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <span className="grid place-items-center w-9 h-9 bg-signal rounded-md group-hover:rotate-12 transition-transform duration-300">
            <Wrench className="w-5 h-5 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-display font-extrabold tracking-tight text-lg leading-none">
            CAMPUSFIX <span className="text-signal">AI</span>
            <span className="block text-[10px] font-body font-medium text-white/50 tracking-[0.18em] mt-0.5">
              REPORT LESS · RESOLVE SMARTER
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active ? "bg-white/12 text-white" : "text-white/65 hover:text-white hover:bg-white/8"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div
          className="flex items-center bg-white/10 rounded-lg p-1 text-xs font-semibold"
          role="group"
          aria-label="Switch role"
          title="Demo mode switch — students report & verify, staff triage & resolve"
        >
          <button
            onClick={() => setRole("student")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all ${
              role === "student" ? "bg-signal text-white shadow" : "text-white/60 hover:text-white"
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Student
          </button>
          <button
            onClick={() => setRole("staff")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all ${
              role === "staff" ? "bg-signal text-white shadow" : "text-white/60 hover:text-white"
            }`}
          >
            <HardHat className="w-4 h-4" /> Staff
          </button>
        </div>
      </div>

      {/* mobile nav */}
      <nav className="md:hidden flex border-t border-white/10 overflow-x-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium whitespace-nowrap ${
                active ? "text-signal bg-white/5" : "text-white/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}