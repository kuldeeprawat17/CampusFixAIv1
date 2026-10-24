"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard, RefreshCw, Flame, Users, CopyCheck, Timer, CircleDot,
  Hammer, CheckCircle2, MapPin, Repeat2, Loader2, ArrowRight, HardHat, GraduationCap,
} from "lucide-react";
import type { EnrichedTicket, HotspotStats } from "@/lib/types";
import { useRole, timeAgo } from "@/lib/useStudent";
import { StatusChip, PriorityChip, ScoreDial } from "@/components/ui";
import { BuildingChart, CategoryChart } from "@/components/HotspotCharts";

export default function DashboardPage() {
  const [role, setRole] = useRole();
  const [tickets, setTickets] = useState<EnrichedTicket[]>([]);
  const [stats, setStats] = useState<HotspotStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState("open");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, sRes] = await Promise.all([fetch("/api/tickets"), fetch("/api/stats")]);
      const tData = await tRes.json();
      const sData = await sRes.json();
      setTickets(tData.tickets ?? []);
      setStats(sData.stats ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(t);
  }, [message]);

  async function moveStatus(id: number, status: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setMessage(status === "resolved" ? "Marked resolved — students can now verify the repair." : "Status updated.");
        await load();
      }
    } finally {
      setBusyId(null);
    }
  }

  const queue = useMemo(() => {
    let list = tickets;
    if (filter === "open") list = list.filter((t) => t.status !== "resolved");
    else if (filter !== "all") list = list.filter((t) => t.status === filter);
    return [...list].sort((a, b) => b.score.total - a.score.total);
  }, [tickets, filter]);

  const kpis = stats
    ? [
        { label: "Open tickets", value: stats.totals.open + stats.totals.inProgress, Icon: CircleDot, color: "text-signal" },
        { label: "Duplicates avoided", value: stats.totals.duplicatesAvoided, Icon: CopyCheck, color: "text-violet-600" },
        { label: "Students engaged", value: stats.totals.studentsEngaged, Icon: Users, color: "text-sky-700" },
        { label: "Avg resolution", value: stats.totals.avgResolutionHours !== null ? `${stats.totals.avgResolutionHours}h` : "—", Icon: Timer, color: "text-fix" },
      ]
    : [];

  return (
    <div className="grid-paper min-h-full">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-signal font-semibold">Operations view</p>
            <h1 className="font-display font-extrabold text-4xl tracking-tight mt-2 flex items-center gap-3">
              <LayoutDashboard className="w-9 h-9 text-signal" /> Staff dashboard
            </h1>
            <p className="text-ink-soft mt-2">Prioritized by Campus Impact Score. Hotspots reveal recurring problems, not just incidents.</p>
          </div>
          <div className="flex items-center gap-2">
            {role !== "staff" ? (
              <button
                onClick={() => setRole("staff")}
                className="inline-flex items-center gap-2 bg-navy hover:bg-signal text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors"
              >
                <HardHat className="w-4 h-4" /> Enable staff actions
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm font-bold text-fix bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg">
                <HardHat className="w-4 h-4" /> Staff mode active
              </span>
            )}
            <button onClick={load} className="inline-flex items-center gap-2 border border-ink/15 bg-white hover:border-signal text-sm font-bold px-4 py-2.5 rounded-lg transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {kpis.map((k, i) => (
            <div key={k.label} className="bg-card border border-ink/10 rounded-xl p-5 hover:shadow-md transition-shadow animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
              <k.Icon className={`w-6 h-6 ${k.color}`} />
              <p className="font-mono text-3xl font-semibold mt-3">{k.value}</p>
              <p className="text-xs text-ink-soft mt-1 font-medium">{k.label}</p>
            </div>
          ))}
          {!stats && loading && (
            <div className="col-span-4 py-10 text-center"><Loader2 className="w-7 h-7 animate-spin text-signal mx-auto" /></div>
          )}
        </div>

        {/* charts + hotspots */}
        <div className="grid lg:grid-cols-3 gap-5 mt-6">
          <div className="bg-card border border-ink/10 rounded-xl p-6 lg:col-span-1">
            <h2 className="font-display font-bold text-lg">Tickets by building</h2>
            <p className="text-xs text-ink-soft mb-4">Open vs resolved — where is the backlog?</p>
            <div className="h-64">{stats && <BuildingChart data={stats.byBuilding} />}</div>
          </div>
          <div className="bg-card border border-ink/10 rounded-xl p-6">
            <h2 className="font-display font-bold text-lg">Issue categories</h2>
            <p className="text-xs text-ink-soft mb-4">What breaks most often</p>
            <div className="h-64">{stats && <CategoryChart data={stats.byCategory} />}</div>
          </div>
          <div className="bg-navy text-white rounded-xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 grid-paper-dark" />
            <div className="relative">
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                <Flame className="w-5 h-5 text-signal" /> Problem hotspots
              </h2>
              <p className="text-xs text-white/50 mb-4">Locations with repeated tickets — investigate the pattern.</p>
              <div className="space-y-3">
                {stats?.hotspots.length === 0 && (
                  <p className="text-sm text-white/50">No repeat locations yet. Hotspots appear when the same room + category is reported more than once.</p>
                )}
                {stats?.hotspots.map((h, i) => (
                  <div key={`${h.building}${h.room}${h.category}`} className="bg-white/8 border border-white/12 rounded-lg p-3 hover:bg-white/12 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-signal font-semibold">#{i + 1}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold bg-signal/20 text-orange-200 px-2 py-0.5 rounded">
                        <Repeat2 className="w-3 h-3" /> ×{h.ticketCount} tickets
                      </span>
                    </div>
                    <p className="text-sm font-bold mt-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-signal" />
                      {h.building.split(" — ")[0]}{h.room ? ` · ${h.room}` : ""}
                    </p>
                    <p className="text-xs text-white/55 mt-0.5">{h.category} · latest {h.latestCode}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* priority queue */}
        <div className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display font-extrabold text-2xl tracking-tight">Priority queue</h2>
            <div className="flex flex-wrap gap-2">
              {([
                ["open", "Open"],
                ["reported", "Reported"],
                ["in_progress", "In Progress"],
                ["resolved", "Resolved"],
                ["all", "All"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === key ? "bg-navy text-white" : "bg-white border border-ink/10 text-ink-soft hover:border-signal"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 bg-card border border-ink/10 rounded-xl overflow-hidden">
            {queue.length === 0 ? (
              <p className="p-10 text-center text-sm text-ink-soft">Queue is clear for this filter. 🎉</p>
            ) : (
              <div className="divide-y divide-ink/8">
                {queue.map((t) => (
                  <div key={t.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-paper/60 transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <ScoreDial score={t.score} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] text-ink-soft">{t.code}</span>
                          <StatusChip status={t.status} />
                          <PriorityChip priority={t.score.priority} />
                          {t.status === "resolved" && t.confirmedCount > 0 && (
                            <span className="text-[11px] font-bold text-fix">✓ {t.confirmedCount} verified</span>
                          )}
                          {t.stillBrokenCount > 0 && t.status !== "resolved" && (
                            <span className="text-[11px] font-bold text-red-700">✕ reopened after failed verification</span>
                          )}
                        </div>
                        <Link href={`/tickets/${t.id}`} className="font-display font-bold text-sm sm:text-base mt-0.5 block hover:text-signal transition-colors truncate">
                          {t.title}
                        </Link>
                        <p className="text-xs text-ink-soft mt-0.5 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{t.building.split(" — ")[0]}{t.room ? ` · ${t.room}` : ""}</span>
                          <span>· {t.affectedCount} affected</span>
                          <span>· {timeAgo(t.createdAt)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 sm:justify-end">
                      {role === "staff" ? (
                        <>
                          {t.status === "reported" && (
                            <button
                              onClick={() => moveStatus(t.id, "in_progress")}
                              disabled={busyId === t.id}
                              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Hammer className="w-3.5 h-3.5" /> Start work
                            </button>
                          )}
                          {t.status === "in_progress" && (
                            <button
                              onClick={() => moveStatus(t.id, "resolved")}
                              disabled={busyId === t.id}
                              className="inline-flex items-center gap-1.5 bg-fix hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark resolved
                            </button>
                          )}
                          {t.status === "resolved" && (
                            <span className="text-xs font-semibold text-ink-soft italic">awaiting student verification</span>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-ink-soft inline-flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" /> read-only
                        </span>
                      )}
                      <Link href={`/tickets/${t.id}`} className="grid place-items-center w-8 h-8 rounded-lg border border-ink/15 hover:border-signal hover:text-signal transition-colors" aria-label={`Open ${t.code}`}>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-ink-soft mt-3">
            Scores are computed from documented rules (S + A + R + T). Staff can override severity on any ticket page — the human always decides.
          </p>
        </div>
      </div>

      {message && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-navy text-white text-sm font-semibold px-5 py-3 rounded-lg shadow-2xl animate-fade-up z-50">
          {message}
        </div>
      )}
    </div>
  );
}