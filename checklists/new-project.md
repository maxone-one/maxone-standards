# Checkliste: Neues Projekt anlegen

Anwendung bei eigenen UND Kundenprojekten. Erst alle Punkte abhaken, dann
kann das Projekt als "live-ready" gelten.

## Setup (lokal)

- [ ] Ordner: `c:\Users\max\Projects\<projekt>\`
- [ ] Workspace: `<projekt>.code-workspace`
- [ ] Eintrag in VS Code Project Manager (`projects.json`)
- [ ] Eintrag in `maxone-standards/registry/projects.yml`
- [ ] Git-Repo unter `maxone-one` (private!)
- [ ] `.gitignore` mit allen AI-Umgebungs-Configs (siehe CLAUDE.md "Multi-Umgebung")

## Server-Vorbereitung

- [ ] DNS-A-Record für Domain (kein Wildcard auf `*.maxone.one`)
- [ ] Ordner: `/opt/<projekt>/` auf Server
- [ ] `HANDOFF.md` auf Server (Template aus `maxone-standards/templates/`)
- [ ] Secrets: `/opt/secrets/<projekt>/keys.env` (Permissions 700/600)
- [ ] Brevo-Account angelegt (wenn Mail nötig), eigener SMTP-Key

## Deploy-Setup

- [ ] `docker-compose.yml` aus `templates/docker-compose.blue-green.yml`
- [ ] `image:` UND `build:` Felder gesetzt (kein Build auf Prod!)
- [ ] Healthcheck mit `start_period: 30s`
- [ ] Traefik-Labels mit `certresolver=letsencrypt` (DNS-01)
- [ ] `mem_limit: 2g` gesetzt
- [ ] GitHub-Actions-Workflow für Build (auf self-hosted Runner `voltfair-server`)

## Tests

- [ ] `test/smoke.mjs` mit kritischen Endpoints
- [ ] `test/units.mjs` mit Golden-Reference
- [ ] `TESTING.md` ausgefüllt (was IST abgedeckt, was NICHT)
- [ ] `package.json`: `scripts.test`

## Doku

- [ ] `README.md` (öffentlich-tauglich, ohne Interna)
- [ ] `HANDOFF.md` auf Server (Stand, Architektur, Eigenheiten)
- [ ] In `maxone-standards/registry/projects.yml` eingetragen

## Audit

- [ ] `node scripts/audit.mjs --project=<projekt>` läuft grün
