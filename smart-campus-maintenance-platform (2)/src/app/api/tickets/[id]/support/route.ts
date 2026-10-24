import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tickets, supports } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { enrichTickets } from "@/lib/server";

type Params = { params: Promise<{ id: string }> };

// "I'm affected too" — toggles community support for a ticket.
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ticketId = Number(id);
  const { studentId } = await req.json();
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });

  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId));
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ticket.reporterId === studentId) {
    return NextResponse.json({ error: "You reported this issue — you're already counted." }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(supports)
    .where(and(eq(supports.ticketId, ticketId), eq(supports.studentId, studentId)));

  let supported: boolean;
  if (existing.length > 0) {
    await db.delete(supports).where(eq(supports.id, existing[0].id));
    supported = false;
  } else {
    await db.insert(supports).values({ ticketId, studentId });
    supported = true;
  }

  const [enriched] = await enrichTickets([ticket], studentId);
  return NextResponse.json({ ticket: enriched, supported });
}