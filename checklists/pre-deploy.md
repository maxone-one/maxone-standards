# Checkliste: Pre-Deploy

Vor jedem Deploy auf Prod abhaken. Bei Kundenprojekten: PFLICHT.

## Code

- [ ] `git status` clean (kein Uncommitted)
- [ ] Build lokal grün (`npm run build`)
- [ ] Tests lokal grün (`npm test`)
- [ ] Keine Secrets im Code (`git diff` auf `KEY|TOKEN|SECRET`)

## Server-Status

- [ ] Server hat Memory frei (`free -h` — mindestens 2 GB frei)
- [ ] Andere Container healthy (`docker ps` — keine Restarting)
- [ ] Backup der DB vorhanden (falls Schema-Änderung)

## Deploy-Workflow

- [ ] Image-Build läuft auf CI / lokal — NICHT auf Prod
- [ ] Image-Tag ist eindeutig (Commit-SHA, kein `:latest`-only)
- [ ] Blue/Green: alter Slot bleibt aktiv bis neuer healthy

## Post-Deploy (sofort)

- [ ] Smoke-Tests grün (`npm test`)
- [ ] Logs check (`docker logs <projekt>-app-<active-slot> --tail 50`)
- [ ] Manueller Browser-Check der Hauptfunktion
- [ ] Erst DANN dem User "ist live" sagen
