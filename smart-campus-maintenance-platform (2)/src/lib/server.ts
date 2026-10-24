import { db } from "@/db";
import { tickets, supports, verifications } from "@/db/schema";
import { impactScore } from "./triage";
import type { EnrichedTicket } from "./types";
import type { Ticket } from "@/db/schema";

export async function enrichTickets(
  rows: Ticket[],
  viewerId?: string
): Promise<EnrichedTicket[]> {
  const [allSupports, allVerifs, allTickets] = await Promise.all([
    db.select().from(supports),
    db.select().from(verifications),
    rows.length === 0 ? Promise.resolve(rows) : db.select().from(tickets),
  ]);

  return rows.map((t) => {
    const sup = allSupports.filter((s) => s.ticketId === t.id);
    const ver = allVerifs.filter((v) => v.ticketId === t.id);
    const recurrenceCount = allTickets.filter(
      (o) =>
        o.id !== t.id &&
        o.building === t.building &&
        o.room.trim().toLowerCase() === t.room.trim().toLowerCase() &&
        o.category === t.category &&
        new Date(o.createdAt).getTime() < new Date(t.createdAt).getTime()
    ).length;
    const affectedCount = sup.length + 1;
    const score = impactScore({
      severity: t.severity,
      affectedCount,
      recurrenceCount,
      createdAt: t.createdAt,
      status: t.status,
      resolvedAt: t.resolvedAt,
    });
    return {
      id: t.id,
      code: t.code,
      title: t.title,
      description: t.description,
      building: t.building,
      room: t.room,
      category: t.category,
      severity: t.severity,
      status: t.status,
      anonymous: t.anonymous,
      reporterName: t.anonymous ? null : t.reporterName,
      reporterId: t.reporterId,
      triageReason: t.triageReason,
      resolutionNote: t.resolutionNote,
      resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      supportCount: sup.length,
      affectedCount,
      supportedByMe: viewerId ? sup.some((s) => s.studentId === viewerId) : false,
      recurrenceCount,
      confirmedCount: ver.filter((v) => v.verdict === "confirmed").length,
      stillBrokenCount: ver.filter((v) => v.verdict === "still_broken").length,
      myVerdict: viewerId ? ver.find((v) => v.studentId === viewerId)?.verdict ?? null : null,
      score,
    };
  });
}

export function newCode(id: number): string {
  return `CF-${1000 + id}`;
}