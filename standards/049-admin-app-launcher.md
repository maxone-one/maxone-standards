# 049 — Admin App Launcher

**Status:** active
**Seit:** 2026-05-18
**Gilt für:** alle Projekte mit Admin-Bereich und mehr als einer top-level Admin-Sektion

## Problem

Ohne einheitliche App-Navigation ist jeder Admin-Bereich eine Sackgasse — Wechsel
zwischen Tools erfordern manuelle URL-Eingabe oder einen Umweg über eine Startseite.
Jedes Projekt erfand bisher seinen eigenen Mechanismus.

## Regel

Jedes Projekt mit Admin-Bereich und mehr als einer top-level Admin-Sektion bekommt
eine `AppLauncher`-Komponente — eine schmale, fixierte Sidebar am linken Rand des
Admin-Layouts mit Icon-Buttons für jede Sektion.

## Referenz-Implementierung

`maxone.one/apps/umbrella/src/lib/components/admin/AppLauncher.svelte` +
`src/routes/(admin)/+layout.svelte` sind die kanonische Referenz.

## Pflicht-Regeln

### 1. Position und Dimensionen

Der Launcher ist **Teil des Flex-Layouts**, kein Portal-Overlay:

```
┌──────────────────────────────────────────┐
│ [w-12 AppLauncher] [Sidebar] [Content]   │
└──────────────────────────────────────────┘
```

- Breite: `w-12` (48 px), Höhe: `h-screen`, `shrink-0`
- Hintergrund: `bg-primary` (Brand-Dunkelfarbe)
- Kein `position: fixed` / kein Portal — Teil des Flex-Containers des Admin-Layouts

### 2. Logo-Slot

Oben feste Höhe `h-12`, Border-Bottom `border-white/10`:

```svelte
<a href="/admin" class="flex items-center justify-center h-12 border-b border-white/10">
  <span class="text-xs font-extrabold text-white tracking-tight">
    m<span class="text-accent">1</span>
  </span>
</a>
```

Zeigt immer das Projekt-Logo / Kürzel, verlinkt auf `/admin`.

### 3. App-Einträge — `AppDef`-Pattern

Jede Sektion wird als `AppDef`-Objekt deklariert — **keine** direkten URL-Vergleiche
in der Template-Logik:

```ts
interface AppDef {
  id: string;
  label: string;                         // für title-Attribut und a11y
  icon: ComponentType;                   // Lucide-Icon
  href: string;                          // Ziel-URL
  match: (path: string) => boolean;      // Pflicht: active-State-Logik
}
```

Beispiel mit Exklusions-Match (Admin ≠ Unter-Apps):

```ts
{
  id: 'admin',
  label: 'Admin',
  icon: LayoutDashboard,
  href: '/admin',
  match: (p) =>
    p.startsWith('/admin') &&
    !p.startsWith('/admin/agents') &&
    !p.startsWith('/admin/email'),
}
```

### 4. Active-State

Exakt dieses Klassen-Paar — kein drittes Muster:

```
aktiv:   bg-white/15 text-white shadow-sm
inaktiv: text-white/50 hover:text-white/80 hover:bg-white/8
```

Icon-Größe: `h-[18px] w-[18px]`, Button-Fläche: `w-9 h-9 rounded-lg`.

### 5. Einbindung — Admin-Layout, nie woanders

Einmalig im Admin-Layout-Wrapper, **vor** der Content-Sidebar:

```svelte
<!-- (admin)/+layout.svelte -->
<div class="flex h-screen bg-surface overflow-hidden">
  <AppLauncher />
  <AdminSidebar />
  <main class="flex-1 overflow-y-auto">
    {@render children()}
  </main>
</div>
```

Für Next.js:

```tsx
// app/(admin)/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppLauncher />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
```

Der Admin-Route-Guard liegt auf dem Layout-Level (server-seitig via
`requireUser(["admin"])`) — der Launcher selbst braucht keinen eigenen Role-Check.

### 6. Standalone / Kiosk-Override

Wenn eine Sektion unter einer eigenen Subdomain oder in einem nativen Shell
(Tauri, Electron) läuft, muss der Launcher versteckt werden, damit die Sektion
den vollen Viewport nutzt:

```svelte
let isStandaloneHost = $derived(
  (typeof window !== 'undefined' && window.location.hostname.startsWith('zentinel.')) ||
  (typeof navigator !== 'undefined' && /tauri/i.test(navigator.userAgent || ''))
);

{#if !isStandaloneHost}
  <AppLauncher />
{/if}
```

Für Next.js: `useHostname()`-Hook oder Server-seitiger Header-Check im Layout.

### 7. Next.js — Active-State via `usePathname`

```tsx
"use client";
import { usePathname } from "next/navigation";

export function AppLauncher() {
  const pathname = usePathname();
  // ...
  const active = (app: AppDef) => app.match(pathname);
}
```

Da der Launcher keine serverseitigen Daten braucht, ist `"use client"` akzeptabel.

## Verboten

```svelte
<!-- Kein Inline-URL-Vergleich statt match() -->
class:active={page.url.pathname === '/admin/email'}

<!-- Kein floating/portal-Pattern -->
<aside class="fixed left-0 top-0 h-screen w-12 z-50 ...">

<!-- Kein Rendern außerhalb des Admin-Layouts -->
<!-- (root +layout.svelte, public pages, customer-facing routes) -->

<!-- Kein clientseitiger Role-Check als einziger Guard -->
{#if user?.role === 'admin'}
  <AppLauncher />
{/if}
```

## Audit-Checks

1. Hat das Projekt > 1 Admin-Sektion und keine `AppLauncher`-Komponente? → WARN
2. Wird `AppLauncher` außerhalb eines Admin-Layouts gerendert? → FAIL
3. Verwendet Active-State direkt `pathname === x` statt `match()`-Funktion? → WARN
4. Fehlt der Standalone/Kiosk-Override bei Projekten mit eigener Subdomain? → WARN
5. Icon-Größe uneinheitlich (nicht `h-[18px] w-[18px]`)? → WARN

## Verwandte Standards

- **045** — Dashboard-Layout (Content-Area rechts vom Launcher)
- **046** — Dev Panel (anderes floating Tool, lebt separat)
- **044** — SSoT & kein Hardcode (AppDef-Objekte als SSoT für Nav-Einträge)
