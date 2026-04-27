# 026 — Self-Hosted-First (keine Abos)

**Status:** active
**Seit:** 2026-04-28 (User-Direktive)
**Gilt für:** alle Projekte und Infrastruktur — Backend, Tooling, Monitoring,
Mail, Analytics, KI-Inferenz, Datenbank, Storage, CI

## Regel

Jede Software-/Service-Komponente wird in dieser Reihenfolge ausgewählt:

1. **Existierendes self-hostbares Paket nutzen.** Docker-Image, GitHub-Release,
   apt-Paket, Helm-Chart, OSS-Binary. Wenn es das gibt: nehmen, deployen,
   fertig.
2. **Selbst bauen** (Code im eigenen Repo, eigener Container, eigener Server).
   Nur wenn Punkt 1 nichts liefert oder das Paket nicht passt
   (Lizenz, fehlende Features, Maintenance tot).
3. **Niemals Abo / SaaS / Cloud-Subscription.** Keine wiederkehrenden
   Zahlungen an Drittanbieter, keine API-Keys mit monatlicher Quote, kein
   "Free-Tier mit Upgrade-Pfad". Auch nicht "nur kurz für den Test".

Einzige Ausnahmen — und nur diese, dokumentiert im jeweiligen Projekt-
Briefing:

- **Domain-Registry / DNS-Provider** (INWX, etc.) — Naturmonopol, kein
  self-host möglich
