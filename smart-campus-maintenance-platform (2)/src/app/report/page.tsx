"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ClipboardPen, Sparkles, CopyCheck, MapPin, HandHeart, ArrowRight,
  ShieldAlert, EyeOff, Loader2, CheckCircle2, ScanSearch, FilePlus2,
} from "lucide-react";
import { BUILDINGS, CATEGORIES, type TriageResult } from "@/lib/triage";
import type { DuplicateSuggestion, EnrichedTicket } from "@/lib/types";
import { useStudentId } from "@/lib/useStudent";
import { StatusChip, SeverityTag } from "@/components/ui";

export default function ReportPage() {
  const studentId = useStudentId();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [building, setBuilding] = useState<string>(BUILDINGS[1]);
  const [room, setRoom] = useState("");
  const [category, setCategory] = useState("auto");
  const [anonymous, setAnonymous] = useState(false);
  const [name, setName] = useState("");

  const [suggestion, setSuggestion] = useState<TriageResult | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateSuggestion[]>([]);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<EnrichedTicket | null>(null);
  const [joined, setJoined] = useState<{ code: string; id: number } | null>(null);
  const [dismissedDupes, setDismissedDupes] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live triage + duplicate check (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (title.trim().length < 4 && description.trim().length < 4) {
      setSuggestion(null);
      setDuplicates([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await fetch("/api/triage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, building, room, category }),
        });
        const data = await res.json();
        setSuggestion(data.suggestion);
        setDuplicates(data.duplicates ?? []);
        setDismissedDupes(false);
      } catch {
        /* preview is best-effort */
      } finally {
        setChecking(false);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [title, description, building, room, category]);

  async function submit(force = false) {
    setError("");
    if (!title.trim() || !description.trim()) {
      setError("Please add a title and a short description.");
      return;
    }
    if (duplicates.length > 0 && !force && !dismissedDupes) {
      setError("A similar open ticket exists — support it above, or confirm this is a different problem.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, building, room, category, anonymous, reporterName: name, reporterId: studentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setCreated(data.ticket);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function supportExisting(id: number, code: string) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/tickets/${id}/support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not support this ticket");
      setJoined({ code, id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  // ── success states ──
  if (created || joined) {
    const t = created;
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 animate-fade-up">
        <div className="bg-card rounded-xl border border-ink/10 shadow-lg overflow-hidden">
          <div className="h-2 bg-fix" />
          <div className="p-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-fix mx-auto" strokeWidth={1.5} />
            <h1 className="font-display font-extrabold text-3xl mt-4">
              {t ? "Ticket created!" : "You joined an existing ticket"}
            </h1>
            <p className="text-ink-soft mt-2">
              {t ? (
                <>Your work order <span className="font-mono font-semibold text-ink">{t.code}</span> is now on the board with an impact score of <strong>{t.score.total}/100</strong>.</>
              ) : (
                <>No duplicate created — your support was added to <span className="font-mono font-semibold text-ink">{joined!.code}</span>. That's One Problem, One Ticket in action.</>
              )}
            </p>
            {t?.triageReason && (
              <p className="mt-4 text-sm bg-paper rounded-lg px-4 py-3 text-ink-soft">
                <Sparkles className="w-4 h-4 inline mr-1 text-signal" />
                Smart triage: {t.triageReason}
              </p>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={`/tickets/${t ? t.id : joined!.id}`} className="inline-flex items-center gap-2 bg-navy hover:bg-signal text-white font-bold px-5 py-3 rounded-lg transition-colors">
                Track this ticket <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => { setCreated(null); setJoined(null); setTitle(""); setDescription(""); setRoom(""); }}
                className="inline-flex items-center gap-2 border border-ink/15 hover:border-signal text-ink font-bold px-5 py-3 rounded-lg transition-colors"
              >
                <FilePlus2 className="w-4 h-4" /> Report another issue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const showDupes = duplicates.length > 0 && !dismissedDupes;

  return (
    <div className="grid-paper min-h-full">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-signal font-semibold">Step 01 · Report</p>
        <h1 className="font-display font-extrabold text-4xl tracking-tight mt-2">Report a campus issue</h1>
        <p className="text-ink-soft mt-2 max-w-xl">
          As you type, smart triage suggests a category and checks for existing tickets at the same spot.
        </p>

        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 mt-8 items-start">
          {/* form */}
          <form
            className="bg-card rounded-xl border border-ink/10 shadow-sm p-7 space-y-5"
            onSubmit={(e) => { e.preventDefault(); submit(); }}
          >
            <div>
              <label htmlFor="title" className="text-sm font-bold flex items-center gap-1.5">
                <ClipboardPen className="w-4 h-4 text-signal" /> Problem title
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ceiling fan not working in C-204"
                className="mt-1.5 w-full rounded-lg border border-ink/15 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal transition"
                maxLength={120}
              />
            </div>
            <div>
              <label htmlFor="desc" className="text-sm font-bold">Description</label>
              <textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's wrong? Any safety concern, e.g. sparks or water near sockets? The triage system reads these keywords."
                rows={4}
                className="mt-1.5 w-full rounded-lg border border-ink/15 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-signal/50 focus:border-signal transition resize-none"
                maxLength={1000}
              />
              <p className="text-[11px] text-ink-soft mt-1">Tip: mention words like “leaking”, “spark”, “wifi” — they drive category & safety detection.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="building" className="text-sm font-bold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-signal" /> Building
                </label>
                <select
                  id="building"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-ink/15 px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-signal/50"
                >
                  {BUILDINGS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="room" className="text-sm font-bold">Room / location</label>
                <input
                  id="room"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. C-204, 2nd floor corridor"
                  className="mt-1.5 w-full rounded-lg border border-ink/15 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-signal/50 transition"
                  maxLength={60}
                />
              </div>
            </div>
            <div>
              <label htmlFor="category" className="text-sm font-bold">Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-ink/15 px-3 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-signal/50"
              >
                <option value="auto">✨ Let smart triage decide{suggestion ? ` → ${suggestion.category}` : ""}</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center pt-1">
              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="w-4 h-4 accent-[#e85d04]"
                />
                <EyeOff className="w-4 h-4 text-ink-soft" /> Submit anonymously
              </label>
              {!anonymous && (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="flex-1 rounded-lg border border-ink/15 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-signal/50 transition"
                  maxLength={60}
                />
              )}
            </div>
            {error && (
              <p className="text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting || !studentId}
              className="w-full inline-flex justify-center items-center gap-2 bg-signal hover:bg-signal-deep text-white font-bold px-6 py-4 rounded-lg transition-all active:scale-[0.99] disabled:opacity-60 shadow-lg shadow-signal/25"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ClipboardPen className="w-5 h-5" />}
              {showDupes ? "Check the suggested ticket first" : "Submit report"}
            </button>
          </form>

          {/* live intelligence panel */}
          <div className="space-y-5 lg:sticky lg:top-24">
            {/* triage */}
            <div className="bg-navy text-white rounded-xl p-6 relative overflow-hidden">
              <div className="absolute inset-0 grid-paper-dark" />
              <div className="relative">
                <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-signal font-semibold">
                  <Sparkles className="w-4 h-4" /> Smart triage {checking && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/50" />}
                </p>
                {suggestion ? (
                  <div className="mt-4 animate-fade-up">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-white/10 border border-white/20 rounded px-2.5 py-1 text-sm font-bold">{suggestion.category}</span>
                      <SeverityTag severity={suggestion.severity} />
                    </div>
                    <p className="text-sm text-white/70 mt-3 leading-relaxed">{suggestion.reason}</p>
                    {suggestion.matchedKeywords.length > 0 && (
                      <p className="mt-3 flex flex-wrap gap-1.5">
                        {suggestion.matchedKeywords.map((k) => (
                          <span key={k} className="font-mono text-[11px] bg-signal/20 text-orange-200 border border-signal/40 rounded px-2 py-0.5">“{k}”</span>
                        ))}
                      </p>
                    )}
                    {suggestion.severity === "critical" && (
                      <p className="mt-3 text-xs font-bold text-red-300 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" /> Safety-critical: scores high even with one reporter.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-white/50 mt-4">Start typing a title or description — category, severity and duplicate checks appear here live.</p>
                )}
                <p className="mt-4 pt-3 border-t border-white/10 text-[11px] text-white/40">
                  Rule-based heuristics, not a language model. Staff can override any suggestion.
                </p>
              </div>
            </div>

            {/* duplicates */}
            <div className={`rounded-xl border p-6 transition-colors ${showDupes ? "bg-amber-50 border-amber-300" : "bg-card border-ink/10"}`}>
              <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] font-semibold text-ink-soft">
                <ScanSearch className="w-4 h-4 text-signal" /> Duplicate check
              </p>
              {showDupes ? (
                <div className="mt-4 space-y-4">
                  <p className="text-sm font-bold text-amber-900 flex items-center gap-2">
                    <CopyCheck className="w-5 h-5" /> Looks like this is already reported!
                  </p>
                  {duplicates.map((d) => (
                    <div key={d.ticket.id} className="bg-white rounded-lg border border-amber-200 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-ink-soft">{d.ticket.code}</span>
                        <span className="font-mono text-xs font-bold text-fix">{d.similarity}% match</span>
                      </div>
                      <Link href={`/tickets/${d.ticket.id}`} className="font-display font-bold text-sm mt-1 block hover:text-signal transition-colors">
                        {d.ticket.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-ink-soft flex-wrap">
                        <StatusChip status={d.ticket.status} />
                        <span>{d.ticket.building.split(" — ")[0]} · {d.ticket.room}</span>
                      </div>
                      <ul className="mt-2 space-y-0.5">
                        {d.why.map((w) => (
                          <li key={w} className="text-[11px] text-ink-soft flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-fix" /> {w}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => supportExisting(d.ticket.id, d.ticket.code)}
                        disabled={submitting || !studentId}
                        className="mt-3 w-full inline-flex justify-center items-center gap-2 bg-fix hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60"
                      >
                        <HandHeart className="w-4 h-4" /> I'm affected too — support this ticket
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setDismissedDupes(true); setError(""); }}
                    className="w-full text-xs font-bold text-ink-soft hover:text-signal underline underline-offset-2 transition-colors"
                  >
                    No, this is a different problem — create a new ticket
                  </button>
                </div>
              ) : (
                <p className="text-sm text-ink-soft mt-3">
                  {dismissedDupes
                    ? "Duplicate suggestions dismissed — your new ticket will be created."
                    : duplicates.length === 0 && suggestion
                    ? "✓ No similar open tickets found. This looks like a new issue."
                    : "We compare your words + location against every open ticket while you type."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}