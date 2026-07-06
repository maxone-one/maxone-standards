# 005: Pfade und Container-Naming

**Status:** active
**Seit:** etabliert, formalisiert 2026-04-27
**Gilt für:** alle Projekte

## Regel

Konsistente Pfade und Container-Namen über alle Projekte hinweg.

## Warum

Wenn jedes Projekt seine eigenen Konventionen hat (`/srv/foo`, `/var/app/bar`,
`/opt/baz/code`), dann muss jeder Befehl projekt-spezifisch nachgeschlagen
werden. Ein konsistentes Schema macht Cross-Projekt-Operationen (Audits,
Backups, Updates) trivial.

## Konventionen

**Server-Pfade:**
- `/opt/<projekt>/`, Code, docker-compose.yml, .env
- `/opt/<projekt>/HANDOFF.md`, Briefing (siehe 006)
- `/opt/secrets/<projekt>/keys.env`, Secrets (siehe 003)
- `/opt/backups/<projekt>/`, Lokale Backups vor DB-Restore

**Lokale Pfade (Windows):**
- `c:\Users\max\Projects\<projekt>\`, Repo-Root
- `c:\Users\max\Projects\<projekt>\<projekt>.code-workspace`, Workspace

**Container-Namen:**
- Single: `<projekt>-app`
- Blue/Green: `<projekt>-app-blue`, `<projekt>-app-green`
- DB: `<projekt>-db` (wenn projekt-eigene DB)
- Supabase-Stack: `<projekt>-{auth,rest,kong,storage}`
- Hilfs-Container: `<projekt>-redis`, `<projekt>-worker`, etc.

**Domains:**
- Eigene Brand → eigene Domain (`maxone.one`, `voltfair.de`)
- Subprojekte → `<name>.maxone.one` (DNS-Record einzeln, kein Wildcard)
- Niemals neue Resourcen auf `maxone.studio` (siehe 008)

**Docker-Netzwerke (2026-07-06):**
- Schema `<scope>-<tier>`.
- Geteiltes Edge-Netz (Traefik-Routing, alle Container): `maxone-public`. Ein einziges Netz, kein Splitting pro Projekt (Traefik-Routing-Komplexität ohne Nutzen).
- Privates Projekt-Netz (DB/interne Services): `<projekt>-private`, ersetzt bisher compose-autogenerierte Namen (`<projekt>_<projekt>-internal` o.ä.).
- Ersetzt das verwaiste Coolify-Relikt-Netz `coolify` (Alt-Alias-Kollisionen zwischen Kundenprojekten, siehe Vorfall 2026-06-05). Rollout welle-weise, kein Big-Bang: Welle 1 bei `maxone-sign` bereits umgesetzt, Rest der Plattform folgt opportunistisch bei nächstem Anfassen des jeweiligen Projekts.

## Audit

`scripts/audit.mjs` prüft:
- Container-Namen matchen Schema (`<projekt>-app(-blue|-green)?`)
- Server-Pfad existiert: `/opt/<projekt>/`
- Lokal: `c:\Users\max\Projects\<projekt>\<projekt>.code-workspace` existiert
