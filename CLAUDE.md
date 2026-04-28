# maxone-standards — Projekt-Notizen für Claude

## Beim Sitzungsstart IMMER lesen

[`HANDOFF.md`](HANDOFF.md) — aktueller Stand der offenen Übergabe.

## Was dieses Repo ist

Governance-Repo für die 29 maxone-Standards (Architektur/Deploy/Security/UI/
LLM-Härtung) über 11 Projekte. Nicht der Code der Projekte selbst — nur die
Regeln, das Audit-Script und die Templates.

## Wichtige Eigenheiten

- **`scripts/audit.mjs`** prüft lokal (Glob + Grep) UND per SSH gegen 4 Server
  (`maxone-prod` 128.140.40.235, `voltfair-cli` 46.225.107.118, `voltfair-db`
  46.225.168.235, `vybora-prod` 46.225.88.53). SSH-Fails degradieren auf WARN,
  nicht FAIL — `--local-only` schaltet SSH komplett aus.
- **`registry/projects.yml`** — Single Source of Truth für die 11 Projekte.
  Hat `path_local` (Windows-Pfade), keinen `repo:`-URL — Audit ist daher
  lokal-gebunden und nicht in einer Cloud-Sandbox lauffähig.
- **`registry/exceptions.yml`** — formale Ausnahmen pro (Projekt, Standard)
  mit `granted_at` + `expires_until` + `granted_by`. Audit reklassifiziert
  FAIL/WARN nach SKIP, solange Ausnahme aktiv. Default-Lebensdauer 6 Monate;
  abgelaufene Ausnahmen → Audit zeigt wieder echtes FAIL/WARN.
- **Bewusste Ausnahmen** außer den o.g. formalen sind in `standards/*.md`
  dokumentiert (z.B. SLF Impressum lokal — Tabelle in
  `009-impressum-widget.md`). Bevor du eine WARN/FAIL-Meldung als Bug
  behandelst: Standard-Doku + `registry/exceptions.yml` checken.

## Audit-Lauf

```bash
node scripts/audit.mjs                    # voller Lauf inkl. SSH
node scripts/audit.mjs --local-only       # nur lokal
node scripts/audit.mjs --project=katchi   # nur ein Projekt
node scripts/audit.mjs --standard=009     # nur ein Standard
```

Output ist plain-text mit `[OK]`, `[WARN]`, `[FAIL]`, `[skip]` und einem
Summary-Block am Ende.

## Baseline

`audits/baseline-2026-04-27.txt` ist die Diff-Anker-Datei für den nächsten
Compliance-Vergleich (siehe HANDOFF).
