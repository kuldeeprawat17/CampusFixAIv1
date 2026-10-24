import { NextResponse } from "next/server";
import { db } from "@/db";
import { tickets, supports } from "@/db/schema";
import { enrichTickets } from "@/lib/server";
import type { HotspotStats } from "@/lib/types";

export async function GET() {
  const rows = await db.select().from(tickets);
  const enriched = await enrichTickets(rows);
  const allSupports = await db.select().from(supports);

  const open = enriched.filter((t) => t.status === "reported");
  const inProgress = enriched.filter((t) => t.status === "in_progress");
  const resolved = enriched.filter((t) => t.status === "resolved");

  const resolutionHours = resolved
    .filter((t) => t.resolvedAt)
    .map((t) => (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime()) / 3_600_000);

  const buildingMap = new Map<string, { open: number; resolved: number; scoreSum: number; count: number }>();
  for (const t of enriched) {
    const b = buildingMap.get(t.building) ?? { open: 0, resolved: 0, scoreSum: 0, count: 0 };
    if (t.status === "resolved") b.resolved++;
    else b.open++;
    b.scoreSum += t.score.total;
    b.count++;
    buildingMap.set(t.building, b);
  }

  const categoryMap = new Map<string, number>();
  for (const t of enriched) categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + 1);

  const hotspotMap = new Map<string, { building: string; room: string; category: string; ticketCount: number; latestCode: string }>();
  for (const t of enriched) {
    const key = `${t.building}|${t.room}|${t.category}`;
    const h = hotspotMap.get(key) ?? { building: t.building, room: t.room, category: t.category, ticketCount: 0, latestCode: t.code };
    h.ticketCount++;
    hotspotMap.set(key, h);
  }

  const stats: HotspotStats = {
    totals: {
      open: open.length,
      inProgress: inProgress.length,
      resolved: resolved.length,
      avgResolutionHours: resolutionHours.length
        ? Math.round((resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length) * 10) / 10
        : null,
      duplicatesAvoided: allSupports.length,
      studentsEngaged: new Set([...enriched.map((t) => t.reporterId), ...allSupports.map((s) => s.studentId)]).size,
    },
    byBuilding: [...buildingMap.entries()]
      .map(([building, b]) => ({ building, open: b.open, resolved: b.resolved, avgScore: Math.round(b.scoreSum / b.count) }))
      .sort((a, b) => b.open - a.open),
    byCategory: [...categoryMap.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
    hotspots: [...hotspotMap.values()].filter((h) => h.ticketCount >= 2).sort((a, b) => b.ticketCount - a.ticketCount).slice(0, 6),
  };

  return NextResponse.json({ stats });
}