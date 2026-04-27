// ============================================================
// GlobalFooter — Wrapper mit Hide-Logik (Standard 012)
// ============================================================
//
// Footer wird auf bestimmten Pfaden NICHT angezeigt: Admin, Dashboard,
// Portal, Onboarding, Auth-Flows. Print-Hide via CSS (siehe unten).
//
// Anwendung:
// - In Next.js App Router: in `app/(public)/layout.tsx` einbinden, oder
//   wenn ein root-layout für alles gilt: hier mit usePathname die Routen
//   filtern.
// - In React Router: einbinden in der Layout-Komponente.

"use client"; // Next.js App Router — bei React Router weglassen

import { usePathname } from "next/navigation"; // oder useLocation() bei RR
import { Footer } from "./Footer";

const HIDDEN_PREFIXES = [
  "/admin",
  "/dashboard",
  "/portal",
  "/onboarding",
  "/auth",
  "/login",
  "/register",
];

export function GlobalFooter() {
  const pathname = usePathname();
  const isHidden = HIDDEN_PREFIXES.some(prefix => pathname.startsWith(prefix));
  if (isHidden) return null;
  return <Footer />;
}

// Print-Hide via globale CSS (z.B. globals.css):
//
//   @media print {
//     footer { display: none !important; }
//   }
