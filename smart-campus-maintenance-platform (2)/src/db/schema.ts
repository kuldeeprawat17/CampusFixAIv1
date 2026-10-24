import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(), // e.g. CF-1042
  title: text("title").notNull(),
  description: text("description").notNull(),
  building: text("building").notNull(),
  room: text("room").notNull(),
  category: text("category").notNull(),
  severity: text("severity").notNull().default("moderate"), // low | moderate | high | critical
  status: text("status").notNull().default("reported"), // reported | in_progress | resolved
  anonymous: boolean("anonymous").notNull().default(false),
  reporterName: text("reporter_name"),
  reporterId: text("reporter_id").notNull(),
  triageReason: text("triage_reason"),
  mergedIntoId: integer("merged_into_id"),
  resolutionNote: text("resolution_note"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const supports = pgTable("supports", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  studentId: text("student_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  studentId: text("student_id").notNull(),
  verdict: text("verdict").notNull(), // confirmed | still_broken
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Ticket = typeof tickets.$inferSelect;
export type Support = typeof supports.$inferSelect;
export type Verification = typeof verifications.$inferSelect;