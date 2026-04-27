# 014 — Sunset (Stilllegung von Projekten)

**Status:** active
**Seit:** 2026-04-27
**Gilt für:** alle Projekte, die nicht mehr aktiv betrieben werden sollen

## Regel

Wenn ein Projekt stillgelegt wird, läuft es durch einen definierten
Sunset-Prozess statt zu „verwaisen". Der Endzustand ist nachweisbar:

- **Status** im `registry/projects.yml` auf `sunset` (oder
  `sunset-pending` während der Übergangsphase)
- **`SUNSET.md`** im Projekt-Repo dokumentiert Datum, Grund,
  Datenexport, Drittdienste-Bereinigung und Verantwortlichen
- **Keine laufenden Container, kein DNS-A-Record auf eigene Server,
  keine Secrets-Einträge** mehr (außer was bewusst archiviert ist)
- **Repo bleibt erhalten**, aber als GitHub-Archive markiert

## Warum

Zwei aktuelle Schwebezustände aus dem 2026-04-27-Audit zeigen das
Problem:

- **vanfree** (`planexo.io`) — Code wurde umbenannt, aber Server-
  Container heißt weiter `planexo-app`, TLS-Cert ist defekt
  (Standard 019 FAIL), Domain `planexo.io` muss noch entschieden werden
  (behalten als Brand-Schutz oder freigeben?). Im Repo steht nirgendwo
  der Sunset-Plan.
- **plansey** — DNS zeigt auf Cloudflare-IPs (Standard 019 WARN),
  HTTP 404 (Standard 017 WARN), Container läuft aber als
  `plansey-app` weiter auf maxone-prod. Repo ist „live", de facto
  ist es ein Zombie.

Konkrete Risiken eines unkontrolliert verwaisten Projekts:

- **DSGVO Art. 17 / 32**: Kunden-Daten verlieren irgendwann ihren
  Zweck — Aufbewahrung ohne Zweck ist verbots-relevant. AVV mit
  Brevo/Stripe/Supabase laufen weiter, ohne dass jemand sie pflegt.
- **Tracker feuern weiter**: Ein verwaister Frontend-Bundle mit
  Google Analytics produziert weiter Personenbezug ohne Rechtsgrundlage
  (Standard 017 + LG München I).
- **Domain-Übernahme-Risiko**: Wenn eine ehemals beworbene Domain
  freigegeben wird, kann ein Dritter sie holen und unter dem alten
  Brand Phishing/Tracking betreiben — siehe „expired domain abuse".
- **Server-RAM**: Zombie-Container blockieren Memory + Ports auf
  maxone-prod. OOM-Risiko nach CLAUDE.md-Doku (Coolify-Migration
  hat das mehrfach gezeigt).

Sunset ist also kein Aufräumen-aus-Ordnungssinn — es ist eine
DSGVO-, Brand- und Infrastruktur-Pflicht.

## Wie anwenden

### Sunset-Status-Lebenszyklus

```
live  ──(Entscheidung)──>  sunset-pending  ──(Migration durch)──>  sunset
                                                                       │
                                              ──(Repo-Archivierung)─── ┴─> archived
```

- **`sunset-pending`** — Entscheidung getroffen, Daten-Export läuft,
  Drittdienste werden gekündigt. Maximal 30 Tage in diesem Status,
  sonst Audit-WARN.
- **`sunset`** — technisch tot (kein Container, kein DNS auf eigenen
  Server), aber Repo + Daten-Archiv noch erreichbar. Ohne Zeitlimit.
- **`archived`** — Repo auf GitHub als Archive geflagged, kein
  weiterer Pflege-Anspruch. (Aktuell nicht in der Registry, separat
  zu pflegen.)

### Pflicht-Schritte

1. **Entscheidung dokumentieren** (CONCEPT.md letzter Abschnitt oder
   direkt in `SUNSET.md`):
   - Datum, Grund, Verantwortlicher, betroffene Stakeholder
