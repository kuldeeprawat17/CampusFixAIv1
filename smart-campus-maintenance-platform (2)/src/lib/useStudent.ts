"use client";

import { useEffect, useState } from "react";

export type Role = "student" | "staff";

function readId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("cf-student-id");
  if (!id) {
    id = `stu-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("cf-student-id", id);
  }
  return id;
}

export function useStudentId(): string {
  const [id, setId] = useState("");
  useEffect(() => {
    setId(readId());
  }, []);
  return id;
}

export function useRole(): [Role, (r: Role) => void] {
  const [role, setRoleState] = useState<Role>("student");
  useEffect(() => {
    const stored = localStorage.getItem("cf-role");
    if (stored === "staff" || stored === "student") setRoleState(stored);
    const onStorage = () => {
      const r = localStorage.getItem("cf-role");
      if (r === "staff" || r === "student") setRoleState(r);
    };
    window.addEventListener("cf-role-change", onStorage);
    return () => window.removeEventListener("cf-role-change", onStorage);
  }, []);
  const setRole = (r: Role) => {
    localStorage.setItem("cf-role", r);
    setRoleState(r);
    window.dispatchEvent(new Event("cf-role-change"));
  };
  return [role, setRole];
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}