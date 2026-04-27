# 015 — CONCEPT.md / Gate 1: Konzept vor Code

**Status:** active
**Seit:** 2026-04-27
**Gilt für:** alle neuen Projekte ab Konzeptphase, sowie alle bestehenden Projekte rückwirkend (WARN bis nachgereicht)

## Regel

Bevor die erste Code-Zeile geschrieben wird, MUSS im Repo-Root eine
`CONCEPT.md` liegen, die das Problem, das Datenmodell, das Auth-Modell,
die externen Dienste, das Threat-Model und die Stack-Wahl benennt.
Sign-Off-Block (Vorgeschlagen / Reviewed) im Dokument = **Gate 1 passiert**
= Code-Bau freigegeben.

Kein Konzept → kein Code. Kein Sign-Off → kein Repo-Setup.

## Warum

OWASP A04:2021 *„Insecure Design"* ist die Klasse von Lücken, die nicht
durch besseren Code, sondern nur durch besseres **Design** verhindert
werden. Statische Analyse (Standard 023) und Pen-Tests (Standard 020)
finden Implementierungs-Bugs — sie finden NIEMALS:

- ein fehlendes Auth-Modell (Enrichlead 2025: Bezahlfeatures waren
  niemals serverseitig geprüft, weil nie konzipiert)
