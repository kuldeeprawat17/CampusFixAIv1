import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { enrichTickets } from "@/lib/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const viewerId = req.nextUrl.searchParams.get("viewer") ?? undefined;
  const rows = await db.select().from(tickets).where(eq(tickets.id, Number(id)));
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [enriched] = await enrichTickets(rows, viewerId);
  return NextResponse.json({ ticket: enriched });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { status, severity, resolutionNote } = body;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (status && ["reported", "in_progress", "resolved"].includes(status)) {
    updates.status = status;
    updates.resolvedAt = status === "resolved" ? new Date() : null;
  }
  if (severity && ["low", "moderate", "high", "critical"].includes(severity)) {
    updates.severity = severity;
  }
  if (typeof resolutionNote === "string") updates.resolutionNote = resolutionNote;

  const rows = await db.update(tickets).set(updates).where(eq(tickets.id, Number(id))).returning();
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [enriched] = await enrichTickets(rows);
  return NextResponse.json({ ticket: enriched });
}