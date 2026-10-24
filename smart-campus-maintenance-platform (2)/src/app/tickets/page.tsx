"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ListChecks, Search, SlidersHorizontal, RefreshCw, ClipboardPen, Loader2 } from "lucide-react";
import type { EnrichedTicket } from "@/lib/types";
import { BUILDINGS, CATEGORIES } from "@/lib/triage";
import { useStudentId } from "@/lib/useStudent";
import TicketCard from "@/components/TicketCard";

export default function TicketsPage() {
  const studentId = useStudentId();
  const [tickets, setTickets] = useState<EnrichedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [building, setBuilding] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"score" | "newest" | "affected">("score");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets?viewer=${studentId}`);
      const data = await res.json();
      setTickets(data.tickets ?? []);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  async function support(id: number) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/tickets/${id}/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setTickets((prev) => prev.map((t) => (t.id === id ? data.ticket : t)));
        setToast(data.supported ? "Support added — the impact score just updated." : "Support removed.");
      } else {
        setToast(data.error ?? "Could not update support.");
      }
    } finally {
      setBusyId(null);
    }
  }

  const filtered = useMemo(() => {
    let list = tickets;
    if (status !== "all") list = list.filter((t) => t.status === status);
    if (category !== "all") list = list.filter((t) => t.category === category);
    if (building !== "all") list = list.filter((t) => t.building === building);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((t) =>
        `${t.title} ${t.description} ${t.code} ${t.room}`.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "score") return b.score.total - a.score.total;
      if (sort === "affected") return b.affectedCount - a.affectedCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tickets, status, category, building, query, sort]);

  const counts = useMemo(() => ({
    all: tickets.length,
    reported: tickets.filter((t) => t.status === "reported").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  }), [tickets]);

  const selectCls = "rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal/50";

  return (
    <div className="grid-paper min-h-full">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-signal font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-fix animate-blink" /> Live board
            </p>
            <h1 className="font-display font-extrabold text-4xl tracking-tight mt-2 flex items-center gap-3">
              <ListChecks className="w-9 h-9 text-signal" /> Campus tickets
            </h1>
            <p className="text-ink-soft mt-2">Affected by the same problem? Support the ticket instead of filing a new one.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="inline-flex items-center gap-2 border border-ink/15 bg-white hover:border-signal text-sm font-bold px-4 py-2.5 rounded-lg transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Link href="/report" className="inline-flex items-center gap-2 bg-signal hover:bg-signal-deep text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors">
              <ClipboardPen className="w-4 h-4" /> New report
            </Link>
          </div>
        </div>

        {/* status tabs */}
        <div className="flex flex-wrap gap-2 mt-8">
          {([
            ["all", "All"],
            ["reported", "Reported"],
            ["in_progress", "In Progress"],
            ["resolved", "Resolved"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatus(key)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                status === key ? "bg-navy text-white shadow" : "bg-white border border-ink/10 text-ink-soft hover:border-signal"
              }`}
            >
              {label} <span className="font-mono opacity-60 ml-1">{counts[key]}</span>
            </button>
          ))}
        </div>

        {/* filters */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-52">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, room or ticket ID…"
              className="w-full rounded-lg border border-ink/15 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal/50"
            />
          </div>
          <select value={building} onChange={(e) => setBuilding(e.target.value)} className={selectCls} aria-label="Filter by building">
            <option value="all">All buildings</option>
            {BUILDINGS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls} aria-label="Filter by category">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="inline-flex items-center gap-2 text-sm text-ink-soft">
            <SlidersHorizontal className="w-4 h-4" />
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={selectCls} aria-label="Sort tickets">
              <option value="score">Highest impact</option>
              <option value="affected">Most affected</option>
              <option value="newest">Newest first</option>
            </select>
          </label>
        </div>

        {/* board */}
        {loading && tickets.length === 0 ? (
          <div className="mt-16 text-center text-ink-soft">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-signal" />
            <p className="mt-3 text-sm">Loading the board…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 text-center bg-card border border-dashed border-ink/20 rounded-xl p-12">
            <ListChecks className="w-10 h-10 text-ink/20 mx-auto" />
            <p className="font-display font-bold text-xl mt-3">No tickets match</p>
            <p className="text-sm text-ink-soft mt-1">Try clearing filters — or report the first issue in this area.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5 mt-8">
            {filtered.map((t, i) => (
              <div key={t.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
                <TicketCard ticket={t} studentId={studentId} onSupport={support} busy={busyId === t.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-navy text-white text-sm font-semibold px-5 py-3 rounded-lg shadow-2xl animate-fade-up z-50">
          {toast}
        </div>
      )}
    </div>
  );
}