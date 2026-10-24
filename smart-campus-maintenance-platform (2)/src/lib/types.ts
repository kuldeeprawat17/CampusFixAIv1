import type { ImpactScore, DuplicateMatch } from "./triage";

export interface EnrichedTicket {
  id: number;
  code: string;
  title: string;
  description: string;
  building: string;
  room: string;
  category: string;
  severity: string;
  status: string;
  anonymous: boolean;
  reporterName: string | null;
  reporterId: string;
  triageReason: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  supportCount: number;
  affectedCount: number;
  supportedByMe: boolean;
  recurrenceCount: number;
  confirmedCount: number;
  stillBrokenCount: number;
  myVerdict: string | null;
  score: ImpactScore;
}

export interface DuplicateSuggestion extends DuplicateMatch {
  ticket: DuplicateMatch["ticket"] & { supportCount?: number };
}

export interface HotspotStats {
  totals: {
    open: number;
    inProgress: number;
    resolved: number;
    avgResolutionHours: number | null;
    duplicatesAvoided: number;
    studentsEngaged: number;
  };
  byBuilding: { building: string; open: number; resolved: number; avgScore: number }[];
  byCategory: { category: string; count: number }[];
  hotspots: {
    building: string;
    room: string;
    category: string;
    ticketCount: number;
    latestCode: string;
  }[];
}