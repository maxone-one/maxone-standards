# 046 — DevPanel: Floating Developer Tool

**Status:** active
**Seit:** 2026-05-17
**Gilt für:** alle Projekte mit Admin-Bereich und Supabase-Auth

## Problem

Ohne einheitliches Entwickler-Tool wächst jedes Projekt eigene Debug-Wege:
Console-Logs, hartcodierte Test-Accounts, manuelle Cookie-Edits, Feature-Flag-Tabellen
in der DB direkt. Das kostet Zeit und erzeugt keine Wiedererkennbarkeit.

## Regel

Jedes Projekt mit Auth- und Admin-Kontext bekommt eine `DevPanel`-Komponente —
ein floating, draggbares Panel, das nur für Admins sichtbar ist und folgende
Mindest-Tabs enthält.

## Referenz-Implementierung

`stadtlahnflow.de/src/components/DevPanel.tsx` + `src/app/api/dev/context/route.ts`
sind die kanonische Referenz. Neue Projekte kopieren die Komponente und passen
Project-Prefix, Tabs und Admin-Emails an.

## Pflicht-Regeln

### 1. Admin-Gate — serverseitig, kein Client-Check

Die Sichtbarkeit des Panels hängt allein vom Backend-Endpoint ab:

```ts
// GET /api/dev/context
// 401 / { ok: false } → Panel rendert nicht
// 200 / { ok: true, user, build, ... } → Panel sichtbar
```

Der Endpoint prüft `user.app_metadata.role === "admin"` **oder** eine hinterlegte
Admin-Email-Liste. Kein Client-Side-Guard genügt allein.

### 2. FAB (collapsed)

Fixiert unten-links (`bottom: 12px, left: 12px`), `z-index: 9999`.
Zeigt einen farbigen Punkt + aktuellen View-Mode-Label:

| Modus | Farbe | Label |
|---|---|---|
| Admin (normal) | `#22c55e` | `ADMIN` |
| As-Owner-Override | `#f59e0b` | `OWNER` |
| As-Visitor-Override | `#ef4444` | `VISITOR` |

Keyboard-Shortcut: **Alt+D** (toggle).

### 3. Panel-Container

- Breite: `380px`, max-height: `540px`, Dunkles Theme (`#0A1628` Background)
- **Draggable** per Header (grab-Cursor), Position wird in localStorage persistiert
- Offener Zustand und aktiver Tab ebenfalls in localStorage
- Storage-Keys **müssen projektspezifisch** prefixed sein:

```ts
const STORAGE_POS  = "<project>-devpanel-pos";
const STORAGE_OPEN = "<project>-devpanel-open";
const STORAGE_TAB  = "<project>-devpanel-tab";
```

### 4. Pflicht-Tabs

Mindestens diese zwei Tabs müssen in **jedem** Projekt vorhanden sein:

#### Session-Tab

Zeigt aktuellen User und die wichtigste Entität des Projekts:

```
user.id      | <uuid>
user.email   | max@example.com
user.role    | admin
---entity--- | (projektspezifisch: member, org, team, ...)
```

Plus eine "Sign out + clear cookies"-Action (mit `confirm()`-Dialog).

#### Build-Tab

Zeigt die Deployment-Realität:

```
build_id     | abc1234
live_version | (via /api/version)
node_env     | production
supabase     | https://...
deployed     | 2026-05-17T...
ua           | Mozilla/5.0 ...
```

`build_id` kommt aus `process.env.BUILD_ID` (Standard 042).

**Staging-Release-Button:** Wenn `ctx.build.isStaging === true`, zeigt der
Build-Tab ganz unten einen "Auf Prod freigeben"-Button. Details in Regel 8.

### 5. Optionale Tabs (bei Bedarf ergänzen)

| Tab | Zweck | Voraussetzung |
|---|---|---|
| **View** | Server-seitige Role-Overrides via Cookie | `/api/dev/view` + SSR respektiert Cookie |
| **Flags** | Feature-Flags live togglen | `app_config` mit `feature_*`-Keys |
| **Routes** | Quick-Nav + cache-busted Reload | immer ergänzbar |

### 6. Backend-Contract (`/api/dev/context`)

```ts
{
  ok: boolean;
  user: { id: string; email: string; role: string | null; isAdmin: boolean } | null;
  flags?: Record<string, boolean>;
  view?: { asVisitor: boolean; asOwner: boolean };
  build: {
    buildId: string;        // process.env.BUILD_ID
    nodeEnv: string;
    supabaseUrl: string | null;
    deployedAt: string | null;  // process.env.BUILD_TIME
    isStaging: boolean;     // process.env.IS_STAGING === "true"
  };
}
```

