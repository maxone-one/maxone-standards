# SUNSET: <Projektname>

**Sunset-Datum:** YYYY-MM-DD
**Status:** sunset-pending | sunset
**Verantwortlich:** <Name>
**Letzter Live-Tag:** YYYY-MM-DD

---

## A. Entscheidung & Begründung

<Warum wird das Projekt stillgelegt? 1-3 Absätze.>

- Hauptgrund:
- Stakeholder-Entscheidung am: YYYY-MM-DD
- Alternative geprüft (warum verworfen):

## B. Datenexport

| Datenart | Quelle | Ziel | Format | Datum | Status |
|---|---|---|---|---|---|
| DB Schema + Daten | supabase-`<projekt>` | Drive: Sunset-Archiv/<projekt>/db.sql.gz | pg_dump | YYYY-MM-DD | ☐ |
| Storage-Bucket | supabase storage `<bucket>` | Drive: …/storage/ | tar.gz | YYYY-MM-DD | ☐ |
| User-Liste | DB-Query `users` | Drive: …/users.csv | CSV | YYYY-MM-DD | ☐ |
| Mail-Templates | Brevo Account | Drive: …/brevo-templates.json | JSON | YYYY-MM-DD | ☐ |

**Aufbewahrungsfrist:** <typ. 6 Jahre Customer-Daten / 3 Jahre intern>
**Löschdatum-Reminder:** YYYY-MM-DD (Drive-Erinnerung gesetzt: ☐)

## C. Drittdienste-Bereinigung

| Dienst | Aktion | Datum | Bestätigung |
|---|---|---|---|
| Brevo | Account paused, Templates exportiert | YYYY-MM-DD | ☐ |
| Stripe | Subscriptions canceled, Webhook off | YYYY-MM-DD | ☐ |
| Supabase | Project paused (30d Grace) | YYYY-MM-DD | ☐ |
| Sentry / Plausible / Umami | Property gelöscht | YYYY-MM-DD | ☐ |
| Cloudflare / Vercel | Project deleted | YYYY-MM-DD | ☐ |

## D. Infrastruktur

- Container gestoppt: ☐ am YYYY-MM-DD
- Image gelöscht: ☐
- `/opt/<projekt>/` auf Drive gesichert: ☐ Pfad: `…`
- `/opt/secrets/<projekt>/` auf Drive gesichert: ☐ Pfad: `…`
- Server-Verzeichnisse gelöscht: ☐
- Volumes gesichert + gelöscht: ☐

## E. DNS + Cert

- A-Record bei INWX: ☐ entfernt / ☐ auf Wartungs-Container umgeleitet
- Cert läuft aus am: YYYY-MM-DD (kein Renewal mehr)
- Wartungs-Container läuft: ☐ (URL: …)

## F. Domain-Lifecycle

- [ ] Behalten + Wartungs-Seite (Begründung: …)
- [ ] Behalten + Redirect auf <ziel-url>
- [ ] Freigeben am: YYYY-MM-DD (nächstes Renewal-Datum)

## G. Repo

- [ ] Letzter Commit verlinkt SUNSET.md
- [ ] `registry/projects.yml` status auf `sunset`
- [ ] GitHub-Repo archiviert (Settings → Archive)
- [ ] Repo-Description um „[ARCHIVED, sunset YYYY-MM-DD]" ergänzt

## H. VECTOR & Monitoring

- [ ] VECTOR-Auto-Discovery deaktiviert
- [ ] Telegram-Alerts entfernt
- [ ] Healthcheck-Crons aus

---

## Sunset Sign-Off

**Vorgeschlagen von:** <Name>, am YYYY-MM-DD
**Reviewed von:** <Name>, am YYYY-MM-DD
**Endgültig bestätigt:** ☐ am YYYY-MM-DD durch <Name>
