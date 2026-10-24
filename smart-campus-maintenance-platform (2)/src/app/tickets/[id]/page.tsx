"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, User, Users, HandHeart, Check, Loader2, ShieldAlert,
  Sparkles, BadgeCheck, ThumbsDown, CircleDot, Hammer, CheckCircle2, HardHat, Repeat2, Wrench,
} from "lucide-react";
import type { EnrichedTicket } from "@/lib/types";
import { useStudentId, useRole, timeAgo } from "@/lib/useStudent";
import { StatusChip, PriorityChip, ScoreDial, ScoreBreakdown, SeverityTag } from "@/components/ui";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const studentId = useStudentId();
  const [role] = useRole();
  const [ticket, setTicket] = useState<EnrichedTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!studentId || !id) return;
    const res = await fetch(`/api/tickets/${id}?viewer=${studentId}`);
    if (res.ok) {
      const data = await res.json();
      setTicket(data.ticket);
      setNote(data.ticket.resolutionNote ?? "");
    }
    setLoading(false);
  }, [id, studentId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 3500);
    return () => clearTimeout(t);
  }, [message]);

  async function support() {
    setBusy(true);
    try {
      const res = await fetch(`/api/tickets/${id}/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setTicket(data.ticket);
        setMessage(data.supported ? "You're counted as affected — score updated." : "Support removed.");
      } else setMessage(data.error);
    } finally { setBusy(false); }
  }

  async function verify(verdict: "confirmed" | "still_broken") {
    setBusy(true);
    try {
      const res = await fetch(`/api/tickets/${id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, verdict }),
      });
      const data = await res.json();
      if (res.ok) {
        setTicket(data.ticket);
        setMessage(
          data.reopened
            ? "Thanks — the ticket was reopened and sent back to the maintenance queue."
            : "Repair confirmed. Thanks for closing the loop!"
        );
      } else setMessage(data.error);
    } finally { setBusy(false); }
  }

  async function patch(body: Record<string, unknown>, msg: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) { setTicket(data.ticket); setMessage(msg); }
      else setMessage(data.error);
    } finally { setBusy(false); }
  }

  if (loading || !studentId) {
    return (
      <div className="grid place-items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-signal" />
      </div>
    );
  }
  if (!ticket) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <p className="font-display font-bold text-2xl">Ticket not found</p>
        <Link href="/tickets" className="text-signal font-bold mt-3 inline-block">← Back to the board</Link>
      </div>
    );
  }

  const t = ticket;
  const mine = t.reporterId === studentId;
  const timeline = [
    { label: "Reported", done: true, Icon: CircleDot, when: t.createdAt },
    { label: "In Progress", done: t.status === "in_progress" || t.status === "resolved", Icon: Hammer, when: t.status !== "reported" ? t.updatedAt : null },
    { label: "Resolved", done: t.status === "resolved", Icon: CheckCircle2, when: t.resolvedAt },
  ];

  return (
    <div className="grid-paper min-h-full">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link href="/tickets" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:text-signal transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to live board
        </Link>

        {/* header stub */}
        <div className="mt-4 bg-card rounded-xl border border-ink/10 shadow-sm overflow-hidden">
          {t.score.priority === "Critical" && t.status !== "resolved" && <div className="hazard h-2" />}
          <div className="p-7 flex flex-col sm:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-sm text-ink-soft">{t.code}</span>
                <StatusChip status={t.status} />
                <SeverityTag severity={t.severity} />
                {t.recurrenceCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded">
                    <Repeat2 className="w-3 h-3" /> recurring location ×{t.recurrenceCount + 1}
                  </span>
                )}
              </div>
              <h1 className="font-display font-extrabold text-3xl tracking-tight mt-2">{t.title}</h1>
              <p className="text-ink-soft mt-3 leading-relaxed">{t.description}</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-ink-soft flex-wrap">
                <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {t.building}{t.room ? ` · ${t.room}` : ""}</span>
                <span className="px-2 py-0.5 bg-ink/5 rounded font-medium text-xs">{t.category}</span>
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-4 h-4" /> {t.anonymous ? "Anonymous student" : t.reporterName || "Student"}{mine ? " (you)" : ""}
                </span>
                <span>{timeAgo(t.createdAt)}</span>
              </div>
              {t.triageReason && (
                <p className="mt-4 text-xs bg-navy/5 border border-navy/10 rounded-lg px-3 py-2 text-ink-soft inline-flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-signal mt-0.5 shrink-0" />
                  <span><strong>Smart triage:</strong> {t.triageReason}</span>
                </p>
              )}
            </div>
            <div className="perforated sm:pl-6 flex sm:flex-col items-center justify-center gap-3 shrink-0">
              <ScoreDial score={t.score} size="lg" />
              <PriorityChip priority={t.score.priority} />
              <p className="text-[11px] text-ink-soft text-center">Campus Impact Score</p>
            </div>
          </div>

          {/* timeline + support bar */}
          <div className="px-7 py-4 bg-paper/70 border-t border-ink/8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-0">
              {timeline.map((s, i) => (
                <div key={s.label} className="flex items-center">
                  {i > 0 && <div className={`w-8 sm:w-14 h-0.5 ${s.done ? "bg-fix" : "bg-ink/15"}`} />}
                  <div className="flex items-center gap-1.5">
                    <s.Icon className={`w-4 h-4 ${s.done ? "text-fix" : "text-ink/25"}`} />
                    <span className={`text-xs font-bold ${s.done ? "text-ink" : "text-ink/35"}`}>{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft">
                <Users className="w-4 h-4" /> {t.affectedCount} affected
              </span>
              {!mine && t.status !== "resolved" && (
                <button
                  onClick={support}
                  disabled={busy}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${
                    t.supportedByMe ? "bg-fix text-white" : "bg-navy text-white hover:bg-signal"
                  }`}
                >
                  {t.supportedByMe ? <Check className="w-4 h-4" /> : <HandHeart className="w-4 h-4" />}
                  {t.supportedByMe ? "You're affected" : "I'm affected too"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 mt-6 items-start">
          <div className="space-y-6">
            {/* verification */}
            {t.status === "resolved" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                <p className="flex items-center gap-2 font-display font-bold text-lg text-emerald-900">
                  <BadgeCheck className="w-5 h-5" /> Verify before closing
                </p>
                {t.resolutionNote && (
                  <p className="mt-3 text-sm bg-white border border-emerald-200 rounded-lg px-4 py-3">
                    <Wrench className="w-4 h-4 inline mr-1.5 text-fix" />
                    <strong>Staff repair note:</strong> {t.resolutionNote}
                  </p>
                )}
                <p className="text-sm text-emerald-900/80 mt-3">
                  Staff marked this resolved {t.resolvedAt ? timeAgo(t.resolvedAt) : ""}. Is the problem actually fixed?
                </p>
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    onClick={() => verify("confirmed")}
                    disabled={busy}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${
                      t.myVerdict === "confirmed" ? "bg-fix text-white ring-2 ring-fix/40" : "bg-white border border-emerald-300 text-fix hover:bg-fix hover:text-white"
                    }`}
                  >
                    <BadgeCheck className="w-4 h-4" /> Yes, it's fixed
                  </button>
                  <button
                    onClick={() => verify("still_broken")}
                    disabled={busy}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold bg-white border border-red-300 text-red-700 hover:bg-red-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                  >
                    <ThumbsDown className="w-4 h-4" /> Still broken — reopen
                  </button>
                </div>
                <p className="text-xs text-emerald-900/60 mt-3">
                  {t.confirmedCount} confirmation{t.confirmedCount === 1 ? "" : "s"} · {t.stillBrokenCount} “still broken” report{t.stillBrokenCount === 1 ? "" : "s"}
                </p>
              </div>
            )}

            {/* reopened notice */}
            {t.status === "in_progress" && t.stillBrokenCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-900 flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <span>
                  <strong>Verification failed:</strong> {t.stillBrokenCount} student{t.stillBrokenCount > 1 ? "s" : ""} reported
                  the problem still exists, so this ticket was reopened automatically.
                </span>
              </div>
            )}

            {/* staff panel */}
            {role === "staff" && (
              <div className="bg-card border-2 border-navy/20 rounded-xl p-6">
                <p className="flex items-center gap-2 font-display font-bold text-lg">
                  <HardHat className="w-5 h-5 text-signal" /> Staff controls
                  <span className="text-[10px] font-mono uppercase tracking-wider bg-navy text-white px-2 py-0.5 rounded ml-1">staff mode</span>
                </p>
                <div className="mt-4">
                  <p className="text-xs font-bold text-ink-soft uppercase tracking-wide">Move status</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {([
                      ["reported", "Reported", CircleDot],
                      ["in_progress", "In Progress", Hammer],
                      ["resolved", "Resolved", CheckCircle2],
                    ] as const).map(([s, label, Icon]) => (
                      <button
                        key={s}
                        onClick={() => patch({ status: s, resolutionNote: s === "resolved" ? note : undefined }, `Status moved to ${label}.`)}
                        disabled={busy || t.status === s}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:cursor-not-allowed ${
                          t.status === s
                            ? "bg-navy text-white"
                            : "bg-paper border border-ink/15 hover:border-signal hover:text-signal"
                        }`}
                      >
                        <Icon className="w-4 h-4" /> {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-xs font-bold text-ink-soft uppercase tracking-wide">Repair note (shown to students when resolved)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    placeholder="e.g. Replaced fan capacitor, tested at full speed."
                    className="mt-1.5 w-full rounded-lg border border-ink/15 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal/50 resize-none"
                  />
                  <button
                    onClick={() => patch({ resolutionNote: note }, "Repair note saved.")}
                    disabled={busy}
                    className="mt-2 text-sm font-bold text-navy hover:text-signal underline underline-offset-2 disabled:opacity-50"
                  >
                    Save note
                  </button>
                </div>
                <div className="mt-4">
                  <label className="text-xs font-bold text-ink-soft uppercase tracking-wide">Override severity (triage suggests, staff decides)</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["low", "moderate", "high", "critical"].map((s) => (
                      <button
                        key={s}
                        onClick={() => patch({ severity: s }, `Severity set to ${s}.`)}
                        disabled={busy || t.severity === s}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                          t.severity === s ? "bg-signal text-white" : "bg-paper border border-ink/15 hover:border-signal"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {role !== "staff" && (
              <p className="text-xs text-ink-soft bg-card border border-dashed border-ink/15 rounded-lg px-4 py-3">
                <HardHat className="w-3.5 h-3.5 inline mr-1" />
                Maintenance staff? Switch to <strong>Staff</strong> mode in the top bar to update status, severity and repair notes.
              </p>
            )}
          </div>

          {/* score explanation */}
          <div className="bg-card rounded-xl border border-ink/10 p-6 lg:sticky lg:top-24">
            <p className="font-display font-bold text-lg">Why this priority?</p>
            <p className="text-xs text-ink-soft mt-1 mb-5">
              Every point is explainable — safety alone can make an issue urgent.
            </p>
            <ScoreBreakdown score={t.score} />
          </div>
        </div>
      </div>

      {message && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-navy text-white text-sm font-semibold px-5 py-3 rounded-lg shadow-2xl animate-fade-up z-50 max-w-md text-center">
          {message}
        </div>
      )}
    </div>
  );
}