# 038 — Cross-Project Incident Broadcast (CPIB)

**Status:** active
**Seit:** 2026-05-11
**Gilt für:** alle aktiven Projekte im maxone-Universum. Tritt in Kraft, sobald ein Fehler, eine Änderung oder ein Aufräum-Schritt in Projekt A Auswirkungen auf Projekt B–N hat oder haben könnte.

## Problem

Ein Fehler entsteht in einem Projekt — und schläft still in allen anderen weiter.

Typische Beispiele:
- Eine Route wird umbenannt (`/api/status` → `/api/health`) → alle Projekte, die diesen Endpunkt aufrufen, brechen lautlos.
- Die Domain-Endung wechselt (`maxone.studio` → `maxone.one`) → hardkodierte URLs in anderen Projekten zeigen ins Leere.
- Ein Authentifizierungs-Cookie-Name ändert sich → alle Frontends, die ihn direkt lesen, verlieren die Session.
- Ein Projekt räumt erfolgreich auf (z.B. entfernt Legacy-Header, macht einen Infra-Schritt) und weiß nicht, dass andere davon abhängen.

Das Gemeinsame: **der Schaden ist sofort passiert, die Entdeckung kommt Tage oder Wochen später**, wenn sich genug Symptome angesammelt haben.

## Regel

### 1. Broadcast-Pflicht

Sobald erkannt wird, dass ein Fehler oder eine Änderung mehr als ein Projekt betrifft (oder betreffen könnte), **muss innerhalb der laufenden Session eine Broadcast-Datei angelegt werden** — bevor der Fix deployed wird:

```
maxone-standards/broadcasts/BCAST-YYYY-MM-DD-<slug>.md
```

Ein Broadcast ist kein optionaler Hinweis. Er ist **Pflicht-Gate**: das verursachende Projekt schließt seinen Fix-PR erst, wenn der Broadcast committed ist.

### 2. Zwei Broadcast-Typen

**Typ 1 — Incident Broadcast (reaktiv)**
Ein Fehler ist bereits aufgetreten. Das verursachende Projekt (oder der, der ihn entdeckt) legt den Broadcast an.

**Typ 2 — Change Notice (proaktiv)**
Eine geplante Änderung in Projekt A wird andere Projekte beeinflussen. Broadcast wird angelegt **bevor** die Änderung deployed wird.

### 3. Broadcast-Format

```markdown
# BCAST-YYYY-MM-DD-<slug>

**Typ:** incident | change-notice
**Status:** open
**Verursachend:** <projektname> (oder: infra | maxone-standards)
**Entdeckt / geplant am:** YYYY-MM-DD
**Entdeckt von:** <name>

## Was ist passiert / Was ändert sich

<Kurzer sachlicher Text: was genau hat sich geändert, was gebrochen ist.>

## Fehlermuster (reproduzierbar)

<Konkret: welche Zeile, welcher Aufruf, welche Config war falsch — damit
andere Projekte denselben Ort prüfen können.>

## Betroffene Projekte

| Projekt    | Status   | Fix-Commit / PR | Gelöst am  |
|------------|----------|-----------------|------------|
| stadtlahnflow | open  |                 |            |
| vanfree    | open     |                 |            |
| …          | …        | …               | …          |

## Fix-Muster

<Was muss jedes betroffene Projekt tun? Konkrete Code-Zeilen, Env-Variable,
Config-Key, Route-Name — so präzise, dass jemand ohne Kontext den Fix anwenden
kann.>

## Audit-Grep-Pattern (Pflicht)

<!-- Dieses Pattern wird von audit.mjs für den automatischen Check verwendet.
Leer lassen = kein automatischer Check, Begründung eintragen.             -->
**Datei-Pattern:** `src/**/*.ts` (oder `docker-compose.yml`, `.env.example`, …)
**Fail-Grep:** `<regex der den Fehler aufdeckt>`
**Pass-Grep:** `<regex der beweist dass der Fix angewendet ist>` (optional)

## Abschluss

Broadcast gilt als geschlossen, wenn alle Projekte in der Tabelle `resolved`
tragen. Danach: Status → `closed`, Datei verbleibt als Archiv (nicht löschen).

---

*Angelegt von: <name/claude> — <YYYY-MM-DD HH:MM>*
```

### 4. Auflösung pro Projekt

Wenn ein Projekt seinen Fix deployt hat:
1. Broadcast-Tabelle aktualisieren: `open` → `resolved`, Fix-Commit eintragen
2. Datum eintragen
3. Commit mit Message: `fix(<projekt>): resolve BCAST-YYYY-MM-DD-<slug>`

Kein separater PR nötig — Tabellen-Update kann im gleichen Commit wie der Projekt-Fix (via Subrepo oder direkt in maxone-standards) laufen.

### 5. Cross-Project Cleanup Notice

Wenn ein Projekt über sich selbst hinaus aufräumt — z.B. einen gemeinsam genutzten Endpunkt umbenennt, ein DNS-Record entfernt, eine Supabase-Tabelle umbenennt, einen Env-Variablen-Namen ändert — gilt dasselbe wie für einen Incident, aber Typ `change-notice` mit Status `open` **vor dem Deployment**.

Ziel: andere Projekte haben die Chance zu reagieren, bevor der Schaden eingetreten ist. Wenn alle Projekte die Änderung bestätigt haben (`resolved`), darf deployed werden.

### 6. Broadcasts im `VULN-CATALOG.md`

Closed Broadcasts, die ein allgemeines Fehlermuster offenbart haben (z.B. "hardkodierte Domain in SSR-Fetch-Calls"), werden als Real-World-Incident-Eintrag in `standards/VULN-CATALOG.md` aufgenommen. Der Broadcast selbst bleibt Archiv, der VULN-Eintrag ist die destillierte Regel.

