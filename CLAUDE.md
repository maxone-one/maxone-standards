# maxone-standards: Projekt-Notizen für Claude

## Beim Sitzungsstart IMMER lesen

1. [`PLAN.md`](PLAN.md), vereinbarter Scope, offene Standards-Arbeit
2. [`BUGS.md`](BUGS.md), bekannte Bugs in audit.mjs + Standards-Infrastruktur

## Was dieses Repo ist

Governance-Repo für die 30 maxone-Standards (Architektur/Deploy/Security/UI/
LLM-Härtung/Mail/Ops/Auth) über 14 Projekte. Nicht der Code der Projekte selbst
nur die Regeln, das Audit-Script und die Templates.

## Wichtige Eigenheiten

- **`scripts/audit.mjs`** prüft lokal (Glob + Grep) UND per SSH gegen konfigurierte
  Server. SSH-Konfiguration in `config/servers.local.yml` (gitignored, Vorlage:
  `config/servers.example.yml`). SSH-Fails degradieren auf WARN, nicht FAIL
  `--local-only` schaltet SSH komplett aus.
- **`registry/projects.yml`**, Single Source of Truth für alle Projekte.
  Kein `path_local` mehr (lokal konfigurieren falls nötig). Audit mit `--local-only`
  läuft ohne lokale Pfade.
- **`registry/exceptions.yml`**, formale Ausnahmen pro (Projekt, Standard)
  mit `granted_at` + `expires_until` + `granted_by`. Audit reklassifiziert
  FAIL/WARN nach SKIP, solange Ausnahme aktiv. Default-Lebensdauer 6 Monate;
  abgelaufene Ausnahmen → Audit zeigt wieder echtes FAIL/WARN.
- **Bewusste Ausnahmen** außer den o.g. formalen sind in `standards/*.md`
  dokumentiert. Bevor du eine WARN/FAIL-Meldung als Bug behandelst:
  Standard-Doku + `registry/exceptions.yml` checken.

## Audit-Lauf

```bash
node scripts/audit.mjs                    # voller Lauf inkl. SSH
node scripts/audit.mjs --local-only       # nur lokal (kein SSH nötig)
node scripts/audit.mjs --project=katchi   # nur ein Projekt
node scripts/audit.mjs --standard=009     # nur ein Standard
node scripts/audit.mjs --emit=issues      # GH-Issue-Format (json + md)
```

Output ist plain-text mit `[OK]`, `[WARN]`, `[FAIL]`, `[skip]`, einem
Score-Block (0-10 pro Standard) und einem Summary-Block am Ende.
`--emit=issues` schreibt zusätzlich `audits/issues-<date>.{json,md}`
(gh-CLI-tauglich, dedupliziert per Projekt+Standard, gitignored).
