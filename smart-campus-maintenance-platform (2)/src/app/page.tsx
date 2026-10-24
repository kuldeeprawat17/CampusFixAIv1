import Link from "next/link";
import { db } from "@/db";
import { tickets, supports } from "@/db/schema";
import { desc } from "drizzle-orm";
import { enrichTickets } from "@/lib/server";
import {
  ClipboardPen, CopyCheck, Users, Gauge, Hammer, BadgeCheck, MapPin,
  ArrowRight, ShieldAlert, Repeat2, Clock, Flame, MessageSquareOff, EyeOff, Layers,
} from "lucide-react";
import Reveal from "@/components/Reveal";
import { StatusChip, PriorityChip } from "@/components/ui";

export const dynamic = "force-dynamic";

const steps = [
  { icon: ClipboardPen, title: "Report an issue", text: "Title, description, building, room and category — anonymously if you prefer. Takes under a minute." },
  { icon: CopyCheck, title: "Duplicate detection", text: "Smart triage checks open tickets at the same spot and suggests the match before a duplicate is created." },
  { icon: Users, title: "Community impact", text: "Affected students tap “I'm affected too.” One ticket gathers everyone's signal instead of ten copies." },
  { icon: Gauge, title: "Explainable priority", text: "The Campus Impact Score combines safety, reach, recurrence and age — and shows exactly why." },
  { icon: Hammer, title: "Staff resolves", text: "Staff filter by status and priority, then move tickets Reported → In Progress → Resolved with repair notes." },
  { icon: BadgeCheck, title: "Verify before closing", text: "Students confirm the fix — or flag it as still broken, which reopens the ticket automatically." },
];

