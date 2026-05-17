// ============================================================
// Footer-Standard 012 — Mega-Variante, React (Next.js / Vite / RR)
// ============================================================
//
// Anwenden:
// 1. <PROJEKT_BRAND>  — Anzeige-Name ("SnapFlow", "voltfair", …)
// 2. <PROJEKT_REPO>   — GitHub-Repo-Slug bei github.com/maxone-one
// 3. <NAV_SPALTEN>    — 1–3 Spalten mit projekt-spezifischen Links
// 4. Link-Import:     — Next.js: "next/link" + href / RR: "react-router-dom" + to
//
// Wann Mega: vollwertige Seiten (Landingpages, Feature-Seiten, Marketing).
// Wann Slim: Platzhalter, Login-Flows, App-Bereiche → FooterSlim.tsx nutzen.

import Link from "next/link"; // oder { Link } from "react-router-dom"

const PROJEKT_BRAND = ""; // TODO
const PROJEKT_REPO  = ""; // TODO  github.com/maxone-one/<PROJEKT_REPO>

const NAV_LINKS: { href: string; label: string }[] = [
  // { href: "/produkt", label: "Produkt" },
  // { href: "/preise",  label: "Preise"  },
];

export function Footer() {
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID;
  const year = new Date().getFullYear();

  return (
    <footer className="py-12 md:py-16 border-t border-border">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">

          {/* Spalte 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {/* <Logo /> */}
              <span className="font-semibold text-foreground">{PROJEKT_BRAND}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {/* BESCHREIBUNG — 1-2 Sätze */}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <svg className="w-5 h-4 rounded-sm overflow-hidden flex-shrink-0" viewBox="0 0 20 16" aria-label="Gehostet in Deutschland">
                <rect y="0"    width="20" height="5.33" fill="#000" />
                <rect y="5.33" width="20" height="5.33" fill="#DD0000" />
                <rect y="10.67" width="20" height="5.33" fill="#FFCC00" />
              </svg>
              <span className="text-xs text-muted-foreground">Gehostet in Deutschland</span>
            </div>
          </div>

          {/* Spalte 2: Navigation (projekt-spezifisch) */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
              Produkt {/* Spaltenbezeichnung anpassen */}
            </h3>
            <nav className="flex flex-col space-y-2.5">
              {NAV_LINKS.map(link => (
                <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Spalte 3: Rechtliches — immer vorhanden */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
              Rechtliches
            </h3>
            <nav className="flex flex-col space-y-2.5">
              <Link href="/impressum" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Impressum
              </Link>
              <Link href="/datenschutz" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Datenschutz
              </Link>
              {/* Optional: AGB, Nutzungsbedingungen */}
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {year} {PROJEKT_BRAND}</span>
          <span className="flex items-center gap-3">
            <a
              href="https://maxone.one"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-50 hover:opacity-80 transition-opacity"
            >
              Entwickelt von maxone.one
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
      </div>

      {/* Print-Hide */}
      <style>{`@media print { footer { display: none !important; } }`}</style>
    </footer>
  );
}
