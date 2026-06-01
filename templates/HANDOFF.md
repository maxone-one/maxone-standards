# HANDOFF: <PROJEKT>

> Briefing für Claude / neue Mitarbeiter. Vor jeder Arbeit am Projekt erst hier
> reinlesen. Bei Änderungen am Stack, Deploy, Secrets: HIER aktualisieren.

**Letzter Stand:** YYYY-MM-DD
**Verantwortlich:** Max
**Status:** live | dev | paused

## Stand

- Letzter Deploy: YYYY-MM-DD (was wurde deployed?)
- Aktive Probleme: keine | <Liste>
- Offene TODOs: <Liste, mit Verweis auf Issues falls vorhanden>

## Architektur

- **Tech-Stack:** Next.js 15 / SvelteKit / ...
- **Datenbank:** Supabase shared / dediziert / keine
- **Reverse Proxy:** Traefik (maxone-prod) / Caddy (vybora-prod) / ...
- **Mail:** Stalwart auf maxone-prod / keiner

## Domains

- **Live:** <domain>
- **Aliase / Redirects:** <Liste>
- **DNS:** Record-Status, Nameserver

## Container

- `<projekt>-app-blue` / `<projekt>-app-green` (Blue/Green-Swap aktiv?)
- Hilfscontainer: `<projekt>-redis`, etc.

## Deploy

- **Pattern:** Blue/Green | Single
- **CI-Workflow:** `.github/workflows/deploy.yml` (Trigger?)
- **Manuell:** `bash deploy/swap.sh` (welcher Slot, wie testen)

## Secrets

- Liegen in `/opt/secrets/<projekt>/keys.env`
- Letzte Rotation: YYYY-MM-DD (welche Keys?)
- Drive-Backup: vorhanden | fehlt

## Tests

- **Smoke:** `node test/smoke.mjs`, was wird getestet?
- **Unit:** `npm test`, welche Logik?
- **Staging:** `SITE=<staging-url> npm test`

## Bekannte Eigenheiten

- <Was ist nicht offensichtlich aus Code/Configs?>
- <Welche historischen Entscheidungen sind wichtig zu kennen?>
- <Welche Bugs sind bereits aufgetreten und wie wurden sie gelöst?>
