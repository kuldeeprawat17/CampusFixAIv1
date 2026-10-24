"use client";

import { AlertTriangle, CircleDot, Hammer, CheckCircle2, ShieldAlert, Users, Repeat2, Clock } from "lucide-react";
import type { ImpactScore } from "@/lib/triage";

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: typeof CircleDot }> = {
    reported: { label: "Reported", cls: "bg-sky-50 text-sky-800 border-sky-200", Icon: CircleDot },
    in_progress: { label: "In Progress", cls: "bg-amber-50 text-amber-800 border-amber-200", Icon: Hammer },
    resolved: { label: "Resolved", cls: "bg-emerald-50 text-emerald-800 border-emerald-200", Icon: CheckCircle2 },
  };
  const { label, cls, Icon } = map[status] ?? map.reported;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-semibold ${cls}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export function PriorityChip({ priority }: { priority: string }) {
  const cls: Record<string, string> = {
    Critical: "bg-red-600 text-white",
    High: "bg-signal text-white",
    Medium: "bg-amber-400 text-ink",
    Low: "bg-emerald-600 text-white",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${cls[priority] ?? cls.Low}`}>
      {priority === "Critical" && <AlertTriangle className="w-3 h-3" />}
      {priority}
    </span>
  );
}

export function ScoreDial({ score, size = "md" }: { score: ImpactScore; size?: "sm" | "md" | "lg" }) {
  const color =
    score.priority === "Critical" ? "#dc2626" :
    score.priority === "High" ? "#e85d04" :
    score.priority === "Medium" ? "#d97706" : "#14804a";
  const dims = size === "lg" ? "w-24 h-24" : size === "md" ? "w-16 h-16" : "w-12 h-12";
  const text = size === "lg" ? "text-3xl" : size === "md" ? "text-xl" : "text-base";
  const r = 42;
  const circ = 2 * Math.PI * r;
  return (
    <div className={`relative ${dims} shrink-0`} title={`Campus Impact Score: ${score.total}/100 (${score.priority})`}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(16,28,38,0.1)" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score.total / 100)}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className={`font-mono font-semibold ${text}`} style={{ color }}>{score.total}</span>
      </div>
    </div>
  );
}

const FACTOR_ICONS = { S: ShieldAlert, A: Users, R: Repeat2, T: Clock };
const FACTOR_COLORS = { S: "#dc2626", A: "#e85d04", R: "#7c3aed", T: "#0369a1" };

export function ScoreBreakdown({ score }: { score: ImpactScore }) {
  return (
    <div className="space-y-3">
      {score.factors.map((f, i) => {
        const Icon = FACTOR_ICONS[f.key];
        const color = FACTOR_COLORS[f.key];
        return (
          <div key={f.key} className="group">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-semibold">
                <span className="grid place-items-center w-6 h-6 rounded text-white font-mono text-xs" style={{ background: color }}>
                  {f.key}
                </span>
                <Icon className="w-4 h-4 text-ink-soft" />
                {f.label}
              </span>
              <span className="font-mono text-sm font-semibold">
                {f.points}<span className="text-ink-soft/60">/{f.max}</span>
              </span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-ink/8 overflow-hidden">
              <div
                className="h-full rounded-full animate-bar"
                style={{ width: `${(f.points / f.max) * 100}%`, background: color, animationDelay: `${i * 0.12}s` }}
              />
            </div>
            <p className="mt-1 text-xs text-ink-soft leading-relaxed">{f.explanation}</p>
          </div>
        );
      })}
      <div className="pt-2 border-t border-dashed border-ink/15 flex items-center justify-between">
        <span className="text-sm font-bold">Impact Score = S + A + R + T</span>
        <span className="font-mono font-bold text-lg">{score.total}<span className="text-ink-soft/60 text-sm">/100</span></span>
      </div>
    </div>
  );
}

export function SeverityTag({ severity }: { severity: string }) {
  const cls: Record<string, string> = {
    critical: "text-red-700 bg-red-50 border-red-200",
    high: "text-orange-700 bg-orange-50 border-orange-200",
    moderate: "text-amber-700 bg-amber-50 border-amber-200",
    low: "text-slate-600 bg-slate-50 border-slate-200",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded border text-[11px] font-semibold capitalize ${cls[severity] ?? cls.moderate}`}>
      {severity === "critical" ? "⚠ critical" : severity}
    </span>
  );
}