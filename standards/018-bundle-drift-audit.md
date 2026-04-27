# 018 — Bundle-Drift-Audit

**Status:** active
**Seit:** 2026-04-27
**Gilt für:** alle Projekte mit `status: live` und öffentlichem Frontend-Bundle

## Regel

Das **live ausgelieferte JS/CSS-Bundle** darf nicht enthalten:

- **Veraltete Hostnamen** aus Migrationen (z.B. `panel.maxone.studio`,
  `agent.maxone.studio`, `*.maxone.studio` allgemein — Migration auf
  `.maxone.one` ist seit 2026-04-16 abgeschlossen)
- **Source-Maps** in Production (`.map`-Dateien öffentlich abrufbar)
- **Plattform-Wasserzeichen** der Blacklist-Anbieter aus Standard 016
  (`lovable`, `bolt.new`, `base44`, `built with v0`, `replit-agent`)
- **Dev-Hosts und Loopback-URLs** (`localhost:`, `127.0.0.1:`,
  `0.0.0.0:`, `host.docker.internal`)
- **Hartkodierte Secrets oder Service-Role-Keys** (siehe Standard 022,
  hier zusätzlich im *gebauten* Bundle, nicht nur im Repo)

## Warum

Drift entsteht nach Migrationen wenn das Repo bereits aktualisiert ist,
aber die alte Build-Artefakt-Version weiter ausgeliefert wird. Konkrete
Vorfälle 2026-04:

- **repivot** wurde nach der `.studio`→`.one`-Umstellung neu deployt,
  aber Vite hatte das alte Asset noch im Cache — Browser luden weiter
  `panel.maxone.studio/functions/v1/impressum`. Repo war grün, Live war
  rot. Audit auf das Repo allein hätte den Drift nie gefunden.
- **maxone.one** hatte 2026-03 zwei Wochen lang einen Source-Map-Eintrag
  im Bundle, weil der Production-Build versehentlich mit
  `--sourcemap=true` lief. `*.map`-Dateien geben den vollständigen
  TypeScript-Quellcode preis (vgl. Anthropic Claude Code CLI 2026-03-31).
- **Lovable/Bolt-Watermark** im Bundle ist ein verlässlicher Indikator,
  dass jemand die Verbots-Liste umgangen hat — nicht jeder Wasserzeichen-
  Treffer bedeutet Lock-in, aber jeder verlangt eine Erklärung.

Der Standard prüft also nicht das Repo, sondern das **wirklich
ausgelieferte Bundle** — das was der Browser des Nutzers sieht.

## Wie anwenden

**1. Bei Gate 3 (Standard 013 LAUNCH-REVIEW.md):**
   - Section F (Frontend-Bundle) wird mit dem Audit-Output ergänzt
   - Source-Map-URLs explizit dokumentieren falls unvermeidlich
     (z.B. interner Sentry-Upload statt Public-Asset)

**2. Bei jeder Migration:**
   - Nach Repo-Update **Build-Cache leeren** (`.vite/`, `.next/cache/`,
     `.svelte-kit/`) und neu bauen
   - Audit gegen Live-Domain laufen lassen — nicht das Repo
   - Bei Drift: re-build + re-deploy + Edge-Cache-Purge

**3. Empfohlene Build-Settings:**
   - Vite: `build.sourcemap: false` (Default, aber explizit setzen)
   - SvelteKit: `vite.build.sourcemap: 'hidden'` falls Sentry-Upload
   - Next.js: `productionBrowserSourceMaps: false`
   - Bei Bedarf: Sentry/Datadog-Upload via CI mit Token, dann lokale
     `.map`-Dateien aus dem Asset-Output entfernen

## Was das Audit NICHT findet

- **CDN-Cache-Versionen** — wenn Cloudflare/Vercel/etc. eine alte
  Bundle-Version cached, sieht das Audit die neue. Manueller Cache-Purge
  + Audit ist Pflicht.
- **Browser-Cache des Endnutzers** — Service-Worker-Caches,
  localStorage-Asset-Hashes etc. Hier hilft nur Versionierung +
  Cache-Busting im Build.
- **Dynamisch nachgeladene Module** (Code-Splitting beyond N Files) —
  Audit lädt maximal 8 Assets pro Domain.
- **Server-gerenderte Inhalte ohne Bundle** — reine SSR-Sites ohne
  `<script>`-Includes laufen leer durch (PASS).

## Audit

`scripts/audit.mjs` prüft pro Projekt mit `status: live` + Domain:

1. Fetch `https://<domain>/` mit Timeout 10s
2. Extrahiere alle `<script src="...">` und `<link href="...">` mit
   selber Origin (relative Pfade + absolute URLs gleicher Domain)
3. Bis zu 8 Assets fetchen (Timeout 5s pro Asset)
4. Pro Asset auf Drift-Patterns scannen:
   - **`*.maxone.studio`** (außer `mail.maxone.studio` /
     `autoconfig.maxone.studio` — laut CLAUDE.md aktiv) → **WARN**
   - **Source-Map-Direktive** (`//# sourceMappingURL=`) → **WARN**
   - **Plattform-Watermark** (`lovable`, `bolt.new`, `base44`,
     `built with v0`, `replit-agent`) → **FAIL**
   - **Dev-Hosts** (`localhost:`, `127.0.0.1`, `0.0.0.0`,
     `host.docker.internal`) → **WARN**
   - **Service-Role-Key-Pattern** (`"role":"service_role"` in einem
     JWT-ähnlichen Token) → **FAIL**
5. Bei Fetch-Fehler eines Assets: skip dieses Asset, kein Fail
6. Wird mit `--local-only` übersprungen (kein Netzwerk)

PASS = alle gefetchten Assets ohne Drift-Pattern.
WARN = Drift-Klasse ohne unmittelbare Sicherheitsrelevanz.
FAIL = Wasserzeichen oder Service-Role-Key gefunden.
