# 004 — TLS-Zertifikate immer via DNS-01

**Status:** active
**Seit:** 2026-04-22 (User-Direktive nach Vorfall)
**Gilt für:** alle neuen Projekte mit TLS

## Regel

Alle neuen Projekte nutzen den Traefik-ACME-Resolver `letsencrypt` mit
DNS-01-Challenge via INWX. HTTP-01 ist verboten — auch als Fallback.
Bestehende Projekte werden bei nächster Cert-Erneuerung automatisch
umgezogen.

## Warum

HTTP-01 koppelt alle Projekte am Account-Rate-Limit. Ein einzelner kaputter
Container (falscher DNS-Eintrag, gekündigte Domain, etc.) kann das Lets-Encrypt-
Kontingent sprengen und blockiert dann ALLE anderen Projekte auf demselben
Server für bis zu eine Woche. Genau das ist am 2026-04-22 mit
`autoconfig.altrading.eu` passiert. DNS-01 isoliert Projekte voneinander.

## Wie anwenden

Traefik-Label:
```yaml
traefik.http.routers.<name>.tls.certresolver=letsencrypt
```

Resolver ist server-weit auf DNS-01 konfiguriert. INWX-Credentials liegen in
`/opt/secrets/global/inwx.env` (User `vector-agent`), Traefik liest sie via
`env_file`.

Wildcards möglich (sinnvoll bei Projekten mit vielen Subdomains):
```yaml
traefik.http.routers.<name>.tls.domains[0].main=<domain>
traefik.http.routers.<name>.tls.domains[0].sans=*.<domain>
```

## Audit

`scripts/audit.mjs` prüft:
- Auf Server: `traefik.yml` / dynamic config nutzt `dnsChallenge`, nicht
  `httpChallenge`
- Pro Projekt: `docker-compose.yml`-Labels haben `certresolver=letsencrypt`
