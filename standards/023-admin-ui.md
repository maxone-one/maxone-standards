# 023 — Admin-UI (Dashboard-Layout · DevPanel · App-Launcher)

**Status:** active
**Seit:** 2026-05-17 (Dashboard + DevPanel), 2026-05-18 (App-Launcher)
**Gilt für:** alle Projekte mit Admin-/Dashboard-Bereich

## Inhalt

- [A] Dashboard-Layout-Konsistenz
- [B] DevPanel: Floating Developer Tool
- [C] Admin App Launcher

---

## A — Dashboard-Layout-Konsistenz

### Content-Wrapper — eine Strategie pro Projekt, konsequent auf allen Seiten

**Strategie A — Full-width** (Default für neue Projekte):
```tsx
<div className="w-full px-4 py-6 md:px-6 md:py-8">
```

**Strategie B — Constrained** (nur wenn Lesetext/Formulare/narrative Flows dominieren, in CLAUDE.md dokumentieren):
```tsx
<div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
```

**Verboten:** beide Strategien mischen; `max-w-4xl/5xl/6xl` als Default.

### Pflicht-Pattern

**Seiten-Heading:**
```tsx
<div className="mb-6 md:mb-8">
  <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
  {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
</div>
```

**Stat/KPI-Grid:** 2-up: `grid-cols-1 sm:grid-cols-2` · 3-up (Standard): `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` · 4-up: `grid-cols-2 md:grid-cols-4`. Kein `grid-cols-5/6`.

**StatCard-Pflichtstruktur:**
```tsx
<div className="rounded-xl border border-border bg-card p-5">
  <div className="flex items-center justify-between">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <div className="rounded-lg p-2 bg-primary/10">
      <Icon className="h-4 w-4 text-primary" />
    </div>
  </div>
  <p className="mt-3 text-2xl font-semibold">{value}</p>
</div>
```

**Content-Sektionen:** `rounded-xl border border-border bg-card` mit Header `px-5 py-4 border-b` und Body `p-5`.

**Spacing:** `space-y-6` zwischen Sektionen, `gap-4` innerhalb.

**Loading States:** Skeleton-Loader statt Spinner beim initialen Laden.

**Mobile Bottom-Nav:** Content-Container mit `pb-14 md:pb-0`.

**Referenz:** `voltfair.de/app/(dashboard)/admin/benutzer/page.tsx`

---

## B — DevPanel: Floating Developer Tool

Jedes Projekt mit Auth- und Admin-Kontext bekommt eine `DevPanel`-Komponente — floating, draggbar, nur für Admins sichtbar.

**Admin-Gate:** Serverseitig via `GET /api/dev/context` → 401 = Panel unsichtbar; 200 = Panel sichtbar. Kein Client-Side-Guard allein.

**FAB (collapsed):** fixiert `bottom: 12px, left: 12px`, `z-index: 9999`, farbiger Punkt + Label (Admin=grün, Owner-Override=orange, Visitor-Override=rot). Shortcut: **Alt+D**.

**Panel:** 380px breit, 540px max-height, dunkles Theme (#0A1628), draggbar per Header-Grab. localStorage-Persistenz mit projektspezifischen Keys:
```ts
const STORAGE_POS  = "<project>-devpanel-pos";
const STORAGE_OPEN = "<project>-devpanel-open";
const STORAGE_TAB  = "<project>-devpanel-tab";
```

**Pflicht-Tabs:**
- **Session-Tab:** User-ID, E-Mail, Rolle + wichtigste Projekt-Entität + Sign-out-Action
- **Build-Tab:** `build_id` (aus ENV/Standard 022), `/api/version`-Wert, `node_env`, Supabase-URL, `deployed_at`, UA

**Backend-Contract (`/api/dev/context`):**
```ts
{ ok: boolean; user: { id, email, role, isAdmin } | null;
  build: { buildId: string; nodeEnv: string; supabaseUrl: string | null;
           deployedAt: string | null; isStaging: boolean }; }
```

**Staging-Release-Button** (Branch-Split-Projekte): wenn `isStaging === true`, zeigt Build-Tab "Auf Prod freigeben"-Button → `POST /api/admin/release` → GitHub Merges API (`main` → `release`).

**Einbindung:** einmalig im Root-Layout — `<DevPanel />`. Rendert selbstständig `null` bei 401.

**Verboten:** `NODE_ENV === 'development'`-only Gate; fehlende Storage-Key-Prefixes; `IS_STAGING` als `NEXT_PUBLIC_IS_STAGING`.

**Referenz:** `stadtlahnflow.de/src/components/DevPanel.tsx`

---

## C — Admin App Launcher

Jedes Projekt mit mehr als einer top-level Admin-Sektion bekommt eine `AppLauncher`-Komponente — schmale fixierte Sidebar am linken Rand des Admin-Layouts.

**Layout:**
```
┌──────────────────────────────┐
│ [w-12 AppLauncher] [Content] │
└──────────────────────────────┘
```

Breite: `w-12` (48px), `h-screen`, `shrink-0`. Hintergrund: `bg-primary`. Teil des Flex-Layouts, **kein** Portal/Fixed.

**AppDef-Pattern (keine direkten URL-Vergleiche in Template-Logik):**
```ts
interface AppDef {
  id: string; label: string; icon: ComponentType;
  href: string; match: (path: string) => boolean;
}
```

**Active-State (exakt diese Klassen):**
```
aktiv:   bg-white/15 text-white shadow-sm
inaktiv: text-white/50 hover:text-white/80 hover:bg-white/8
```
Icon: `h-[18px] w-[18px]`, Button-Fläche: `w-9 h-9 rounded-lg`.

**Standalone/Kiosk-Override:** wenn Sektion unter eigener Subdomain oder in Tauri/Electron, Launcher verstecken.

**Einbindung:** einmalig im Admin-Layout, vor Content:
```tsx
<div className="flex h-screen overflow-hidden">
  <AppLauncher />
  <main className="flex-1 overflow-y-auto">{children}</main>
</div>
```

**Referenz:** `maxone.one/apps/umbrella/src/lib/components/admin/AppLauncher.svelte`

---

## Audit

**Dashboard:** `grid-cols-5/6` → WARN; `p-4` und `p-6` auf derselben Seite → WARN; Strategien A+B gemischt → WARN; Mobile-Nav ohne `pb-14` → WARN.

**DevPanel:** fehlt → WARN; `/api/dev/context` fehlt → WARN; `NODE_ENV`-only Gate → WARN; `IS_STAGING` als `NEXT_PUBLIC_` → **FAIL**; bei Branch-Split ohne `Verify release is a merge from main`-Step → FAIL.

**App-Launcher:** > 1 Admin-Sektion, kein AppLauncher → WARN; außerhalb Admin-Layout → FAIL; `pathname === x` statt `match()` → WARN.