export default async function Home() {
  const rows = await db.select().from(tickets).orderBy(desc(tickets.createdAt)).limit(50);
  const enriched = await enrichTickets(rows);
  const allSupports = await db.select().from(supports);

  const open = enriched.filter((t) => t.status !== "resolved");
  const resolved = enriched.filter((t) => t.status === "resolved");
  const topTickets = [...open].sort((a, b) => b.score.total - a.score.total).slice(0, 3);

  const ticker = [
    `${open.length} open work orders`,
    `${allSupports.length} duplicate reports avoided`,
    `${resolved.length} repairs completed`,
    `${new Set(enriched.map((t) => t.reporterId)).size} students engaged`,
    "one problem · one ticket",
  ];

  return (
    <div>
      {/* ── HERO: live work-order board ─────────────────────── */}
      <section className="relative bg-navy text-white overflow-hidden">
        <div className="absolute inset-0 grid-paper-dark" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-signal/15 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-[1.1fr_1fr] gap-14 items-center">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-signal font-semibold">
              <span className="w-2 h-2 rounded-full bg-signal animate-blink" />
              Campus maintenance, coordinated
            </p>
            <h1 className="font-display font-black tracking-tight leading-[0.95] text-5xl sm:text-6xl lg:text-7xl mt-5">
              REPORT LESS.
              <br />
              <span className="text-signal">RESOLVE</span> SMARTER.
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-xl leading-relaxed">
              Ten students, one broken fan, ten WhatsApp messages — and nobody knows if it was fixed.
              CampusFix AI turns scattered complaints into <strong className="text-white">one shared ticket</strong> with
              an explainable impact score, verified repairs and hotspot analytics.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/report"
                className="inline-flex items-center gap-2 bg-signal hover:bg-signal-deep text-white font-bold px-6 py-3.5 rounded-lg transition-all hover:gap-3 shadow-lg shadow-signal/30"
              >
                <ClipboardPen className="w-5 h-5" /> Report an issue
              </Link>
              <Link
                href="/tickets"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-6 py-3.5 rounded-lg transition-colors"
              >
                View live tickets <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              {[
                { n: open.length, l: "Open tickets" },
                { n: allSupports.length, l: "Duplicates avoided" },
                { n: resolved.length, l: "Repairs verified live" },
              ].map((s) => (
                <div key={s.l} className="border-l-2 border-signal/60 pl-3">
                  <p className="font-mono text-3xl font-semibold">{s.n}</p>
                  <p className="text-xs text-white/55 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* live ticket stubs */}
          <div className="space-y-4 animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/45 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-fix rounded-full animate-blink" /> Highest impact right now
            </p>
            {topTickets.length === 0 && (
              <div className="bg-white/5 border border-white/15 rounded-xl p-8 text-white/60 text-sm">
                No open tickets yet — be the first to report an issue.
              </div>
            )}
            {topTickets.map((t, i) => (
              <Link
                key={t.id}
                href={`/tickets/${t.id}`}
                className="block bg-white text-ink rounded-xl overflow-hidden shadow-2xl hover:-translate-y-1 hover:rotate-[-0.5deg] transition-transform duration-300"
                style={{ marginLeft: `${i * 14}px` }}
              >
                <div className="flex">
                  <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-ink-soft">{t.code}</span>
                      <StatusChip status={t.status} />
                    </div>
                    <p className="font-display font-bold mt-1 truncate">{t.title}</p>
                    <p className="text-xs text-ink-soft mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {t.building.split(" — ")[0]}{t.room ? ` · ${t.room}` : ""} · {t.affectedCount} affected
                    </p>
                  </div>
                  <div className="perforated w-24 shrink-0 grid place-items-center bg-paper/60">
                    <div className="text-center">
                      <p className="font-mono text-2xl font-semibold text-signal">{t.score.total}</p>
                      <PriorityChip priority={t.score.priority} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ticker */}
        <div className="relative border-t border-white/10 bg-navy-soft/60 overflow-hidden py-2.5">
          <div className="flex whitespace-nowrap animate-marquee w-max">
            {[...ticker, ...ticker, ...ticker, ...ticker].map((t, i) => (
              <span key={i} className="font-mono text-xs text-white/50 mx-6 uppercase tracking-wider">
                ▪ {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-signal font-semibold">The problem</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight mt-2 max-w-2xl">
            Things break. What really fails is the <span className="underline decoration-signal decoration-4 underline-offset-4">loop around them</span>.
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {[
            { icon: MessageSquareOff, title: "Reports get lost", text: "Verbal complaints and WhatsApp messages vanish in group chats. Important issues never reach the right desk." },
            { icon: Layers, title: "Duplicates pile up", text: "Ten students report the same fan. Staff do the same paperwork ten times — and still can't see it's one problem." },
            { icon: EyeOff, title: "No visibility", text: "Students never learn if anything happened. Staff can't tell which issue affects 3 people and which affects 300." },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 100}>
              <div className="bg-card border border-ink/10 rounded-xl p-6 h-full hover:border-signal/50 hover:shadow-md transition-all">
                <c.icon className="w-8 h-8 text-signal" strokeWidth={1.75} />
                <h3 className="font-display font-bold text-xl mt-4">{c.title}</h3>
                <p className="text-sm text-ink-soft mt-2 leading-relaxed">{c.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="bg-navy text-white relative overflow-hidden">
        <div className="absolute inset-0 grid-paper-dark" />
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-signal font-semibold">How it works</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight mt-2">
              Six steps from complaint to confirmed fix.
            </h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 mt-12">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <div className="relative pl-4 border-l-2 border-white/15 hover:border-signal transition-colors group">
                  <span className="font-mono text-signal/80 text-xs">STEP {String(i + 1).padStart(2, "0")}</span>
                  <div className="flex items-center gap-2.5 mt-2">
                    <s.icon className="w-5 h-5 text-signal group-hover:scale-110 transition-transform" />
                    <h3 className="font-display font-bold text-lg">{s.title}</h3>
                  </div>
                  <p className="text-sm text-white/60 mt-2 leading-relaxed">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOUR DIFFERENTIATORS ────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-signal font-semibold">What makes it different</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight mt-2 max-w-2xl">
            Not another complaint form. A system that sees the whole campus.
          </h2>
        </Reveal>
        <div className="grid lg:grid-cols-2 gap-5 mt-10">
          <Reveal>
            <div className="bg-card border border-ink/10 rounded-xl p-7 h-full hover:shadow-lg transition-shadow">
              <CopyCheck className="w-9 h-9 text-signal" strokeWidth={1.75} />
              <h3 className="font-display font-bold text-2xl mt-4">One Problem, One Ticket</h3>
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                As you type, the system compares your report against open tickets — same room, same keywords,
                same category. Found a match? Support it instead of filing copy #11.
              </p>
              <div className="mt-5 bg-paper rounded-lg p-4 font-mono text-xs space-y-1.5">
                <p className="text-ink-soft">→ “Fan not working in C-204”</p>
                <p className="text-fix font-semibold">✓ 92% match with CF-1002 · same room · 3 keywords · same category</p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="bg-card border border-ink/10 rounded-xl p-7 h-full hover:shadow-lg transition-shadow">
              <Gauge className="w-9 h-9 text-signal" strokeWidth={1.75} />
              <h3 className="font-display font-bold text-2xl mt-4">Campus Impact Score</h3>
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                A transparent 0–100 score: <strong>S</strong>afety + <strong>A</strong>ffected students +{" "}
                <strong>R</strong>ecurrence + <strong>T</strong>ime unresolved. Every point is explained — an exposed
                wire outranks a broken chair even with one reporter.
              </p>
              <div className="mt-5 flex gap-2">
                {[
                  { k: "S", max: 40, c: "#dc2626", Icon: ShieldAlert },
                  { k: "A", max: 30, c: "#e85d04", Icon: Users },
                  { k: "R", max: 15, c: "#7c3aed", Icon: Repeat2 },
                  { k: "T", max: 15, c: "#0369a1", Icon: Clock },
                ].map((f) => (
                  <div key={f.k} className="flex-1 rounded-lg p-3 text-center text-white" style={{ background: f.c }}>
                    <f.Icon className="w-4 h-4 mx-auto" />
                    <p className="font-mono font-semibold text-lg mt-1">{f.k}</p>
                    <p className="text-[10px] opacity-80">up to {f.max} pts</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="bg-card border border-ink/10 rounded-xl p-7 h-full hover:shadow-lg transition-shadow">
              <Flame className="w-9 h-9 text-signal" strokeWidth={1.75} />
              <h3 className="font-display font-bold text-2xl mt-4">Campus Problem Hotspots</h3>
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                The dashboard rolls tickets up by building, room and category. If Block B keeps generating
                plumbing tickets, that's a pattern worth investigating — not five unrelated incidents.
              </p>
              <div className="mt-5 space-y-2">
                {[
                  { b: "Block B — Classrooms", w: 86 },
                  { b: "Block C — Labs", w: 58 },
                  { b: "Library", w: 31 },
                ].map((r) => (
                  <div key={r.b} className="flex items-center gap-3 text-xs">
                    <span className="w-40 shrink-0 text-ink-soft truncate">{r.b}</span>
                    <div className="flex-1 h-3 bg-ink/8 rounded-full overflow-hidden">
                      <div className="h-full bg-signal rounded-full animate-bar" style={{ width: `${r.w}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="bg-card border border-ink/10 rounded-xl p-7 h-full hover:shadow-lg transition-shadow">
              <BadgeCheck className="w-9 h-9 text-signal" strokeWidth={1.75} />
              <h3 className="font-display font-bold text-2xl mt-4">Verify Before Closing</h3>
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                “Resolved” isn't the end — students who were affected confirm the repair or flag that the
                problem persists. A “still broken” vote reopens the ticket automatically.
              </p>
              <div className="mt-5 flex gap-2 text-xs font-bold">
                <span className="flex-1 text-center bg-emerald-50 text-fix border border-emerald-200 rounded-lg py-2.5">✓ Fixed — confirmed</span>
                <span className="flex-1 text-center bg-red-50 text-red-700 border border-red-200 rounded-lg py-2.5">✕ Still broken → reopened</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── HONEST AI NOTE + CTA ────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <Reveal>
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
            <div className="bg-navy text-white rounded-xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 grid-paper-dark" />
              <div className="relative">
                <p className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight leading-snug">
                  “We turn individual complaints into a clearer, community-supported picture of campus problems.”
                </p>
                <p className="text-white/60 text-sm mt-4 max-w-lg leading-relaxed">
                  Built for students, maintenance staff and college administration — and adaptable to hostels,
                  schools, offices and any shared facility.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/report" className="inline-flex items-center gap-2 bg-signal hover:bg-signal-deep font-bold px-5 py-3 rounded-lg transition-colors">
                    Try the full flow <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/dashboard" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 font-bold px-5 py-3 rounded-lg transition-colors">
                    Open staff dashboard
                  </Link>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-8">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-700 font-semibold">Honest by design</p>
              <h3 className="font-display font-bold text-xl mt-2">Where the “AI” is</h3>
              <p className="text-sm text-ink-soft mt-3 leading-relaxed">
                This prototype uses a <strong>rule-based smart triage system</strong>: keyword rules suggest
                category and safety severity, location + text similarity flags duplicates, and documented
                weights compute the impact score. It is heuristic automation — <em>not</em> a connected
                language model — and staff always keep final control.
              </p>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}