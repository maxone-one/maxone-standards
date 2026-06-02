# 006: Domain-Policy: .one statt .studio

**Status:** active
**Seit:** 2026-04-16 (User-Direktive)
**Gilt für:** alle neuen Resourcen

## Regel

Alle neuen Resourcen (Subdomains, Mail-Sender, DNS-Records, OAuth-Apps,
Service-URLs, Doku-Links) werden auf `maxone.one` angelegt, nie auf
`maxone.studio`.

## Warum

`*.maxone.studio` ist seit 2026-04-16 produktiv abgeschaltet. ALLE
Traefik-Router auf maxone-prod wurden auf `*.maxone.one` umgestellt.
User-Direktive: "alles auf .one, nie wieder .studio (vorerst nicht)".

## Ausnahme

`mail.maxone.studio` + `autoconfig.maxone.studio` bleiben aktiv (Stalwart
Mail-Server, MX/SPF/DKIM/Autoconfig-Clients). Migration ist invasiv und
separat zu planen, nicht in dieser Regel umfasst.

## Wie anwenden

Bei neuen Subdomains auf `*.maxone.one`:
- Vorher prüfen: existiert DNS-A-Record? (Kein Wildcard auf `*.maxone.one`!)
- Jeder Subdomain einzeln. Ohne DNS kein SSL-Cert von Lets Encrypt.

## Infra-Hostname-Gesetz (2026-06-02)

Infrastruktur-Subdomains immer neutral nach Schema:

```
{dienst}.{projekt}.maxone.one
```

Beispiele:
- `db.venfree.maxone.one` (Supabase/Postgres für venfree)
- `api.venfree.maxone.one` (REST-API für venfree)
- `db.vector.maxone.one` (VECTOR-Datenbank)
- `mail.maxone.one` (Zentraler Mailserver)

**Verboten:** Projektnamen als Hostnamen die nicht mehr gelten (`planexo-api`),
Personennamen, Marketing-Namen, temporäre Bezeichnungen.

**Warum:** Hostnamen sind langlebig. Sie überdauern Rebrands, Team-Wechsel und
Projekt-Renames. Ein neutrales Schema verhindert dass interne Infra-URLs in
Logs, Zertifikaten und DNS-Records den alten Projektnamen festigen.

## maxone.one als Dach (2026-06-02)

`maxone.one` ist das neutrale Routing-Dach für alle Systeme. Alles wird
darüber geroutet. Die vier Welten darunter:

| Domain | Zweck |
|--------|-------|
| `maxone.work` | Dienst & Leistung |
| `maxone.pro` | Expertise |
| `maxone.studio` | SaaS & Tools |
| `maxone.tech` | Hardware & Devices |

## Audit

`scripts/audit.mjs` prüft:
- `registry/projects.yml`: keine `domain: *.maxone.studio` (außer mail/autoconfig)
- `docker-compose.yml` aller Projekte: keine Traefik-Hosts auf `.maxone.studio`
- Infra-Hostnamen folgen Schema `{dienst}.{projekt}.maxone.one`
