# 045 — Dashboard-Layout-Konsistenz

**Status:** active
**Seit:** 2026-05-17
**Gilt für:** alle Projekte mit Dashboard/App-Bereich

## Problem

Jede Dashboard-Seite wächst organisch: eigene Grid-Breiten, eigene Card-Padding,
eigene Content-Wrapper. Das Ergebnis sind Seiten die nebeneinander inkonsistent
wirken, obwohl sie zum selben Produkt gehören.

## Pflicht-Regeln

### 1. Content-Wrapper — Strategie pro Projekt

Jedes Projekt wählt **eine** der beiden Strategien und nutzt sie konsequent auf
allen Dashboard-Seiten. Mischen ist verboten.

**Strategie A — Full-width** (empfohlen für daten-/admin-lastige Apps wie vanfree, voltfair):

```tsx
<div className="w-full px-4 py-6 md:px-6 md:py-8">
  {/* Seiteninhalt */}
</div>
```

**Strategie B — Constrained** (empfohlen für content-/formular-lastige Apps wie plansey):

```tsx
<div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
  {/* Seiteninhalt */}
</div>
```

**Ausnahme** (in beiden Strategien erlaubt): Detail-/Formular-Seiten mit
einem einzelnen Objekt im Fokus dürfen `max-w-3xl` für bessere Lesbarkeit.
Dies muss eine bewusste Entscheidung sein, nicht ein dritter Default —
sichtbar an dokumentiertem Kommentar oder konsistenter Anwendung über
alle solchen Seiten.

**Verboten:**
- Innerhalb desselben Projekts beide Strategien mischen
- `max-w-4xl`, `max-w-5xl`, `max-w-6xl` als Default (nur als Detail-Ausnahme oben)
- Wrapper komplett weglassen (führt zu Inhalt ohne Padding bis zum Browser-Rand)

### 2. Seiten-Heading

```tsx
<div className="mb-6 md:mb-8">
  <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
  {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
</div>
```

### 3. Stat/KPI-Karten — Grid

Drei erlaubte Spalten-Konfigurationen:

| Konfiguration | Klassen |
|---------------|---------|
| 2-up (wenige, große KPIs) | `grid grid-cols-1 gap-4 sm:grid-cols-2` |
| 3-up (Standard) | `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3` |
| 4-up (kompakte KPI-Zeile) | `grid grid-cols-2 gap-4 md:grid-cols-4` |

Kein `grid-cols-5`, kein `grid-cols-6` — bei mehr als 4 Metriken zwei Zeilen
à 4 oder eine 3-up-Zeile verwenden.

### 4. Stat/KPI-Karten — Inhalt

```tsx
// Pflicht-Struktur einer StatCard
<div className="rounded-xl border border-border bg-card p-5">
  <div className="flex items-center justify-between">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <div className="rounded-lg p-2 bg-primary/10">
      <Icon className="h-4 w-4 text-primary" />
    </div>
  </div>
  <p className="mt-3 text-2xl font-semibold">{value}</p>
  {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
</div>
```

Fixe Werte:
- Padding: `p-5` (nicht p-4, nicht p-6)
- Border-Radius: `rounded-xl`
- Icon-Container: `rounded-lg p-2`, Icon: `h-4 w-4`
- Value-Schrift: `text-2xl font-semibold`
- Label-Schrift: `text-sm font-medium text-muted-foreground`

### 5. Content-Sektionen & Listen-Karten

Für Tabellen, Listen, Detail-Panels:

```tsx
<div className="rounded-xl border border-border bg-card">
  <div className="border-b border-border px-5 py-4">
    <h2 className="text-sm font-semibold">{sectionTitle}</h2>
  </div>
  <div className="p-5">
    {/* Inhalt */}
  </div>
</div>
```

### 6. Gap & Spacing zwischen Sektionen

```tsx
<div className="space-y-6">
  {/* KPI-Grid */}
  {/* Content-Sektion 1 */}
  {/* Content-Sektion 2 */}
</div>
```

- Zwischen Sektionen: `space-y-6` (24 px)
- Innerhalb einer Sektion: `gap-4` (16 px)
- Kein `space-y-4` auf Seitenebene, kein `gap-6` auf Karten-Ebene

### 7. Loading States — Skeleton statt Spinner

Beim initialen Laden von Daten zeigen wir **Skeleton-Loader** (Platzhalter
in Form der späteren Karten), keine isolierten Spinner. Nutzer sehen die
Seitenstruktur sofort und die gefühlte Ladezeit sinkt.

```tsx
{isLoading ? (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
    ))}
  </div>
) : (
  <StatGrid data={data} />
)}
```

Spinner sind nur für **kurze**, **inline** Aktionen erlaubt (Button-Submit,
optimistische Updates).

### 8. Mobile Bottom-Spacing bei Bottom-Nav

Projekte mit einer Mobile-Bottom-Nav (vanfree, snapflow) müssen im
scrollbaren Content-Container Padding nach unten lassen, sonst überdeckt
die Nav den letzten Karten-Rand:

```tsx
<main className="flex-1 overflow-y-auto pb-14 md:pb-0">
  {/* Content */}
</main>
```

`pb-14` (56 px) entspricht der Standard-Höhe der Mobile-Nav. Projekte mit
höherer Nav passen entsprechend an.

## Erlaubte Abweichungen

- Projekte mit eigenem Design-System (z.B. abweichende Brand-Farbe) dürfen
  Farbklassen anpassen — Struktur und Spacing bleiben fest
- Shadcn/UI `<Card>` als Wrapper erlaubt, wenn `CardContent` das `p-5`-Padding
  liefert (`className="p-5"`)

## Verboten

```tsx
// ❌ Verschiedene Padding-Werte auf derselben Seite
<div className="p-4">...</div>
<div className="p-6">...</div>

// ❌ Nicht-standardisierte Spalten-Anzahl
<div className="grid-cols-5">

// ❌ Kein Wrapper / volle Seitenbreite ohne max-width
<div className="w-full">
  <div className="grid grid-cols-3">

// ❌ Inline-Style für Spacing
<div style={{ padding: '20px' }}>
```

## Referenz-Implementierung

`voltfair.de/app/(dashboard)/admin/benutzer/page.tsx` + `StatsCard`-Komponente
dienen als nächste Referenz-Implementierung. Bei Abweichungen: diese Seite
als Vorlage nehmen.

## Audit-Checks

1. Gibt es eine `StatCard`-Komponente (oder Äquivalent) pro Projekt? → Kein
   direktes grep-Pattern möglich; visueller Review bei Launch-Gate (→ 013)
2. Gibt es `grid-cols-5` oder `grid-cols-6` auf Dashboard-Seiten? → WARN
3. Gibt es `p-4` und `p-6` auf derselben Dashboard-Seite? → WARN
4. Mischt das Projekt Strategie A (full-width) und B (max-w-7xl) innerhalb
   der Dashboard-Routen? → WARN
5. Hat das Projekt eine `MobileBottomNav` aber kein `pb-14` im Scroll-Container? → WARN

## Verwandte Standards

- **044** — SSoT/No-Hardcode (StatCard-Komponente = SSoT für Karten-Markup)
- **013** — Launch-Gate-Review (visuelles UI-Review vor Go-Live)
- **005** — Test-First (Playwright-Screenshot-Tests für kritische Dashboard-Views)
