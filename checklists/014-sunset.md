# Checkliste: 014: Sunset

Pflicht beim Stilllegen jedes Projekts. Reihenfolge ist wichtig, erst
Daten sichern, dann erst abreißen.

---

## A. Entscheidung & Kommunikation

- [ ] Sunset-Entscheidung mit Datum + Begründung in `SUNSET.md` festgehalten
- [ ] Verantwortlicher benannt (Max selbst oder Stakeholder)
- [ ] Stakeholder informiert (Kunden, Team, Beteiligte): Datum +
      Datenexport-Frist + Folgewirkung
- [ ] `registry/projects.yml`: status auf `sunset-pending`

## B. Datenexport (DSGVO Art. 17 + 20)

- [ ] DB-Dump (`pg_dump --schema-only` + `pg_dump --data-only`) auf
      Drive: `Sunset-Archiv/<projekt>/<YYYY-MM-DD>/db.sql.gz`
- [ ] Storage-Bucket-Export (Supabase Storage / S3 / lokal):
      auf Drive im selben Ordner
- [ ] Mail-Export (falls projekt-eigene Postfächer):
      Stalwart `--export` oder Brevo Template-Backup
- [ ] User-Liste mit Mailadressen exportiert (für Sunset-Notification)
- [ ] Export-Format und Pfad in `SUNSET.md` Section B dokumentiert
- [ ] Aufbewahrungsfrist im Archiv festgelegt (typisch:
      6 Jahre bei Customer-Daten, Steuer-/Aufbewahrungsfristen,
      sonst 3 Jahre)

## C. Drittdienste-Bereinigung

Pro Eintrag aus 013 Section D bzw. 015 Section „Externe Dienste":

- [ ] **Brevo**: Account-Status auf disabled, SMTP-Key in Secrets
      Store als „retired" markiert, Templates archiviert
- [ ] **Stripe**: Subscriptions canceled, Webhook deaktiviert,
      Account-Modus auf „inactive" oder Account geschlossen
- [ ] **Supabase**: Snapshot in `/opt/secrets/<projekt>/snapshot.sql.gz`,
      dann Project paused (nicht direkt deleted, 30d Grace)
- [ ] **Sentry / Plausible / Umami**: Daten exportiert, Property gelöscht
- [ ] **Externe APIs (OpenAI, Anthropic, Brevo etc.)**: API-Keys
      rotiert oder revoked
- [ ] **Cloudflare / Vercel / Netlify**: Project deleted, kein
      Edge-Cache mehr
- [ ] AVV-Bestätigung der Kündigung im Drive abgelegt (falls
      Anbieter eine schickt)

## D. Infrastruktur Tear-Down

- [ ] Container gestoppt (`docker compose down --remove-orphans`)
- [ ] Image gelöscht (`docker image rm <image>`)
- [ ] Volume-Backup auf Drive (`docker run --rm -v <vol>:/data
      busybox tar czf - /data | gzip > <vol>.tar.gz`)
- [ ] Volume gelöscht (`docker volume rm`)
- [ ] `/opt/<projekt>/` auf Drive gesichert, dann auf Server gelöscht
- [ ] `/opt/secrets/<projekt>/` auf Drive gesichert, dann auf Server
      gelöscht (Secrets-Store-Hierarchie aus CLAUDE.md beachten
      Drive-Backup ist Pflicht)
- [ ] Docker-Netzwerke geprüft auf hängende Endpoints
      (`docker network inspect coolify`)
- [ ] Traefik-Labels weg (folgt automatisch aus Container-Stop)

## E. DNS + Cert

- [ ] DNS-A-Record bei INWX entfernt ODER auf Wartungs-Container umgeleitet
- [ ] CAA-Record bereinigt (falls projekt-spezifisch)
- [ ] Cert läuft natürlich aus (kein manueller Eingriff nötig, Traefik
      versucht keine Renewal mehr für nicht-vorhandene Domain)
- [ ] Wartungs-Seite-Container (falls Domain bleibt) liefert HTTP 200
      mit Hinweis „Service eingestellt am DD.MM.YYYY"

## F. Repo-Archivierung

- [ ] `SUNSET.md` finalisiert + committet
- [ ] `registry/projects.yml`: status von `sunset-pending` auf `sunset`
- [ ] Letzter Commit auf `main` referenziert SUNSET.md
- [ ] GitHub: Settings → „Archive this repository" (read-only)
- [ ] Repo-Beschreibung um „[ARCHIVED, sunset YYYY-MM-DD]" ergänzen
- [ ] CI-Workflows deaktiviert / kostenlose Runner-Minuten nicht weiter
      gebrannt

## G. VECTOR & Monitoring

- [ ] VECTOR-Auto-Discovery deaktiviert für dieses Projekt
- [ ] Telegram-Alerts für dieses Projekt aus VECTOR-Konfig entfernt
- [ ] Grafana / Uptime-Robot / Healthcheck-Cron für dieses Projekt aus
- [ ] Teststrecke (`test/smoke.mjs`) im Repo bleibt zur Doku, wird aber
      nicht mehr ausgeführt

## H. Domain-Lifecycle-Entscheidung

- [ ] Entscheidung getroffen: Behalten + Wartungs-Seite / Behalten +
      Redirect / Freigeben
- [ ] Bei Behalten: Wartungs-Container läuft, Cert wird weiter erneuert
- [ ] Bei Freigeben: Domain wird beim nächsten Renewal-Datum nicht
      verlängert; Datum in `SUNSET.md` notiert
- [ ] Bei Redirect: Ziel-URL dokumentiert in `SUNSET.md`

---

## Sunset-Lebenszyklus-Quick-Reference

```
status: live
   │
   ├── Entscheidung „abschalten"
   │
   ▼
status: sunset-pending      ← max. 30 Tage in diesem Status
   │     SUNSET.md erstellt
   │     Daten exportiert
   │     Drittdienste gekündigt
   │     Container gestoppt
   │     DNS entfernt
   ▼
status: sunset              ← unbegrenzt
   │     Repo bleibt aktiv (für Lookups)
   │
   ├── (optional) GitHub-Archive
   ▼
status: archived            ← Repo read-only, nicht mehr in Registry
```