2. **Datenexport** für alle Kunden / Nutzer / Stakeholder:
   - Datenbank-Export (`pg_dump` mit Schema + Daten) in
     `Drive: Sunset-Archiv/<projekt>/`
   - User-Export-Mail mit DSGVO-Hinweisen Art. 17 + Aufbewahrungspflicht
   - Exportformat dokumentiert in `SUNSET.md` Section B
3. **Drittdienste bereinigen** (jeden Eintrag aus 013-D / 015-D abarbeiten):
   - Brevo: Account/SMTP-Key disabled, Templates archiviert
   - Stripe: keine neuen Charges, alte Subscriptions canceled
   - Supabase: Datenbank-Snapshot, dann Project paused/deleted
   - Plausible/Umami: Dashboard archiviert oder gelöscht
   - Sentry / Logging: Daten exportiert, Account paused
4. **Infrastruktur abbauen** (`status: sunset-pending` → `sunset`):
   - Container stoppen + entfernen (`docker compose down`)
   - Image purge (`docker image rm`)
   - `/opt/<projekt>/` auf Drive sichern, dann auf Server löschen
   - `/opt/secrets/<projekt>/` auf Drive sichern, dann auf Server löschen
   - Traefik-Labels entfernen (Container weg = Labels weg)
5. **DNS + Cert**:
   - A-Record entfernen (oder auf Wartungs-Seite umleiten)
   - Cert läuft natürlich aus (kein Renewal mehr)
   - Falls Domain behalten: A-Record auf einen statischen Wartungs-
     Container (Hinweis-Seite) — siehe `templates/sunset-page.html`
     (TODO)
6. **Repo-Archivierung**:
   - `SUNSET.md` committen
   - GitHub: Settings → „Archive this repository" (Repo wird read-only)
   - `registry/projects.yml`: status auf `sunset`
7. **VECTOR informieren**:
   - VECTOR-Auto-Discovery soll das Projekt nicht mehr erwarten
     (kein Health-Check, kein Telegram-Alarm)

### Domain-Lifecycle (separate Entscheidung)

| Option | Wann | Risiko |
|---|---|---|
| **Behalten** + Wartungs-Seite | Brand-relevant, möglicher Re-Launch | Cert + Hosting-Kosten weiter |
| **Behalten** + Redirect auf Hauptmarke | Verwandte Domain | minimal |
| **Freigeben** | Reine Test-Domain ohne Brand | Übernahme durch Dritten möglich |

**Faustregel:** Customer-facing Domain ≥ 6 Monate live → mindestens
2 Jahre nach Sunset behalten + Wartungs-Seite mit
„Service eingestellt am DD.MM.YYYY"-Hinweis.

## Audit

`scripts/audit.mjs` prüft pro Projekt mit `status` in `{sunset-pending,
sunset}`:

1. **`SUNSET.md` muss existieren** — Pflichtfelder geprüft (Datum,
   Grund, Verantwortlicher)
2. **Bei `sunset-pending`**: Datum aus `SUNSET.md` Header lesen, wenn
   `> 30 Tage` her → WARN ("zu lange in Schwebe — entweder live machen
   oder zu sunset migrieren")
3. **Bei `sunset`**: SSH-Check ob Container noch läuft → FAIL
   (Endzustand verlangt Container-Tear-Down)
4. **Bei `sunset`**: DNS-Check ob A-Record noch auf eigene Server-IP
   zeigt → WARN (Domain-Lifecycle-Entscheidung dokumentieren)

Andere Standards (013, 015, 017–019) skippen automatisch bei
`status != live`, damit Sunset-Projekte keine FAILs für nicht
mehr existierende Pflichten produzieren.

## Was das Audit NICHT findet

- **Datenexport-Vollständigkeit** — ob `pg_dump` wirklich alle Tabellen
  enthielt, ist nicht prüfbar. Verantwortung des Sunset-Owners.
- **AVV-Kündigung beim Drittanbieter** — keine API gibt zuverlässig
  Auskunft, ob Brevo-Account wirklich „closed" ist. Manuell prüfen.
- **GitHub-Archive-Status** — würde GitHub-API-Call brauchen, ist
  separat zu prüfen (`gh repo view <repo> --json isArchived`).
- **Drive-Archiv-Existenz** — Drive ist nicht Audit-zugänglich, manuell.