Admin-Check-Pattern:

```ts
const isAdmin = role === "admin" || ADMIN_EMAILS.includes(email ?? "");
if (!user || !isAdmin) return NextResponse.json({ ok: false }, { status: 401 });
```

### 7. Einbindung im Layout

Einmalig im Root-Layout — nicht pro Seite:

```tsx
// Next.js: app/layout.tsx
<DevPanel />
```

```svelte
<!-- SvelteKit: src/routes/+layout.svelte -->
<DevPanel />
```

Rendert selbstständig `null` bei 401 — prod-safe, da server-seitig admin-gegated.
Kein `NODE_ENV`-Guard nötig.

### 8. Staging-Release-Button (Branch-Split-Modell)

Projekte mit Branch-Split-Deploy (`main` → Staging, `release` → Prod) bekommen
im Build-Tab einen One-Click-Deploy-Button. Er ist ausschliesslich auf der
Staging-Instanz sichtbar — gleiche Codebasis, anderes `.env`.

**Branch-Modell:**

```
main    → CI: build + deploy-staging  (staging.<domain>)
release → CI: build + deploy          (<domain>, Prod)
Freigabe = git merge main release && git push origin release
         = oder: DevPanel-Button
```

**Umgebungsvariablen — nur in Staging-.env setzen:**

```env
IS_STAGING=true
GITHUB_RELEASE_TOKEN=<PAT mit contents:write>
```

`IS_STAGING` darf NICHT als `NEXT_PUBLIC_*` deklariert werden — es ist ein
serverseitiger Laufzeitwert. Staging und Prod nutzen dasselbe Docker-Image;
der Unterschied liegt ausschliesslich in der `.env`-Datei auf dem Server.

**API-Route `POST /api/admin/release` — admin-gated:**

```ts
// Ruft GitHub Merges API auf:
// POST https://api.github.com/repos/{owner}/{repo}/merges
// body: { base: "release", head: "main" }
//
// 201 → neuer Merge-Commit, Prod-Deploy startet
// 204 → main === release, kein Deploy nötig
// 4xx → Fehler (Token fehlt, Konflikt, ...)
```

**DevPanel Build-Tab Render-Logik:**

```tsx
{ctx.build.isStaging && (
  <section>
    <div>Staging → Prod</div>
    <button onClick={release}>Auf Prod freigeben</button>
    {/* States: idle / loading / success / uptodate / error */}
  </section>
)}
```

**CI-Workflow-Struktur (Pflicht: nur self-hosted Runner):**

```yaml
on:
  push:
    branches: [main, release]

jobs:
  build:
    runs-on: [self-hosted, maxone-staging]  # nie ubuntu-latest

  deploy-staging:
    if: github.ref == 'refs/heads/main'
    runs-on: [self-hosted, maxone-staging]

  deploy:
    if: github.ref == 'refs/heads/release'
    runs-on: [self-hosted, maxone-prod]
```

Referenz: `.github/workflows/deploy.yml` in `stadtlahnflow`.

## Verboten

```tsx
// Kein NODE_ENV-only Gate
{process.env.NODE_ENV === 'development' && <DevPanel />}

// Keine fehlenden Storage-Key-Prefixes
const STORAGE_POS = "devpanel-pos"; // Kollision bei mehreren Projekten im Browser

// Kein separater floating Release-Button ausserhalb des DevPanels
// Anti-Pattern: StagingBanner.tsx (2026-05-18 in SLF entfernt)

// IS_STAGING nicht als NEXT_PUBLIC_ — bricht Image-Sharing zwischen Staging und Prod
```

## Audit-Checks

1. Gibt es eine `DevPanel`-Komponente? → WARN wenn fehlt
2. Gibt es `/api/dev/context`? → WARN wenn fehlt
3. Ist `NODE_ENV === 'development'` der einzige Gate? → WARN
4. Sind Storage-Keys ohne Projekt-Prefix? → WARN
5. Bei Branch-Split-Projekten: Ist `isStaging` im Context-Response? → WARN wenn fehlt
6. Ist `IS_STAGING` als `NEXT_PUBLIC_IS_STAGING` deklariert? → FAIL

## Verwandte Standards

- **002** — No-Build-on-Prod (Build auf self-hosted Staging-Runner)
- **027** — Deploy-Pipeline (Branch-Split als empfohlenes Muster)
- **042** — Version-Marker (`BUILD_ID` → Build-Tab)
- **044** — SSoT & kein Hardcode
- **005** — Test-First
