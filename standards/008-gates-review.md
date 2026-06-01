# 008: Gates & Review (Konzept-Gate · Launch-Gate · Pentest · Re-Review)

**Status:** active
**Seit:** 2026-04-27 (erweitert 2026-04-28)
**Gilt für:** alle Projekte

## Inhalt

- [A] Gate 1: Konzept vor Code (CONCEPT.md)
- [B] Gate 3: Launch-Gate (LAUNCH-REVIEW.md)
- [C] Pentest-Light (defensive Außensicht)
- [D] Re-Review-Reminder (alle 180 Tage)

---

## A: Gate 1: Konzept vor Code

Bevor die erste Code-Zeile geschrieben wird, MUSS im Repo-Root eine `CONCEPT.md` liegen. Kein Konzept → kein Code.

**Pflicht-Sektionen in `CONCEPT.md`:**
- `## Problem / Ziel`, ein Satz
- `## Nutzer`, wer (anonym/eingeloggt/zahlend?)
- `## Datenmodell`, Entitäten + Sensitivität
- `## Auth-Modell`, wer darf was lesen/schreiben (Default: niemand außer Owner)
- `## Externe Dienste`, jeder mit Verarbeitungsrolle, AVV-Status, Server-Region
- `## Threat-Model`, Top 3-5 wahrscheinlichste Schaden-Szenarien
- `## Stack-Wahl`, Framework, DB, Hosting, AI-Tool + WARUM
- `## Out of Scope`, was absichtlich NICHT gebaut wird

**Sign-Off-Format:**
```markdown
## Gate 1 — Konzept-Sign-Off
- Vorgeschlagen: Max Karastelev (@karastoni) am YYYY-MM-DD
- Gate 1: PASSIERT — Code-Bau freigegeben
- DSFA fällig (DSGVO Art. 35): ja / nein / unklar
```

Bei Konzept-Änderungen (Datenmodell, Auth-Modell, externe Dienste): CONCEPT.md updaten + neuen Gate-1-Block anhängen.

**Warum:** OWASP A04:2021 "Insecure Design" ist die Klasse die kein nachgelagertes Tool findet, fehlendes Auth-Modell, zu große Trust-Boundary, Lock-in durch proprietäre Plattform. Vibe-Coding zementiert Konzept-Lücken.

---

## B: Gate 3: Launch-Gate (LAUNCH-REVIEW.md)

Vor `status: live` MUSS eine `LAUNCH-REVIEW.md` im Repo-Root liegen. Kein Sign-Off → kein Live-Status.

Template: [`templates/LAUNCH-REVIEW.md`](../templates/LAUNCH-REVIEW.md), Checkliste: [`checklists/013-launch-gate.md`](../checklists/013-launch-gate.md).

**Sign-Off-Format:**
```markdown
## Sign-Off
- Verantwortlich: Max Karastelev (@karastoni)
- Datum: 2026-MM-DD
- Geprüft auf: DSGVO, Auth, RLS, Test/Prod-Trennung, Dependencies
- Black-Box-Anteil KI-generiert: X %
- Bekannte Restrisiken: ...
```

**Pflicht-Bereiche:**
- Supabase: RLS auf JEDER Tabelle + Default-deny; Anon-Key manuell mit `curl` getestet; kein Service-Role-Key im Frontend
- DSGVO: Tracker-Inventar, externe Hosts, Consent-Banner, Datenschutzerklärung, AVV-Status (→ Standard 009)
- Bei Black-Box-Anteil > 20 %: zusätzlich `/code-review ultra` durchlaufen
- Lockfile committed; `npm audit` ohne Critical/High; Standards 022 + 023 PASS

Bei größeren Änderungen (neues Tracking, neue 3rd-Party-API, Schema-Migration): Re-Review mit neuem Datum-Eintrag.

**Warum:** Enrichlead 2025 (100% KI-Code, Auth nie reviewed, jeder Nutzer konnte Bezahlfeatures nutzen), Tea/Sapphos (DB-Permissions zu weit), Base44 (Plattform-Lücke), Replit-Agent (löschte Prod-DB).

---

## C: Pentest-Light

Jede Live-Domain wird automatisiert auf bekannte Vibe-Coding-Schwachstellen geprüft, ohne Anmeldedaten, ohne invasive Payloads.

**Prüft:**
- Keine versehentlich exposed Files (`.env`, `.git/`, Source-Maps)
- Keine offen zugänglichen Admin-Routen ohne Auth
- Keine offen erreichbaren Status-Endpoints ohne Auth
- Security-Header gesetzt (HSTS, X-Frame-Options, X-Content-Type-Options)

**Common-Path-Probe (HEAD-Requests, Timeout 3s):**

| Pfad | Erwartung | Severity |
|---|---|---|
| `/.env`, `/.env.local`, `/.git/HEAD`, `/backup.sql` | 404/403 | **FAIL** |
| `/server-status`, `/metrics`, `/admin` (ohne Auth) | 404/403 | **WARN** |
| `/.well-known/security.txt` | 200 gewünscht | INFO wenn fehlt |

**Header-Hygiene (1 GET auf `/`):**
- `Strict-Transport-Security` fehlt → WARN
- `X-Content-Type-Options: nosniff` fehlt → WARN
- `X-Frame-Options` fehlt → WARN
- `Server`-Header verrät Version → WARN

**Was NICHT gefunden wird:** BOLA, SSRF, RLS-Brute-Force, XSS, das ist manueller Gate-3-Scope.

---

## D: Re-Review-Reminder

Jedes Live-Projekt durchläuft alle **180 Tage** einen verkürzten Gate-3-Re-Review. Stichtag = `last_review_date` in `registry/projects.yml`.

**Re-Review-Umfang:** Audit-Lauf PASS; Section J LAUNCH-REVIEW.md; neue Tracker/Drittdienste (→ Standard 011); Bundle-Drift-Check (→ Standard 011); DNS/Cert-Check; Pentest-Light; neuer Sign-Off-Block.

**registry/projects.yml:**
```yaml
- name: stadtlahnflow
  status: live
  last_review_date: 2026-03-12
```

Nach Re-Review `last_review_date` aktualisieren + Tabellen-Eintrag in LAUNCH-REVIEW.md:
```markdown
| 2026-09-15 | Max | keine | PASS |
```

---

## Audit

`scripts/audit.mjs` prüft pro Projekt mit `status: live`:

**Gate 1:** `status: dev` ohne `CONCEPT.md` → **FAIL**; `status: live` ohne `CONCEPT.md` → WARN; Pflicht-Sektionen per Regex → WARN wenn fehlend.

**Gate 3:** `LAUNCH-REVIEW.md` fehlt → **FAIL**; Sign-Off fehlt → **FAIL**; Datum > 12 Monate → WARN.

**Pentest:** Common-Path-Probe + Header-Check (mit `--local-only` übersprungen).

**Re-Review:** `last_review_date` fehlt → FAIL; 180-269 Tage → WARN; ≥ 270 Tage → FAIL.
