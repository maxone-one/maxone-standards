// ============================================================
// Footer-Standard 012 — Slim-Variante, React (Next.js / Vite / RR)
// ============================================================
//
// Anwenden:
// 1. <PROJEKT_BRAND>  — Anzeige-Name ("venfree", "katchi", …)
// 2. <PROJEKT_REPO>   — GitHub-Repo-Slug bei github.com/maxone-one
// 3. Optionale Legal-Links ergänzen (AGB, Nutzungsbedingungen)
// 4. Link-Import: Next.js → "next/link" + href / RR → "react-router-dom" + to
//
// Wann Slim: Platzhalter-Seiten, Login-Flows, App-Bereiche ohne Footer.
// Wann Mega: vollwertige Seiten → Footer.tsx nutzen.

import Link from "next/link"; // oder { Link } from "react-router-dom"

const PROJEKT_BRAND = ""; // TODO
const PROJEKT_REPO  = ""; // TODO  github.com/maxone-one/<PROJEKT_REPO>

export function FooterSlim() {
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center flex-wrap gap-x-3 gap-y-1">
          <span>© {year} {PROJEKT_BRAND}</span>
          <span className="opacity-30">·</span>
          <Link href="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
          <span className="opacity-30">·</span>
          <Link href="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
          {/* Optional: weitere Legal-Links */}
        </span>
        <span className="flex items-center gap-3">
          <a
            href="https://maxone.one"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-50 hover:opacity-80 transition-opacity"
          >
            Entwickelt von maxone
          </a>
          {buildId && buildId !== "dev" && (
            <a
              href={`https://github.com/maxone-one/${PROJEKT_REPO}/commit/${buildId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono opacity-30 hover:opacity-60 transition-opacity"
            >
              v: {buildId.slice(0, 8)}
            </a>
          )}
        </span>
      </div>
    </footer>
  );
}
