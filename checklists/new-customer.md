# Checkliste: Neuer Kunde

Bei Kundenprojekten gibt es zusätzliche Punkte über `new-project.md` hinaus.
Diese Checkliste sicherstellt, dass Kunden-Projekte nicht den gleichen
"funktioniert-mal-funktioniert-mal-nicht"-Status haben wie eigene Projekte.

## Verträge & Verantwortlichkeit

- [ ] Schriftliche Beauftragung (Scope, Preis, Frist)
- [ ] Zugriffsrechte geklärt (Domain-Inhaber, DNS-Hoheit, Repo-Zugriff)
- [ ] Datenschutz: AVV unterschrieben falls Daten verarbeitet werden
- [ ] Eskalations-Kontakt beim Kunden (E-Mail + Telefon)

## Technische Trennung

- [ ] Eigener Brevo-Account (kein Shared-Key, siehe Standard 003)
- [ ] Eigene Subdomain / Domain unter Kontrolle des Kunden ODER von Max
- [ ] Eigene Container-Namen (`<kunde>-<projekt>-*`, nicht generisch)
- [ ] DB getrennt (eigene Supabase-Instanz oder eigenes Schema)

## Dokumentation

- [ ] `HANDOFF.md` ausführlich (auch für späteren Übergeber-Wechsel tauglich)
- [ ] `README.md` ohne Interna (Kunde darf reinschauen)
- [ ] Notfall-Runbook (was tun wenn Site down ist, wer ist erreichbar)

## SLA

- [ ] Verfügbarkeitszusage dokumentiert (z.B. 99% / Mo-Fr 9-18 Uhr)
- [ ] Monitoring eingerichtet (VECTOR Health-Check + Telegram-Alarm)
- [ ] Backup-Frequenz festgelegt und getestet (Restore mind. 1x geübt)

## Tests

- [ ] Mindestens das, was `005-test-first.md` fordert
- [ ] Plus: ein Akzeptanz-Test pro Customer-User-Story
- [ ] Plus: Browser-Test der wichtigsten 3 User-Flows

## Übergabe

- [ ] Kunde hat schriftliche Doku (PDF / Notion-Link)
- [ ] Kunde weiß, wen er bei Problemen kontaktiert
- [ ] Erste 2 Wochen erhöhte Aufmerksamkeit (täglicher Smoke-Check)
