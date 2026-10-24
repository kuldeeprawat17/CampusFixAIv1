"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import type { HotspotStats } from "@/lib/types";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const PALETTE = ["#e85d04", "#12283a", "#0369a1", "#7c3aed", "#14804a", "#d97706", "#64748b"];

export function BuildingChart({ data }: { data: HotspotStats["byBuilding"] }) {
  return (
    <Bar
      data={{
        labels: data.map((d) => d.building.split(" — ")[0]),
        datasets: [
          {
            label: "Open",
            data: data.map((d) => d.open),
            backgroundColor: "#e85d04",
            borderRadius: 6,
          },
          {
            label: "Resolved",
            data: data.map((d) => d.resolved),
            backgroundColor: "#14804a",
            borderRadius: 6,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { font: { family: "IBM Plex Sans", size: 11 }, boxWidth: 12 } },
          tooltip: {
            callbacks: {
              afterTitle: (items) => data[items[0].dataIndex]?.building ?? "",
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: "IBM Plex Sans", size: 11 } } },
          y: { beginAtZero: true, ticks: { precision: 0, font: { family: "IBM Plex Mono", size: 10 } }, grid: { color: "rgba(16,28,38,0.07)" } },
        },
      }}
    />
  );
}

export function CategoryChart({ data }: { data: HotspotStats["byCategory"] }) {
  return (
    <Doughnut
      data={{
        labels: data.map((d) => d.category),
        datasets: [
          {
            data: data.map((d) => d.count),
            backgroundColor: PALETTE,
            borderColor: "#ffffff",
            borderWidth: 2,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: { position: "bottom", labels: { font: { family: "IBM Plex Sans", size: 10 }, boxWidth: 10, padding: 10 } },
        },
      }}
    />
  );
}