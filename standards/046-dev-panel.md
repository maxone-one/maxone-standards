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
Admin-Email-Liste. Kein Client-Side-Guard genügt allein — ein Angreifer mit
anderem Cookie könnte trotzdem Daten sehen.

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
Zeigt aktuellen User und die wichtigste Entität des Projekts (Member, Team, Organisation):

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

`build_id` kommt aus `process.env.BUILD_ID` (→ Standard 042).

### 5. Optionale Tabs (bei Bedarf ergänzen)

| Tab | Zweck | Voraussetzung |
|---|---|---|
| **View** | Server-seitige Role-Overrides via Cookie (Visitor/Owner-Modus) | `/api/dev/view` Endpoint + SSR respektiert Cookie |
| **Flags** | Feature-Flags live togglen via `/api/admin/features` | `app_config`-Tabelle mit `feature_*`-Keys |
| **Routes** | Quick-Nav + cache-busted Reload | immer ergänzbar |

### 6. Backend-Contract (`/api/dev/context`)

```ts
// Response (vereinfacht, projektspezifisch erweiterbar)
{
  ok: boolean;
  user: { id: string; email: string; role: string | null; isAdmin: boolean } | null;
  // + projektspezifische Entität (member, team, ...)
  flags?: Record<string, boolean>;       // optional
  view?: { asVisitor: boolean; asOwner: boolean }; // optional
  build: {
    buildId: string;     // process.env.BUILD_ID
    nodeEnv: string;
    supabaseUrl: string | null;
    deployedAt: string | null; // process.env.BUILD_TIME
  };
}
```

Admin-Check-Pattern (Next.js):

```ts
const role  = user?.app_metadata?.role ?? null;
const isAdmin = role === "admin" || ADMIN_EMAILS.includes(email ?? "");
if (!user || !isAdmin) return NextResponse.json({ ok: false }, { status: 401 });
```

### 7. Einbindung im Layout

Die Komponente wird **einmalig** im Root-Layout eingebunden — nicht pro Seite:

```tsx
// Next.js App Router: app/layout.tsx
<DevPanel />
```

```svelte
<!-- SvelteKit: src/routes/+layout.svelte -->
<DevPanel />
```

Sie rendert selbstständig `null`, wenn der API-Call 401 zurückgibt. Kein
`process.env.NODE_ENV`-Guard nötig — das Panel ist prod-safe, weil server-seitig
admin-gegated.

## Verboten

```tsx
// ❌ Client-Side-only Gate
{process.env.NODE_ENV === 'development' && <DevPanel />}

// ❌ Keine Storage-Key-Prefixes → Kollision bei mehreren Projekten im selben Browser
const STORAGE_POS = "devpanel-pos";

// ❌ Panel ohne Keyboard-Shortcut
// Alt+D ist Pflicht — Panel muss tastaturlos erreichbar sein

// ❌ Panel rendert ohne Backend-Check
// Auch wenn der User "sieht" nichts: kein admin-gate = kein Panel
```

## Audit-Checks

1. Gibt es eine `DevPanel`-Komponente (oder gleichnamige Äquivalent)? → WARN wenn fehlt
2. Gibt es `/api/dev/context` (oder Framework-Äquivalent)? → WARN wenn fehlt
3. Ist `process.env.NODE_ENV === 'development'` als **einziger** Gate? → WARN
   (prod-safe admin-gate fehlt)
4. Sind Storage-Keys ohne Projekt-Prefix? → WARN (Kollisions-Risiko)

## Verwandte Standards

- **042** — Version-Marker (`BUILD_ID` → Build-Tab)
- **044** — SSoT & kein Hardcode (Admin-Emails in Endpoint, nicht in Component)
- **005** — Test-First (DevPanel selbst braucht keinen E2E-Test, aber getestete APIs)
