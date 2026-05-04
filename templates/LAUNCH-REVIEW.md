# LAUNCH-REVIEW — <PROJEKTNAME>

> Pflicht-Dokument nach [Standard 013](https://github.com/maxone-one/maxone-standards/blob/main/standards/013-launch-gate-review.md).
> Vor `status: live` ausfüllen. Ohne Sign-Off kein Live-Status.
> Checkliste: [`checklists/013-launch-gate.md`](https://github.com/maxone-one/maxone-standards/blob/main/checklists/013-launch-gate.md)

---

## Projekt-Kontext

- **Projekt:** <name>
- **Domain(s):** <z.B. example.com>
- **Stack:** <z.B. Next.js 15 / Supabase / Stripe>
- **Externe Dienste:** <Auflistung — Hetzner, Brevo, Stripe, OpenAI, ...>
- **Datenkategorien:** <z.B. E-Mail, Bestelldaten, Rechnungsadressen — keine besonderen Kategorien gem. Art. 9 DSGVO>
- **Erwartete Nutzerzahl bei Launch:** <Schätzung>

---

## A. Code-Verständnis & Verantwortung

- [ ] Black-Box-Anteil: __ % (Files: ...)
- [ ] `npm audit --production`: Critical __, High __ (Datum: ...)
- [ ] Lockfile committed: ja / nein
- [ ] Falls KI-Anteil > 20 %: zusätzlicher Review-Pass durch ...

**Notizen:** ...

## B. Auth & Authorization

- [ ] Auth-Flow durchgespielt am ...
- [ ] Privilege-Escalation-Test: ... (Curl-Output kurz dokumentieren)
- [ ] Bezahlfeatures gegen Bezahlstatus geprüft: ja / n/a (kein Paywall)
- [ ] Session-Timeout: __ min, Logout invalidiert: ja / nein

**Notizen:** ...

## C. Datenbank-Sicherheit

- [ ] RLS auf allen Tabellen: ja / nein (Liste: ...)
- [ ] Anon-Key getestet: ... (kurzes Curl-Resultat)
- [ ] Service-Role nur server-seitig: bestätigt durch `grep` im Bundle
- [ ] Test/Prod getrennt: Test-Projekt-ID ..., Prod-Projekt-ID ...
- [ ] DB-Backups: aktiv, Frequenz ...

**Notizen:** ...

## D. Datenschutz / DSGVO

- [ ] Datenschutzerklärung: <Link> (Stand: ...)
- [ ] Impressum: <Link> (über Standard 009: ja / nein)
- [ ] Cookie-Inventar:
  | Name | Zweck | Lebensdauer | First/Third |
  |------|-------|-------------|-------------|
  |      |       |             |             |
- [ ] Tracker / externe Hosts beim Initial-Load:
  - ...
- [ ] Consent-Banner für nicht-essentielle: ja / n/a (keine)
- [ ] Tracker werden ERST nach Consent geladen: ja / verifiziert wie ...
- [ ] AVV / DPA mit jedem Verarbeiter: Hetzner ✅, ... ✅
- [ ] Google Fonts: lokal / Consent / nicht verwendet
- [ ] Externe Embeds: keine / Two-Click / Consent
- [ ] Server-Region: EU (...)

**Notizen:** ...

## E. Test/Prod-Trennung

- [ ] Prod-Credentials nicht in Dev-`.env`: bestätigt
- [ ] Lokale Dev gegen: <z.B. lokales Supabase via Docker>
- [ ] CI-Tests gegen: <Test-DB / Mocks>
- [ ] Keine Agent-Tools mit Prod-DB-Zugang
- [ ] Migrations-Pfad: <z.B. supabase migration up>

**Notizen:** ...

## F. Frontend-Secrets / Public Bundle

- [ ] Bundle-Scan auf Secrets: `grep -rE "sk_|service_role" dist/` → leer
- [ ] Nur Public-Keys im Bundle: ...
- [ ] Source-Maps in Prod: deaktiviert / privat

**Notizen:** ...

## G. Externe Integrationen

- [ ] APIs: ...
- [ ] Webhooks mit Signatur-Prüfung: ja / n/a
- [ ] Rate-Limits: ja / n/a
- [ ] CORS: ...

**Notizen:** ...

## H. Infrastruktur

- [ ] Standard 002 (no-build-on-prod): ✅
- [ ] Standard 003 (secrets-store): ✅
- [ ] Standard 004 (TLS DNS-01): ✅
- [ ] Standard 005 (test-first): ✅
- [ ] Standard 001 (blue-green) für Live: ✅ / n/a
- [ ] Health-Check in compose: ✅
- [ ] Logs-Aggregation: ...

## I. Operations / Recovery

- [ ] Backup-Restore getestet am ...
- [ ] Restart-Policy: `unless-stopped`
- [ ] HANDOFF.md auf Server: ✅
- [ ] Monitoring/Alerting: ...

## J. Vibe-Coding-Lückenklassen (NEU 2026-04-27)

- [ ] XSS-Scan (`dangerouslySetInnerHTML` / `@html` / `v-html`):
      __ Treffer, davon __ mit Sanitizer, __ begründet ohne
- [ ] Log-Injection-Scan (Template-Strings in Loggern): __ Treffer
- [ ] SSRF-Review (fetch/axios mit User-Input): __ Aufrufe geprüft,
      __ mit Allowlist + RFC1918-Block
- [ ] Standard 022 (`gitleaks`): __ Findings im Code, __ in Historie,
      Status: ...
- [ ] Standard 023 (`semgrep` OWASP-Top-10): __ ERROR, __ WARNING
      (WARNING-Findings unten dokumentieren)
- [ ] Unauth-Routes-Liste:
  | Route | Methode | Auth-Status | Begründung |
  |-------|---------|-------------|------------|
  |       |         |             |            |
- [ ] BOLA-Pen-Test: User-A-Token vs User-B-Resource → 403 (Curl-Output
      kurz dokumentieren)
- [ ] Plattform-Lock-in: Code ursprünglich gebaut mit:
      ☐ Claude Code  ☐ Cursor  ☐ Vybora  ☐ Lovable  ☐ Bolt  ☐ Base44
      ☐ v0  ☐ Replit-Agent  ☐ andere: ___
      Falls Lovable/Bolt/Base44/v0/Replit: Migration durchgeführt am ...,
      Code-Re-Read durch ...

**Semgrep-WARNING-Findings (mit Begründung):**
- ...

**Notizen:** ...

---

## Sign-Off — 2026-MM-DD

- **Verantwortlich:** Vor- Nachname (@github-user)
- **Rolle:** <Geschäftsführer / CTO / Lead Dev / ...>
- **Geprüft am:** 2026-MM-DD
- **Sektionen abgehakt:** A B C D E F G H I J
- **Black-Box-Anteil KI-generiert:** __ %
  - Tools verwendet: ...
  - Reviewed durch: ...
- **Bekannte Restrisiken:**
  - ...
- **Nächstes Re-Review fällig:** 2027-MM-DD (max. +12 Monate)
- **Signatur:** [optional PGP-signed mit `gpg --clearsign LAUNCH-REVIEW.md`]

---

> **Re-Review-Trigger:** neuer Auth-Flow, neues Tracking, neuer 3rd-Party-Dienst,
> Schema-Migration mit Daten, oder spätestens nach 12 Monaten.
> Bei Re-Review: neuen Sign-Off-Block UNTER diesem hier anhängen, alten stehen lassen.
