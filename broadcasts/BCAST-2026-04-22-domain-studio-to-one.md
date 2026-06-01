# BCAST-2026-04-22-domain-studio-to-one

**Typ:** change-notice
**Status:** closed
**Verursachend:** infra (Domain-Migration)
**Entdeckt / geplant am:** 2026-04-16
**Entdeckt von:** Max Karastelev

## Was ist passiert / Was ändert sich

`maxone.studio` wurde ab 2026-04-16 produktiv abgeschaltet. Alle Subdomains
(`*.maxone.studio`) sind seither nicht mehr öffentlich erreichbar. Die neue
Primär-Domain ist `maxone.one`.

## Fehlermuster (reproduzierbar)

Hardkodierte `maxone.studio`-URLs in Projekt-Code:
- `fetch('https://api.maxone.studio/...')`
- `NEXT_PUBLIC_VECTOR_URL=https://agent.maxone.studio`
- `href="https://maxone.studio/impressum"`
- Traefik-Labels mit `maxone.studio`-Hostname-Regeln

## Betroffene Projekte

| Projekt       | Status   | Fix-Commit / PR | Gelöst am  |
|---------------|----------|-----------------|------------|
| stadtlahnflow | resolved | deploy cleanup  | 2026-04-22 |
| vanfree       | resolved | infra sweep     | 2026-04-22 |
| vector        | resolved | identity update | 2026-04-22 |
| snapflow      | resolved | env cleanup     | 2026-04-22 |
| katchi        | resolved | infra sweep     | 2026-04-22 |
| plansey       | resolved | infra sweep     | 2026-04-22 |
| repivot       | resolved | infra sweep     | 2026-04-22 |

## Fix-Muster

1. Alle `.env`, `.env.example`, `.env.local`-Dateien: `maxone.studio` → `maxone.one`
2. Traefik-Labels in `docker-compose.yml`: `Host(\`app.maxone.studio\`)` → `Host(\`app.maxone.one\`)`
3. Hardkodierte URLs in Quellcode: `grep -r 'maxone\.studio' src/`
4. CLAUDE.md, README, Dokumentation mitkorrigieren

## Audit-Grep-Pattern (Pflicht)

**Datei-Pattern:** `src/**/*.{ts,tsx,js,jsx}` + `docker-compose.yml`
**Fail-Grep:** `maxone\.studio`
**Pass-Grep:** (leer, Abwesenheit des Fail-Patterns ist Beweis)

## Abschluss

Geschlossen: alle Projekte resolved. VULN-Eintrag: G5 Cross-Project Silent Break
(domain-hardcoding) in VULN-CATALOG.md Abschnitt G.

---

*Angelegt von: Claude (Max Karastelev), 2026-05-11 (retroaktiv)*
