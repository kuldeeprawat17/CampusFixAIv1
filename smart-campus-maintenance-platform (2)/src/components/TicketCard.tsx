"use client";

import Link from "next/link";
import { MapPin, Users, HandHeart, Check, ArrowRight, Repeat2, BadgeCheck } from "lucide-react";
import type { EnrichedTicket } from "@/lib/types";
import { StatusChip, PriorityChip, ScoreDial } from "./ui";
import { timeAgo } from "@/lib/useStudent";

export default function TicketCard({
  ticket,
  studentId,
  onSupport,
  busy,
}: {
  ticket: EnrichedTicket;
  studentId: string;
  onSupport: (id: number) => void;
  busy?: boolean;
}) {
  const mine = ticket.reporterId === studentId;
  const canSupport = !mine && ticket.status !== "resolved";

  return (
    <article className="bg-card rounded-xl border border-ink/10 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col">
      {ticket.score.priority === "Critical" && ticket.status !== "resolved" && <div className="hazard h-1.5" />}
      <div className="p-5 flex gap-4 flex-1">
        <div className="flex flex-col items-center gap-2">
          <ScoreDial score={ticket.score} />
          <PriorityChip priority={ticket.score.priority} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-ink-soft">{ticket.code}</span>
            <StatusChip status={ticket.status} />
            {ticket.recurrenceCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded">
                <Repeat2 className="w-3 h-3" /> recurring ×{ticket.recurrenceCount + 1}
              </span>
            )}
          </div>
          <Link href={`/tickets/${ticket.id}`} className="block mt-1.5 group">
            <h3 className="font-display font-bold text-lg leading-snug group-hover:text-signal transition-colors line-clamp-2">
              {ticket.title}
            </h3>
          </Link>
          <p className="text-sm text-ink-soft mt-1 line-clamp-2">{ticket.description}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-ink-soft flex-wrap">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {ticket.building.split(" — ")[0]}{ticket.room ? ` · ${ticket.room}` : ""}
            </span>
            <span className="px-1.5 py-0.5 bg-ink/5 rounded font-medium">{ticket.category}</span>
            <span>{timeAgo(ticket.createdAt)}</span>
          </div>
        </div>
      </div>
      <div className="px-5 py-3 bg-paper/70 border-t border-ink/8 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
          <Users className="w-4 h-4" />
          {ticket.affectedCount} affected
          {ticket.status === "resolved" && ticket.confirmedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-fix ml-2">
              <BadgeCheck className="w-4 h-4" /> {ticket.confirmedCount} verified
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {canSupport && (
            <button
              onClick={() => onSupport(ticket.id)}
              disabled={busy}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${
                ticket.supportedByMe
                  ? "bg-fix text-white"
                  : "bg-navy text-white hover:bg-signal"
              }`}
            >
              {ticket.supportedByMe ? <Check className="w-3.5 h-3.5" /> : <HandHeart className="w-3.5 h-3.5" />}
              {ticket.supportedByMe ? "You're affected" : "I'm affected too"}
            </button>
          )}
          {mine && (
            <span className="text-[11px] font-semibold text-ink-soft bg-ink/5 px-2 py-1 rounded">Your report</span>
          )}
          <Link
            href={`/tickets/${ticket.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-signal transition-colors"
          >
            Open <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}