# Checkliste: 026: Self-Hosted-First (keine Abos)

Vor jeder neuen Tool-/Service-Einführung UND einmal pro Quartal Bestand
prüfen.

---

## A. Vor Einführung einer neuen Komponente

- [ ] **Suche** auf https://github.com/awesome-selfhosted/awesome-selfhosted
      durchgeführt
- [ ] **Suche** auf Docker Hub nach offiziellem Image
- [ ] **Suche** auf GitHub-Releases (≥ 1.000 Stars + Commits < 6 Monate)
- [ ] Lizenz-Check: OSS (MIT/Apache/GPL/AGPL), kein „Source-Available
      mit kommerzieller Auflage"
- [ ] Maintenance-Check: letzter Commit < 6 Monate, ≥ 1 aktiver Maintainer
- [ ] Resourcen-Footprint: passt auf Hetzner-VPS (RAM/Disk/CPU)
- [ ] Datenbank-Anforderung: Postgres / SQLite > MySQL > exotisch
- [ ] **Wenn nichts passt:** Entscheidung „selbst bauen" dokumentiert in
      CONCEPT.md (Standard 015)
- [ ] **Wenn etwas passt:** Deploy via Standard 027-Pipeline geplant

## B. SaaS / Abo niemals einsetzen: Ausnahmen-Liste

Diese vier Kategorien dürfen Abo sein:

- [ ] **Domain-Registrar** (INWX), strukturell notwendig
- [ ] **TLS-CA** (Let's Encrypt), kostenlos, OSS, nicht substituierbar
- [ ] **VPS-Hoster** (Hetzner), Hardware-Miete, kein Software-Abo
- [ ] **Payment-Processor** (Stripe), regulatorisch notwendig wenn das
      Projekt Zahlungen verarbeitet

Alles andere → SELBST hosten oder NICHT einsetzen.

## C. Bestand prüfen (quartalsweise)

Für jedes Projekt mit `status: live`:

- [ ] `registry/projects.yml` → `external_subscriptions:` aktuell?
- [ ] Jeder Eintrag hat `reason:` aus dem Whitelist-Set
- [ ] Jeder Nicht-Whitelist-Eintrag hat `sunset_plan:` mit Datum
- [ ] `docker-compose.yml` enthält keine SaaS-Image-Verweise
      (`docker.elastic.co`, `datadoghq.com`, `*-cloud-only`)
- [ ] `package.json` enthält keine Cloud-only-SDKs
      (`@datadog/`, `newrelic`, `@sentry/cloud-only`,
      `firebase-admin`, `@vercel/`, `@netlify/functions`,
      `posthog-node` ohne `host`-Override auf self-hosted-Instanz)

## D. Migrations-Backlog (in HANDOFF.md pro Projekt)

- [ ] Liste aller verbleibenden Abo-Komponenten dokumentiert
- [ ] Pro Komponente: Self-Hosted-Alternative recherchiert (auch wenn
      noch nicht migriert)
- [ ] Pro Komponente: geschätzter Migrations-Aufwand (S/M/L)
- [ ] Im aktuellen Quartal: ≥ 1 Migration durchgeführt oder
      bewusste Verschiebung dokumentiert

---

## Die drei Test-Fragen

Vor jeder Service-Wahl drei Fragen:

1. **Was passiert, wenn der Anbieter pleite geht / das Free-Tier kippt /
   die Preise verdoppelt?** Wenn die Antwort „dann steht unser Projekt"
   ist → nicht nehmen.

2. **Sehen die Daten dieses Anbieters Kunden-PII?** Wenn ja UND Anbieter
   ist außerhalb EU → DSGVO-Risiko, nicht nehmen.

3. **Gibt es ein OSS-Pendant mit ≥ 80 % der Features?** Wenn ja → das
   nehmen, auch wenn 20 % fehlen.

## Real-World-Substitutionen (maxone-Stack)

| SaaS / Abo | Self-Hosted-Substitut | Status |
|---|---|---|
| Google Analytics | Umami (OSS) | ✅ aktiv auf analytics.maxone.one |
| Google Workspace | Stalwart Mail (OSS) | ✅ aktiv auf maxone-prod + voltfair-cli |
| Firebase | Supabase self-hosted (OSS) | ✅ aktiv auf maxone-prod |
| Vercel / Netlify | Hetzner-VPS + Traefik + GitHub-Runner | ✅ aktiv |
| Anthropic API | Claude CLI per Abo (siehe CLAUDE.md) | ✅ aktiv |
| Pinecone / Weaviate | pgvector in Supabase | ✅ aktiv |
| Sentry Cloud | Sentry self-hosted (geplant) | offen |
| Datadog / New Relic | Grafana + Prometheus (geplant) | offen |
| GitHub Actions Cloud-Runner | self-hosted Runner `voltfair-server` | ✅ aktiv |
| Docker Hub Pro | `docker save \| ssh \| docker load` | ✅ aktiv |
