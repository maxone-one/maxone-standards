# Standard 034 — Design Token Hierarchy (Zweistufige Token-Architektur)

## Ziel

Sicherstellen, dass eine Änderung an einem visuellen Wert (Schriftgröße, Farbe, Abstand) exakt an einer Stelle stattfindet und automatisch alle semantischen Token zieht, die diesen Wert tragen.

## Gesetz

Jedes Projekt das mit Tailwind-Klassen oder ähnlichen Utility-CSS-Systemen arbeitet, MUSS eine zweistufige Token-Architektur verwenden:

**Stufe 1 — Primitive:** Ein einziger String-Wert, einmal definiert.
**Stufe 2 — Semantische Token:** Zeigen auf einen Primitiv, nie auf einen eigenen String.

```ts
// RICHTIG
const P = {
  smMuted: 'text-sm text-muted-foreground',
} as const

const UI = {
  caption:      P.smMuted,
  cardSubtitle: P.smMuted,
  metricLabel:  P.smMuted,
}

const TABLE = {
  cellMuted:    P.smMuted,
  caption:      P.smMuted,
}
```

```ts
// FALSCH — kein echter SSOT, nur benanntes Copy-Paste
const UI    = { caption:   'text-sm text-muted-foreground' }
const TABLE = { cellMuted: 'text-sm text-muted-foreground' }
```

## Warum

Wenn n semantische Token denselben String direkt als Wert enthalten, muss eine globale Größenänderung an n Stellen durchgeführt werden. Der Anschein einer SSOT täuscht: semantische Namen und Namespace-Trennung lösen das Problem nicht, sie verstecken es.

Mit Primitiven reicht eine Änderung an `P.smMuted`, und alle semantischen Token folgen automatisch.

## Wo gilt das

Alle Projekte unter maxone.one. Betrifft: Tailwind-Token-Dateien (`landing-styles.ts`, `typography.ts` o.ä.), Design-System-Dateien, CSS Custom Properties.

## Audit

```bash
# Findet doppelte String-Werte in Token-Dateien
grep -h "'" lib/landing-styles.ts | sort | uniq -d
```

Wenn dieselbe Klassen-Kombination in mehr als einem Token als direkter String steht: Primitiv extrahieren.

## Aktueller Stand

venfree hat diesen Standard noch nicht vollständig umgesetzt. `lib/landing-styles.ts` enthält 4 Primitive-Gruppen die als direkter String in je 2–8 semantischen Tokens wiederholt werden. Umbau ausstehend.
