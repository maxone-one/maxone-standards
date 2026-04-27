# Checkliste: 016 — Stack-Whitelist & Plattform-Blacklist

Pflicht bei Gate 1 (Standard 015 CONCEPT.md) und bei Gate 3 (Standard 013
LAUNCH-REVIEW.md). Detailliert in `CONCEPT.md` Section „Stack-Wahl",
re-validiert in `LAUNCH-REVIEW.md` Section J Punkt 8.

---

## A. Pro-Schicht Whitelist-Check

Pro Stack-Schicht: ist die gewählte Komponente auf der Whitelist
(Standard 016)? Wenn nicht: warum?

- [ ] **Hosting** gewählt: ... (Whitelist? ✅/⚠️/❌)
- [ ] **Datenbank** gewählt: ... (Whitelist? ✅/⚠️/❌)
- [ ] **Frontend Framework** gewählt: ... (Whitelist? ✅/⚠️/❌)
- [ ] **AI-Coding-Tool** gewählt: ... (Whitelist? ✅/⚠️/❌)
- [ ] **AI-Inferenz** gewählt: ... (Whitelist? ✅/⚠️/❌)
- [ ] **Reverse Proxy / TLS** gewählt: ... (Whitelist? ✅/⚠️/❌)
- [ ] **Mail-Versand** gewählt: ... (Whitelist? ✅/⚠️/❌)

## B. Bei ⚠️-Komponenten

- [ ] Begründung im `CONCEPT.md` notiert (warum nicht Default?)
- [ ] DSFA-Prüfung dokumentiert wenn personenbezogene Daten betroffen
- [ ] AVV / DPA mit dem Anbieter abgeschlossen

## C. Bei ❌-Komponenten (Blacklist-Plattform initial genutzt)

- [ ] Plattform namentlich genannt (Lovable / Bolt / Base44 / v0 / Replit)
- [ ] Migrations-Plan mit Datum im `CONCEPT.md`
- [ ] Migration ABGESCHLOSSEN vor Gate 3 (nicht „läuft noch")
- [ ] Code nach Migration ZeilenWeise re-reviewed durch zweite Person
      ODER VAULT-Persona-Session
- [ ] In `LAUNCH-REVIEW.md` Section J Punkt 8 gekreuzt

## D. Plattform-Marker im Repo entfernt

Nach Migration sollten diese Dateien NICHT mehr im Repo sein:

- [ ] `.lovable` / `lovable.config.*` entfernt
- [ ] `.bolt` / `.stackblitz` entfernt
- [ ] `.replit` / `replit.nix` entfernt
- [ ] `vercel.json` entfernt (sofern auf Hetzner umgezogen)
- [ ] `wrangler.toml` entfernt (sofern Cloudflare verlassen)

## E. Lockfile-Scan

- [ ] `grep -E "@lovable|@stackblitz|@base44|@replit/agent" package-lock.json`
      → 0 Treffer
- [ ] Falls Treffer: Begründung warum noch da (z.B. dev-only Tooling),
      sonst entfernen

## F. Bundle-Scan im Build-Output

- [ ] `grep -rE "lovable|bolt\.new|base44|v0\.dev|replit" dist/` → 0
      Treffer (oder begründet)
- [ ] Externe Hosts beim Initial-Load (DevTools Network) enthalten KEINE
      Plattform-Domains

## G. AVV / DSFA bei ⚠️- oder Cloud-Komponenten

- [ ] AVV mit Hetzner: ✅ Standard
- [ ] AVV mit Supabase Cloud (falls genutzt): ✅ Pro-Plan
- [ ] AVV mit Brevo: ✅ im Account
- [ ] AVV mit Vercel/Cloudflare (falls genutzt): geprüft
- [ ] DSFA für US-Cloud-Komponenten gemacht (DSGVO Art. 35)

---

## Anti-Pattern-Liste (typische Stolpersteine)

- „Wir prototypen nur kurz auf Lovable" → wird zu Live, niemand migriert
- „Vercel ist gratis" → Marketing-Site, dann kommt Login dazu, dann PII
- „GitHub Copilot ist OK weil ich keine Secrets in der Datei habe" →
  Code-Inhalt selbst ist Geschäftsgeheimnis
- „Anthropic API direkt ist schneller" → siehe globale CLAUDE.md, nur CLI
- „Replit ist ja nur Dev" → Replit-Agent-Vorfall war auf „Dev" konfiguriert,
  hat trotzdem Prod gelöscht
