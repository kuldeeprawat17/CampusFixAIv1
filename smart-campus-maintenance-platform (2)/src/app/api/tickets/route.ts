import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { enrichTickets, newCode } from "@/lib/server";
import { triage } from "@/lib/triage";

export async function GET(req: NextRequest) {
  const viewerId = req.nextUrl.searchParams.get("viewer") ?? undefined;
  const rows = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
  const enriched = await enrichTickets(rows, viewerId);
  return NextResponse.json({ tickets: enriched });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, building, room, category, anonymous, reporterName, reporterId } = body;

  if (!title?.trim() || !description?.trim() || !building || !reporterId) {
    return NextResponse.json({ error: "Title, description, building and reporter are required." }, { status: 400 });
  }

  const suggestion = triage(title, description);
  const finalCategory = category && category !== "auto" ? category : suggestion.category;

  const [inserted] = await db
    .insert(tickets)
    .values({
      code: "CF-PENDING",
      title: title.trim(),
      description: description.trim(),
      building,
      room: (room ?? "").trim(),
      category: finalCategory,
      severity: suggestion.severity,
      anonymous: Boolean(anonymous),
      reporterName: reporterName?.trim() || null,
      reporterId,
      triageReason: suggestion.reason,
    })
    .returning();

  const [updated] = await db
    .update(tickets)
    .set({ code: newCode(inserted.id) })
    .where(eq(tickets.id, inserted.id))
    .returning();

  const [enriched] = await enrichTickets([updated], reporterId);
  return NextResponse.json({ ticket: enriched }, { status: 201 });
}