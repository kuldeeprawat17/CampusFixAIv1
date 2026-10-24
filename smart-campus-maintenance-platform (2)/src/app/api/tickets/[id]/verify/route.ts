import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tickets, verifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { enrichTickets } from "@/lib/server";

type Params = { params: Promise<{ id: string }> };

// Verify Before Closing — students confirm the repair or flag it as still broken.
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ticketId = Number(id);
  const { studentId, verdict, note } = await req.json();
  if (!studentId || !["confirmed", "still_broken"].includes(verdict)) {
    return NextResponse.json({ error: "studentId and a valid verdict are required" }, { status: 400 });
  }

  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId));
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ticket.status !== "resolved") {
    return NextResponse.json({ error: "Only resolved tickets can be verified." }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(verifications)
    .where(and(eq(verifications.ticketId, ticketId), eq(verifications.studentId, studentId)));
  if (existing.length > 0) {
    await db.update(verifications).set({ verdict, note: note ?? null }).where(eq(verifications.id, existing[0].id));
  } else {
    await db.insert(verifications).values({ ticketId, studentId, verdict, note: note ?? null });
  }

  let current = ticket;
  if (verdict === "still_broken") {
    // Reopen: verification failed, ticket goes back into the queue.
    [current] = await db
      .update(tickets)
      .set({ status: "in_progress", resolvedAt: null, updatedAt: new Date() })
      .where(eq(tickets.id, ticketId))
      .returning();
  }

  const [enriched] = await enrichTickets([current], studentId);
  return NextResponse.json({ ticket: enriched, reopened: verdict === "still_broken" });
}