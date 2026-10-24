# CampusFix AI
**Report Less. Resolve Smarter.**

A smart campus maintenance platform: students report problems, the system flags likely duplicates, affected students support one shared ticket, an explainable Campus Impact Score ranks issues, and staff resolve them. Students then confirm each repair before the ticket counts as closed.

## Features
- **One Problem, One Ticket**: checks for duplicates live as you type (matches location, keywords and category)
- **Campus Impact Score (0–100)**: S (safety, 40) + A (affected students, 30) + R (recurrence, 15) + T (time unresolved, 15), with every point explained
- **Campus Problem Hotspots**: dashboard charts by building and category, plus a list of locations with repeat problems
- **Verify Before Closing**: students confirm the fix, or a "still broken" vote reopens the ticket

## Tech stack
Next.js (App Router) · TypeScript · Tailwind CSS · PostgreSQL + Drizzle ORM · Chart.js · Lucide icons

## Setup
```bash
npm install
cp .env.example .env        # set DATABASE_URL to your PostgreSQL
npx drizzle-kit push        # create the tables
npm run dev                 # http://localhost:3000
```

## Honest AI note
Triage, duplicate detection and scoring are **rule-based heuristics**, not a connected language model. The weights are design choices. Staff always have the final say on priority and status.

## Project structure
```
src/
  app/            pages + API routes
    api/          tickets, triage, stats, health
    report/       report form
    tickets/      live board + ticket detail
    dashboard/    staff dashboard
  components/     UI pieces (Nav, TicketCard, charts)
  db/             Drizzle schema + connection
  lib/            triage engine, types, helpers
```
