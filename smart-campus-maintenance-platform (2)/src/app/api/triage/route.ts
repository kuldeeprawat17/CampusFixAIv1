import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { findDuplicates, triage } from "@/lib/triage";

// Live smart-triage preview + duplicate suggestions while typing.
export async function POST(req: NextRequest) {
  const { title = "", description = "", building = "", room = "", category } = await req.json();

  if (title.trim().length < 4 && description.trim().length < 4) {
    return NextResponse.json({ suggestion: null, duplicates: [] });
  }

  const suggestion = triage(title, description);
  const open = await db.select().from(tickets);
  const duplicates = findDuplicates(
    { title, description, building, room, category: category && category !== "auto" ? category : suggestion.category },
    open.map((t) => ({
      id: t.id,
      code: t.code,
      title: t.title,
      description: t.description,
      building: t.building,
      room: t.room,
      category: t.category,
      status: t.status,
      createdAt: t.createdAt,
    }))
  );

  return NextResponse.json({ suggestion, duplicates });
}