## Warum

Fehler-Typ-Klassifikation, die diese Regel verhindert:

**G5 — Cross-Project Silent Break.** Eine Änderung in Repo A bricht Repo B still — kein Test schlägt an, weil der Test in B die externe Abhängigkeit zu A nicht kennt. Entdeckung nur durch Kundenbeschwerden oder Zufalls-Beobachtung. Typisch: Route-Rename, Domain-Wechsel, Auth-Token-Umbenennung, Env-Variable-Rename, Supabase-Tabellenname.

**G6 — Vergessene Mitbetroffene.** Ein Fix in A wird sorgfältig deployed — aber B, C, D haben denselben Fehler und werden nie fixiert, weil niemand daran gedacht hat, die anderen zu prüfen.

Empirie:
- 2026-04-19: `vector-blue` brach wegen Traefik-Netz-Labeling → Fix nur in vector, pattern hätte alle Blue/Green-Projekte treffen können.
- 2026-04-22: `maxone.studio` → `maxone.one` Domain-Wechsel → hardkodierte Studio-URLs in mehreren Projekten, Entdeckung durch Drift-Check Wochen später.
- Allgemein: jedes Mal wenn Max "Drift" schreibt und wir 5+ Projekte abklappern müssen.

## Wie anwenden

### Als verursachendes Projekt

1. Fehler entdeckt / Änderung geplant → Broadcast-Datei anlegen (Template oben)
2. Alle Projekte im `registry/projects.yml` mental durchgehen: wer könnte betroffen sein?
3. Betroffene in Tabelle eintragen, Status `open`
4. Broadcast committen: `chore(broadcast): BCAST-YYYY-MM-DD-<slug> angelegt`
5. Eigenes Projekt fixen, Tabellen-Zeile auf `resolved` setzen

### Als betroffenes Projekt

1. `audit.mjs` flaggt offene Broadcasts → FAIL wenn kein Fix vorhanden
2. Fix anwenden
3. Broadcast-Tabelle aktualisieren
4. Commit: `fix(<projekt>): resolve BCAST-YYYY-MM-DD-<slug>`

### Beim Audit-Lauf

- `audit.mjs` liest alle `broadcasts/BCAST-*.md`-Dateien
- Parst `Status:` Header
- Bei `Status: open`: prüft für jedes Projekt in der `Betroffene Projekte`-Tabelle ob `resolved` steht
- Falls nicht: `FAIL` für das jeweilige Projekt mit Hinweis auf Broadcast-Datei
- Falls Broadcast >30 Tage alt und noch offene Projekte: `FAIL` + Hinweis "überfällig"
- Falls Audit-Grep-Pattern gesetzt: direkt auf dem Projekt-Repo-Code prüfen (Fail-Grep vorhanden → FAIL)

## Audit

`scripts/audit.mjs` prüft pro Projekt:

- **Offener Broadcast ohne Auflösung:** Projekt steht in `Betroffene Projekte`-Tabelle eines `Status: open`-Broadcasts mit Zeilen-Status `open` → **FAIL** (`"Offener Broadcast [BCAST-…] — Fix fehlt"`)
- **Audit-Grep-Pattern gesetzt:** `Fail-Grep`-Regex trifft auf Projekt-Code zu → **FAIL** (`"Broadcast-Grep-Pattern trifft: [pattern]"`)
- **Broadcast >30 Tage offen** und Projekt noch `open` → **FAIL** (`"Broadcast überfällig: >30 Tage ohne Fix"`)
- **Kein `broadcasts/`-Verzeichnis** im maxone-standards-Repo → **WARN** (`"broadcasts/-Verzeichnis fehlt"`) — erster Hinweis auf nicht eingehaltene Pflicht

## Was das Audit NICHT findet

- Ob ein Broadcast hätte angelegt werden müssen, aber nicht angelegt wurde (retroaktive Erkennung unmöglich)
- Ob das Fix-Muster korrekt ist (inhaltliche Korrektheit ist menschlich)
- Ob eine `change-notice` vor Deployment angelegt wurde (timing-Prüfung nur manuell möglich)
- Ob ein Projekt versehentlich als nicht-betroffen klassifiziert wurde

## Verhältnis zu anderen Standards

- **VULN-CATALOG:** ist die Taxonomie der Klassen. CPIB ist der operative Broadcast für Real-World-Incidents. Geschlossene Broadcasts fließen als Eintrag in VULN-CATALOG.
- **021 (Re-Review-Reminder):** CPIB ist Projekt-zu-Projekt-Kommunikation. 021 ist Projekt-zu-Zeit-Kommunikation (Verfall von Reviews).
- **036 (Spec-Archiv):** Broadcasts sind nicht PRDs. Sie werden nicht in `docs/phases/` archiviert. Sie bleiben in `broadcasts/` — das ist ihr permanentes Archiv.
- **027 (Deploy-Pipeline):** ein `change-notice`-Broadcast kann ein Deploy-Gate sein: ausstehendes `open` in der Tabelle = Deployment blockiert.

## Quellen

- Real-World-Incidents: vector-Traefik-Netz 2026-04-19, Domain-Wechsel 2026-04-22
- Muster: Google's "postmortem culture" — Lernen aus Incidents systematisieren
- User-Direktive 2026-05-11: "Das Regelwerk muss wissen, welcher Fehler durch wen verursacht wurde, und dagegen isoliert werden. Ein Projekt verursacht den Fehler. Die anderen wissen, dass sie ihn nie machen dürfen."