- eine zu grosse Trust-Boundary (Tea-App / Sapphos 2025: gesamte User-DB
  als „braucht halt jeder Client" exponiert)
- ein fehlender Auftragsverarbeitungs-Vertrag (DSGVO-Bussgeld erst
  Monate später)
- ein Stack der nicht auf eigene Infra portierbar ist (Lovable/Bolt/
  Base44 Lock-in: Code lebt im Plattform-Rahmen, nicht migrierbar)

Vibe-Coding produziert in Minuten lauffähigen Code zu **jeder** Konzept-
Lücke — die Lücke wird damit zementiert, nicht behoben.

Empirie 2026: Veracode 100+ LLMs ergab, dass 45 % des generierten Codes
mindestens eine OWASP-Top-10-Klasse trifft. Davon sind A04 (Insecure
Design), A07 (Auth-Failures) und A05 (Misconfig) jene, die NICHT durch
nachgelagerte Tools gefangen werden. Nur ein vorgelagerter Konzept-Gate
schliesst sie.

Geschäftsführer-Haftung: Datenschutz-Folgenabschätzung (DSFA, DSGVO
Art. 35) wird bei „Verarbeitung in grossem Umfang" oder „besondere
Kategorien" zur Pflicht. Eine `CONCEPT.md` ist die Mindest-Voraussetzung,
um überhaupt feststellen zu können, ob eine DSFA fällig ist.

## Wie anwenden

**1. Vor erster Code-Zeile:** [`templates/CONCEPT.md`](../templates/CONCEPT.md)
ins Projekt-Root kopieren, alle Pflicht-Sektionen ausfüllen, Sign-Off-Block
unten anhängen.

**2. Pflicht-Sektionen (kürzer als ein Pitch-Deck, länger als ein Tweet):**
   - **Problem / Ziel:** ein Satz
   - **Nutzer:** wer benutzt das (anonym? eingeloggt? zahlend?)
   - **Datenmodell:** Entitäten + Sensitivität (öffentlich / personenbezogen /
     besondere Kategorien Art. 9 DSGVO)
   - **Auth-Modell:** wer darf welche Resource lesen/schreiben — explizit
     pro Entität (Default: niemand ausser Owner)
   - **Externe Dienste:** jeder mit Verarbeitungsrolle, AVV-Status,
     Server-Region, Datenfluss
   - **Threat-Model (Top 3–5):** was ist das wahrscheinlichste Schaden-
     Szenario, wie wird es abgewendet
   - **Stack-Wahl:** Framework, DB, Hosting, AI-Coding-Tool — und WARUM,
     unter Berücksichtigung Standard 016 (Stack-Whitelist)
   - **Out of Scope:** was wird absichtlich NICHT gebaut (verhindert
     Scope-Creep, der wieder Lücken öffnet)
   - **Offene Fragen:** was ist noch zu klären, bevor losgelegt wird

**3. Sign-Off-Format:**
   ```markdown
   ## Gate 1 — Konzept-Sign-Off

   - Vorgeschlagen von: Vor- Nachname (@github-user) am 2026-MM-DD
   - Reviewed von: Vor- Nachname (@github-user) am 2026-MM-DD
   - Gate 1: PASSIERT — Code-Bau freigegeben
   - Bekannte Risiken aus Threat-Model: ...
   - DSFA fällig (DSGVO Art. 35): ja / nein / unklar — geprüft am ...
   ```

**4. Konzept-Änderungen während der Bauphase:** wenn sich Datenmodell,
Auth-Modell oder externe Dienste ändern, MUSS die `CONCEPT.md` updated und
ein neuer Gate-1-Sign-Off-Block angehängt werden. Alte Einträge bleiben
stehen — Audit-Trail.

**5. Verhältnis zu Standard 013 (Launch-Gate / Gate 3):**
   - Gate 1 (dieser Standard): vor erster Code-Zeile
   - Gate 2 (Pre-Prototyp): nicht eigener Standard, informell — „macht das
     was wir konzipiert haben?"
   - Gate 3 (Standard 013, `LAUNCH-REVIEW.md`): vor `status: live`
   Die `CONCEPT.md` aus Gate 1 ist Input für die `LAUNCH-REVIEW.md` aus
   Gate 3 — Section A (Code-Verständnis) und Section D (Datenschutz)
   referenzieren das Konzept.

**6. Speziell bei Vibe-Coding (KI-generierter Erst-Code):**
   - Konzept MUSS vom Menschen geschrieben sein, nicht generiert
     (Begründung: das Konzept IST das, was der Mensch verantwortet)
   - KI darf am Konzept ko-editieren, aber nicht initial drafte —
     Reviewer-Sign-Off bestätigt, dass der Mensch das Modell verstanden
     hat
   - Stack-Wahl muss explizit „eigene Infra" oder eine Plattform aus der
     Whitelist (Standard 016) nennen — Lovable/Bolt/Base44 nur mit
     dokumentiertem Migrations-Pfad

## Bestehende Projekte (Stand 2026-04-27)

| Projekt          | CONCEPT.md | Status | Nachreichen bis |
|------------------|------------|--------|-----------------|
| maxone.one       | ❌          | live   | Q3 2026          |
| stadtlahnflow    | ❌          | live   | Q3 2026          |
| katchi           | ❌          | live   | Q3 2026          |
| repivot          | ❌          | live   | Q3 2026          |
| vanfree          | ❌          | live   | im Sunset-Pfad   |
| plansey          | ❌          | live   | im Sunset-Pfad   |
| kitchen-station  | ❌          | live   | Q3 2026          |
| voltfair         | ❌          | live   | Q2 2026          |
| solarproof       | ❌          | live   | Q2 2026          |
| vector           | ❌          | live   | Q2 2026          |
| snapflow         | ❌          | live   | Q3 2026          |

→ Für laufende Projekte ist `CONCEPT.md` rückwirkend keine FAIL-Pflicht
(siehe Audit), aber empfohlen als Onboarding-Doku für VECTOR/Claude-
Sessions. Für jedes NEUE Projekt ab heute: Pflicht.

## Audit

`scripts/audit.mjs` prüft pro Projekt:

- `status: dev` ohne `CONCEPT.md` im `path_local` Repo-Root → **FAIL**
  (neues Projekt, Konzept fehlt)
- `status: live` ohne `CONCEPT.md` → **WARN** („retro-Konzept fällig")
- `CONCEPT.md` existiert, aber kein Sign-Off-Block (`## Gate 1`) → **WARN**
  („Konzept ohne Sign-Off — Gate 1 nicht formal passiert")
- `tags: internal` / `tags: infra` ohne `CONCEPT.md` → **WARN** statt FAIL
  (kein Customer-Risiko)
- alle Pflicht-Sektionen vorhanden + Sign-Off → **PASS**

Pflicht-Sektionen werden über Regex auf `## Problem`, `## Datenmodell`,
`## Auth-Modell`, `## Externe Dienste`, `## Threat-Model`, `## Stack`
geprüft. Fehlt eine → **WARN** mit Liste der fehlenden Sektionen.