- **TLS-CA** (Let's Encrypt) — kostenlos, OSS, keine Subscription
- **Hetzner / VPS-Hoster** — Hardware-Vermietung, nicht Software-Abo

Alles andere (Mail, Analytics, Logging, KI, Datenbank, Auth, Storage,
Monitoring, CI, Container-Registry) läuft auf eigener Infrastruktur.

## Warum

**Drei Grundüberzeugungen** — User-Direktive 2026-04-28:

1. **Datensouveränität.** Daten verlassen unsere Hetzner-Server nicht.
   Kein Drittanbieter sieht Kunden-Daten, keine US-Cloud, keine
   FISA-Sektion-702-Befugnis. DSGVO-Art.-32-relevant: „Stand der Technik"
   beinhaltet die Wahl des Providers.

2. **Kostenkontrolle.** Abos summieren sich. 10 € pro Service × 8 Services
   × 12 Monate = 960 € Jahres-Fixkosten — bei einem Hetzner-VPS für 12 €
   monatlich, der dieselben 8 Services hostet. Self-host bricht den
   Vendor-Lock-in-Aufschlag.

3. **Ausfallunabhängigkeit.** Wenn der SaaS-Anbieter pivot, ist insolvent,
   ändert die Preise oder schaltet das Free-Tier ab, sind wir betroffen.
   Self-hosted: bleibt laufen, unabhängig von der wirtschaftlichen Lage
   des Anbieters.

**Konkrete Beispiele aus dem maxone-Stack** (alle bereits self-hosted):

| Komponente | Self-Hosted via | Statt Abo bei |
|---|---|---|
| Mail-Server | Stalwart (OSS) | Google Workspace / Microsoft 365 |
| Analytics | Umami (OSS) | Google Analytics / Plausible Cloud |
| Datenbank | Supabase self-hosted (OSS) | Supabase Cloud / Firebase |
| KI-Inferenz | Claude CLI via Abo (per User) | Anthropic API mit Per-Token-Billing |
| Reverse Proxy | Traefik (OSS) | Cloudflare Pro / Fastly |
| CI-Runner | self-hosted GitHub Actions Runner | GitHub-hosted Runner-Minuten |
| Container-Registry | (lokal `docker save \| ssh \| docker load`) | Docker Hub Pro / GHCR-paid |
| Vector-Datenbank | (in Supabase pgvector, OSS) | Pinecone / Weaviate Cloud |

**Der KI-Sonderfall:** Claude wird über das **persönliche Claude-Abo
via CLI** genutzt (`claude -p ...` als Subprocess mit
`CLAUDE_CODE_OAUTH_TOKEN`), nicht über die Anthropic API. Das ist
in CLAUDE.md („KI-Aufrufe: IMMER Claude Code CLI, NIE Anthropic API")
hart festgeschrieben. Begründung: ein einziges Abo deckt alle
Projekte ab, statt pro Projekt ein API-Key mit eigener Quote.

## Wie anwenden

**Bei jeder neuen Anforderung „brauchen wir eine Lösung für X":**

1. **Erst suchen** auf:
   - https://github.com/awesome-selfhosted/awesome-selfhosted
   - Docker Hub (offizielle Images filtern)
   - GitHub-Releases mit ≥ 1.000 Stars + Commits in letzten 6 Monaten
   - Reddit `/r/selfhosted` für Community-Empfehlungen

2. **Bewerten** nach:
   - **Lizenz** OSS-konform (MIT, Apache 2, GPL, AGPL — alle ok für intern)
   - **Maintenance** letzter Commit < 6 Monate, ≥ 1 aktiver Maintainer
   - **Docker-Image** offiziell verfügbar (oder leicht selbst zu bauen)
   - **Datenbank-Anforderungen** kompatibel (Postgres/SQLite > MySQL)
   - **Resourcen-Footprint** passt auf Hetzner-VPS (RAM/Disk/CPU)

3. **Wenn nichts passt:** selbst bauen. Code geht in eigenes Repo, deployt
   wie jedes andere Projekt (Standard 001 Blue/Green, 002 No-Build-on-Prod,
   027 Deploy-Pipeline).

4. **Wenn jemand „aber das SaaS-Tool wäre einfacher" sagt:** stop. Diese
   Regel ist nicht verhandelbar. Einfachheit ist nicht der Maßstab —
   Souveränität, Kosten und Unabhängigkeit sind es.

**Bei jeder Bestands-Komponente, die Abo-basiert läuft:**

- In CONCEPT.md (Standard 015) als „Migrations-Schuld" markieren
- Sunset-Plan (Standard 014) für die Abo-Dependency erstellen
- Self-host-Alternative ins nächste Quartal einplanen

## Was diese Regel NICHT verbietet

- **Bezahlte OSS-Lizenzen** (z.B. Plausible Self-Hosted-Lizenz, sentry
  Self-Hosted-Lizenz wenn der Code OSS bleibt) — das ist eine Einmal-
  /Spenden-Geste, kein Abo-Lock-in.
- **Hetzner-Cloud** für die VPS — Hardware-Miete ist kein Software-Abo.
- **INWX / Domain-Registrar / Let's Encrypt** — strukturelle Internet-
  Bestandteile, kein Substitut.
- **Stripe** für Payment — wenn das Projekt selbst Zahlungen verarbeitet,
  ist Stripe okay (kein Self-Hosted-Substitut, regulatorisch erforderlich).

## Audit

`scripts/audit.mjs` prüft pro Projekt mit `status: live`:

1. **`registry/projects.yml`** — neues Pflichtfeld `external_subscriptions:`
   (Liste oder leeres Array). Jeder Eintrag dokumentiert:
   ```yaml
   external_subscriptions:
     - service: stripe
       reason: payment-processor (regulatorisch erforderlich)
       cost_per_month_eur: variabel
       sunset_plan: keiner — strukturell notwendig
   ```
   Audit erlaubt nur Einträge mit `reason` aus dem Whitelist-Set
   (`payment-processor`, `domain-registrar`, `tls-ca`, `vps-hosting`).
   Andere `reason`-Werte → WARN. Komplett fehlendes Feld → WARN.

2. **`docker-compose.yml`-Scan** — sucht nach typischen SaaS-Indikatoren:
   - `image:` zeigt auf `docker.elastic.co/elastic-agent` (Elastic SaaS)
   - `image:` zeigt auf `datadoghq.com` (Datadog)
   - `environment:` enthält Keys mit `_SAAS_` / `_CLOUD_API_` Suffix
   - Bei Treffer → WARN mit konkretem Image-Namen.

3. **`package.json` / `requirements.txt`-Scan** — sucht nach SDK-
   Dependencies bekannter Abo-Dienste:
   - `@datadog/`, `newrelic`, `@sentry/cloud-only`, `firebase-admin`,
     `@vercel/`, `@netlify/functions`, `posthog-node` (PostHog Cloud SDK)
   - Bei Treffer → INFO mit Hinweis „Self-hosted-Pendant prüfen".

PASS = `external_subscriptions:` gepflegt + nur Whitelist-Reasons + keine
SaaS-Marker in Compose / Bundle.
WARN = SaaS-Marker gefunden oder `external_subscriptions` fehlt.
FAIL = nicht angewendet (außer wenn explizit als „Lizenzierte OSS"
dokumentiert).
