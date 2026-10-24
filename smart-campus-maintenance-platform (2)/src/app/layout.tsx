import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "CampusFix AI — Report Less. Resolve Smarter.",
  description:
    "A smart campus maintenance platform: one problem, one ticket. Duplicate detection, community impact scores, hotspots and verified repairs.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="bg-navy text-white/70 mt-auto">
          <div className="hazard h-1.5" />
          <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-6 md:items-center justify-between">
            <div>
              <p className="font-display text-white text-lg tracking-tight font-extrabold">
                CAMPUSFIX <span className="text-signal">AI</span>
              </p>
              <p className="text-sm mt-1">Report less. Resolve smarter.</p>
            </div>
            <p className="text-xs max-w-xl leading-relaxed">
              Prototype note: triage, duplicate detection and impact scoring are transparent rule-based
              heuristics — not a connected language model. Weights are design choices, documented in the UI.
              Staff always keep final control over priority and status.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}