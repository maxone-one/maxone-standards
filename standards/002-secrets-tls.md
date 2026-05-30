# 002 — Secrets & TLS (Zentraler Store · DNS-01-Pflicht)

**Status:** active
**Seit:** 2026-03 (Store), 2026-04-22 (TLS)
**Gilt für:** alle Projekte auf maxone-prod

## Inhalt

- [A] Zentraler Secrets-Store
- [B] TLS via DNS-01 (niemals HTTP-01)

---

## A — Zentraler Secrets-Store

Alle Secrets liegen unter `/opt/secrets/<projekt>/keys.env` auf maxone-prod als Single Source of Truth. Globale Keys (Brevo API, INWX) unter `/opt/secrets/global/`. Projekt-`.env` referenziert vom Store — nie umgekehrt.

**Struktur:**

```
/opt/secrets/
├── global/
│   ├── keys.env          # BREVO_API_KEY, etc.
│   └── inwx.env          # DNS-01 Credentials für Traefik
├── stalwart/
│   └── keys.env
└── <projekt>/
    └── keys.env
```

**Permissions:** 700 auf Ordner, 600 auf Dateien (nur root).

**Rotation-Reihenfolge (immer exakt so):**
1. Neuen Key generieren
2. In Store speichern
3. In ALLE betroffenen Projekt-`.env` kopieren
4. Container `--force-recreate`
5. JEDEN Endpunkt testen
6. Drive-Backup
7. VECTOR informieren
8. Alten Key löschen — nur wenn alles grün

**Niemals:**
- Credentials im Klartext in CLI-Befehlen (`docker exec -e`, `curl -u`, `ssh ... "echo KEY"`)
- Credentials nur in Projekt-`.env` ohne Store-Eintrag
- Passwörter ungefragt ändern
- Eigene Secrets generieren und stillschweigend eintragen

**Backup:** Google Drive `Meine Ablage/00. Kunden & Projekte/Claude/Secrets Store/`.

**Warum:** Vor dem Store waren Secrets in 11 verschiedenen Projekt-`.env`-Dateien, oft veraltet. Vorfall 2026-03-24: Cross-Projekt-Brevo-SMTP-Key war geteilt → Key-Rotation betraf alle Projekte.

---

## B — TLS via DNS-01 (niemals HTTP-01)

Alle neuen Projekte nutzen Traefik-ACME-Resolver `letsencrypt` mit DNS-01-Challenge via INWX. HTTP-01 ist **verboten** — auch als Fallback.

**Traefik-Label:**
```yaml
traefik.http.routers.<name>.tls.certresolver=letsencrypt
```

INWX-Credentials: `/opt/secrets/global/inwx.env` (User `vector-agent`). Traefik liest via `env_file`.

**Wildcards** (sinnvoll bei vielen Subdomains):
```yaml
traefik.http.routers.<name>.tls.domains[0].main=<domain>
traefik.http.routers.<name>.tls.domains[0].sans=*.<domain>
```

**INWX API-Endpoint:** `https://api.domrobot.com/jsonrpc/` — NICHT `api.inwx.de` (dauerhaft unerreichbar).

**Warum:** HTTP-01 koppelt alle Projekte am Account-Rate-Limit. Ein einzelner kaputter Container kann das Let's-Encrypt-Kontingent sprengen und blockiert alle anderen Projekte für bis zu eine Woche. DNS-01 isoliert Projekte voneinander.

---

## Audit

`scripts/audit.mjs` prüft:

**Secrets:**
- Existenz `/opt/secrets/<projekt>/keys.env` für jedes Projekt (per SSH)
- Permissions 700/600
- Drive-Backup-Datum

**TLS:**
- `traefik.yml` / dynamic config nutzt `dnsChallenge`, nicht `httpChallenge`
- Pro Projekt: `docker-compose.yml`-Labels haben `certresolver=letsencrypt`
