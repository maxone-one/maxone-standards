# 051 — DB-Isolation: ein Projekt, eine Datenbank

**Status:** active
**Seit:** 2026-05-18
**Gilt für:** alle Projekte mit persistenter Datenhaltung

## Regel

Jedes Projekt betreibt seine eigene, isolierte Datenbankinstanz.
Keine zwei Projekte teilen sich denselben Supabase-Projekt-URL oder
dieselbe PostgreSQL-Datenbankinstanz.

> "Ein Projekt, eine Datenbank — keine Ausnahmen."

## Was verboten ist

| Verstoß | Beispiel | Schwere |
|---------|----------|---------|
| Selbe Supabase-URL in zwei Projekten | `repivot` und `maxone.one` beide auf `panel.maxone.one` | FAIL |
| Direktverbindung auf Container einer anderen Instanz | `DATABASE_URL=postgresql://...@supabase-db:5432/postgres` aus fremdem Projekt | FAIL |
| Shared Supabase Cloud Project | zwei Projekte auf `https://xyz.supabase.co` | FAIL |
| `supabase_url`-Feld in `projects.yml` fehlt | kein Wert, kein `null` (internes Tool ohne DB ist OK) | WARN |

## Was erlaubt ist

- **API-Zugriff auf andere Projekte:** Ein Projekt darf über die öffentliche API
  (`https://api.stadtlahnflow.de`, `https://api.vanfree.de`) auf Daten eines
  anderen Projekts zugreifen — ausschließlich über die exponierte API, nie
  direkt auf dessen DB.
- **Infra-Agenten mit dokumentierter Ausnahme:** Ein zentraler Ops-Agent
  (z.B. `vector`) darf per dokumentierter `registry/exceptions.yml`-Ausnahme
  die SUPABASE_URLs mehrerer Projekte halten, wenn er ausschließlich
  Monitoring-/Aggregations-Zugriff ausübt und nie Schreiboperationen auf
  fremde Projekt-DBs ausführt.
- **Interne Tools ohne persistente Daten:** Projekte mit `tags: internal` und
  ohne Nutzerdaten (`data_processors: []`) dürfen `supabase_url: null` setzen.

## Isolation-Typen (aufsteigend nach Stärke)

| Typ | Umsetzung | Ausreichend |
|-----|-----------|-------------|
| Supabase Self-Hosted (eigene Instanz) | eigenes `supabase-*` Container-Stack | ✅ |
| Supabase Cloud (eigenes Projekt) | eigene Project-ID, eigene URL | ✅ |
| Getrennte PostgreSQL-Instanz | eigener DB-Container, eigene Credentials | ✅ |
| Getrenntes Schema in gemeinsamer PG-Instanz | `search_path` unterschiedlich | ❌ nicht ausreichend |
| Selbe Supabase-Instanz, getrenntes Schema | Row-Level-Security allein | ❌ verboten |

## Audit-Checks

Der Audit prüft via `registry/projects.yml`:

1. **Fehlende `supabase_url`:** Projekt hat keinen Eintrag → WARN
2. **Duplikate:** Dieselbe `supabase_url` bei zwei Projekten ohne
   `exceptions.yml`-Ausnahme → FAIL
3. **Interne DB-Verbindungen aus Fremdprojekt:** SSH-Check auf
   `DATABASE_URL=*@supabase-db*` oder `*@slf-db*` in env-Dateien eines
   anderen Projekts → FAIL (direkte Verbindung auf fremden DB-Container)

```yaml
# registry/projects.yml — neues Pflichtfeld
- name: stadtlahnflow
  supabase_url: https://api.stadtlahnflow.de   # extern erreichbar
  # oder intern:
  supabase_url: http://slf-kong:8000            # interner Kong
```

## Bekannte Verstöße (Stand 2026-05-18)

| Projekt | Verstoß | Migrationsstatus |
|---------|---------|-----------------|
| `repivot` | teilt `panel.maxone.one` mit `maxone.one` | offen — braucht eigene Supabase-Instanz |
| `plansey-2026` | verbindet direkt auf `supabase-db:5432` (maxone.one-DB-Container) | offen — braucht eigene Instanz |
| `vector` | hält `panel.maxone.one` + Cross-Projekt-URLs | ausgenommen in `exceptions.yml` (Infra-Agent, read-only Monitoring) |

## Migrations-Leitfaden

1. Neue Supabase-Instanz aufsetzen (Self-Hosted auf maxone-prod oder Cloud)
2. Schema + Daten migrieren (`pg_dump | pg_restore` oder Supabase-Migration)
3. `.env.local` auf neue URL zeigen lassen, Container `--force-recreate`
4. Alte Tabellen/Schemas aus der geteilten Instanz löschen
5. `registry/projects.yml` `supabase_url` eintragen
6. Audit laufen lassen → FAIL muss verschwinden

## Verwandte Standards

- **003** — Secrets-Store (DB-Credentials isoliert pro Projekt in `/opt/secrets/<projekt>/`)
- **028** — Container-Misconfig (Pflichtfelder in docker-compose; `DATABASE_URL` muss aus env_file kommen)
- **044** — SSoT & kein Hardcode (DB-URL als ENV, nie hardcoded im Code)
