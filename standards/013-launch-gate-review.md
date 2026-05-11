# 013 — Launch-Gate: Security & Compliance Review

**Status:** active
**Seit:** 2026-04-27
**Gilt für:** alle Projekte beim Übergang `dev` → `live` (und bei jeder größeren Änderung an Auth, DB-Schema, Tracking oder externen Integrationen)

## Regel

Bevor `status: live` in `registry/projects.yml` gesetzt wird oder ein Projekt
mit echten Nutzerdaten in Berührung kommt, MUSS eine `LAUNCH-REVIEW.md` im
Repo-Root liegen, die jeden Punkt der Launch-Gate-Checkliste namentlich
abzeichnet. Die unterzeichnende Person ist juristisch und faktisch
verantwortlich für den Code — auch für KI-generierte Anteile.

Kein Sign-Off → kein Live-Status. Kein "wir reichen das nach".

## Warum

KI-Tools erzeugen in Minuten Code, den niemand vollständig durchdrungen
hat. 2025 sind reihenweise Vibe-Coding-Projekte gekippt:

- **Enrichlead** (2025) — 100 % Cursor-AI-Code, Auth-Logik nie reviewed,
  jeder Nutzer konnte kostenpflichtige Features nutzen + Daten ändern.
  Projekt eingestellt.
- **Tea-App / Sapphos** (2025) — zwei aufeinanderfolgende Datenlecks durch
  zu weit gefasste DB-Permissions. Angreifer luden die komplette Nutzer-DB
  ohne App-Interaktion.
- **Replit-Agent** (2025) — autonomer Agent löschte Prod-DB trotz expliziter
  Anweisung "keine Änderungen". Ursache: keine technische Test/Prod-Trennung.
- **Base44** (Juli 2025) — Plattform-Lücke gab Angreifern Zugriff auf
  fremde private Apps. User-Code irrelevant.

Eigene Erfahrung 2026-04-27: 30-Minuten-Vibe-Coding-Test ergab eine optisch
überzeugende Site mit DSGVO-Verstoß, der erst beim zweiten Hinschauen
auffiel. Hunderte JS-Dateien, kein Mensch greift da gezielt ein.

Fraunhofer IESE (2025): *„Die Verantwortung für jeden Codeblock liegt
beim Menschen, nicht beim KI-Assistenten."*

Geschäftsführer-Haftung kennt keinen "die KI war's"-Bonus. DSGVO,
TMG, TTDSG, Produkthaftung — gelten unabhängig vom Werkzeug. Jemand
muss im Ernstfall unterschreiben, dass er weiß, was im System steckt.

## Wie anwenden

**1. Vor Launch:** [`templates/LAUNCH-REVIEW.md`](../templates/LAUNCH-REVIEW.md)
ins Projekt-Root kopieren, jeden Punkt aus
[`checklists/013-launch-gate.md`](../checklists/013-launch-gate.md) abarbeiten,
Sign-Off-Block ausfüllen (Name, GitHub-User, Datum, optional PGP-Signatur).

**2. Bei größeren Änderungen** (Auth-Flow, neues Tracking, neue 3rd-Party-API,
Schema-Migration mit Daten): Re-Review mit neuem Datum-Eintrag im selben
File. Alte Einträge bleiben stehen — Audit-Trail.

**3. Speziell bei KI-generiertem Code:**
   - Black-Box-Anteil schätzen (% Code, den der Verantwortliche nicht
     Zeile für Zeile gelesen hat)
   - Falls > 20 %: zusätzlich `security-review` oder `ultrareview` durchlaufen
     lassen, Output ins Review-File anhängen
   - Lockfile-Pflicht (`package-lock.json` / `pnpm-lock.yaml` committed)
   - `npm audit --production` ohne Critical/High
   - **Standard 022** (`gitleaks`) und **Standard 023** (`semgrep` OWASP-Top-10)
     müssen ohne Findings durchlaufen — siehe Checklist Section J.

**4. Datenschutz-Spezifika (DSGVO):**
   - Liste aller Cookies (Name, Zweck, Lebensdauer, First/Third-Party)
   - Liste aller geladenen externen Hosts (Fonts, CDN, Analytics, Maps)
   - Consent-Banner für alle nicht-essentiellen Tracker, vor erstem Request
   - Datenschutzerklärung listet jeden Drittdienst namentlich
   - DPA / AVV mit jedem Auftragsverarbeiter (Brevo, Supabase, Hetzner, …)
     in `registry/projects.yml -> data_processors` dokumentiert (Standard 041)

**5. Datenbank-Spezifika:**
   - Supabase: RLS auf JEDER Tabelle aktiviert + Policy definiert (Default-deny)
   - Anon-Key kann nur lesen, was er soll — manuell mit `curl` getestet
   - Keine Service-Role-Keys im Frontend (`SUPABASE_SERVICE_ROLE_KEY` nur
     server-seitig, nie in `NEXT_PUBLIC_*`)
   - Test/Prod sind getrennte Projekte mit getrennten Credentials

**6. Sign-Off-Format** (im `LAUNCH-REVIEW.md`):

```markdown
## Sign-Off

- Verantwortlich: Max Karastoni (@karastoni)
- Datum: 2026-MM-DD
- Geprüft auf: DSGVO, Auth, RLS, Test/Prod-Trennung, Dependencies
- Black-Box-Anteil KI-generiert: X % (Tool: ..., reviewed mit: ...)
- Bekannte Restrisiken: ...
```

## Status pro Projekt

| Projekt          | LAUNCH-REVIEW.md | Letztes Review | Verantwortlich |
|------------------|------------------|----------------|----------------|
| maxone.one       | ❌                | —              | —              |
| stadtlahnflow    | ❌                | —              | —              |
| katchi           | ❌                | —              | —              |
| repivot          | ❌                | —              | —              |
| vanfree          | ❌                | —              | —              |
| plansey          | ❌                | —              | —              |
| kitchen-station  | ❌                | —              | —              |
| voltfair         | ❌                | —              | —              |
| solarproof       | ❌                | —              | —              |
| vector           | ❌                | —              | —              |
| snapflow         | ❌                | —              | —              |

→ Alle 11 Projekte sind aktuell ohne Sign-Off live. Nachholen in Reihenfolge:
**Customer-facing zuerst** (katchi, vanfree, repivot, plansey, snapflow,
stadtlahnflow), dann eigene Brands (maxone.one, voltfair, solarproof),
dann interne Tools (kitchen-station, vector).

## Audit

`scripts/audit.mjs` prüft pro Projekt mit `status: live`:

- Existenz `LAUNCH-REVIEW.md` im `path_local` Repo-Root → fehlt = **FAIL**
- Sign-Off-Block vorhanden (Regex auf `## Sign-Off` + `Verantwortlich:`)
  → fehlt = **FAIL**
- Datum im Sign-Off älter als 12 Monate → **WARN** ("Re-Review fällig")
- Datum innerhalb 12 Monaten + alle Pflichtzeilen → **PASS**

Internes Tool (`tags: internal`) und Infra (`tags: infra`): WARN statt FAIL,
da Risikoprofil anders ist (kein Customer-Traffic). Dokumentation bleibt
trotzdem empfohlen.
