// ============================================================
// Footer-Standard 012 — React (Next.js / Vite / RR)
// Destilliert aus snapflow.one, maxone.one, voltfair.de
// ============================================================
//
// Anwenden:
// 1. <PROJEKT> mit Projekt-Slug ersetzen
// 2. <PROJEKT_BRAND> mit Anzeige-Name (z.B. "SnapFlow")
// 3. <BESCHREIBUNG> mit 1–2 Sätzen aus credits-API oder hardcoded
// 4. <NAV_LINKS> mit projekt-spezifischer Navigation füllen
// 5. <PROJEKT_REPO> = repo-Slug bei github.com/maxone-one

// In Next.js: import { Link } from "next/link" + href statt to
// In React Router: import { Link } from "react-router-dom" + to
// In Vite/RR oder anderem Setup: <a href> ist auch ok

import { Link } from "react-router-dom"; // oder "next/link"

const NAV_LINKS = [
  // { to: "/produkt", label: "Produkt" },
  // { to: "/preise", label: "Preise" },
];

export function Footer() {
  return (
    <footer className="py-12 md:py-16 border-t border-border">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {/* Spalte 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {/* <Logo /> */}
              <span className="font-semibold text-foreground">{/* PROJEKT_BRAND */}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {/* BESCHREIBUNG */}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <svg className="w-5 h-4 rounded-sm overflow-hidden flex-shrink-0" viewBox="0 0 20 16" aria-label="Made in Germany">
                <rect y="0" width="20" height="5.33" fill="#000" />
                <rect y="5.33" width="20" height="5.33" fill="#DD0000" />
                <rect y="10.67" width="20" height="5.33" fill="#FFCC00" />
              </svg>
              <span className="text-xs text-muted-foreground">Gehostet in Deutschland</span>
            </div>
          </div>

          {/* Spalte 2: Navigation */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
              Produkt
            </h3>
            <nav className="flex flex-col space-y-2.5">
              {NAV_LINKS.map(link => (
                <Link key={link.to} to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Spalte 3: Rechtliches */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
              Rechtliches
            </h3>
            <nav className="flex flex-col space-y-2.5">
              <Link to="/impressum" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Impressum
              </Link>
              <Link to="/datenschutz" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Datenschutz
              </Link>
              <button
                onClick={() => {
                  // TODO Projekt-Key anpassen falls anders benamt
                  localStorage.removeItem("cookie_consent");
                  window.location.reload();
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Cookie-Einstellungen
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} {/* PROJEKT_BRAND */}</span>
          <a
            href="https://maxone.one"
            target="_blank"
            rel="noreferrer noopener"
            className="text-muted-foreground/60 hover:text-muted-foreground transition-colors text-xs"
          >
            Entwickelt von maxone studio
          </a>
        </div>
      </div>
    </footer>
  );
}
