# 004: HANDOFF.md auf dem Server

**Status:** active
**Seit:** etabliert, formalisiert 2026-04-27
**Gilt für:** alle Projekte mit Server-Deploy

## Regel

Jedes Projekt hat unter `/opt/<projekt>/HANDOFF.md` ein Briefing-Dokument
mit aktuellem Stand, Architektur und projekt-spezifischen Regeln. Vor jeder
Arbeit am Projekt: erst HANDOFF lesen.

## Warum

Bei 11+ Projekten kann man den Stand nicht im Kopf behalten. Wenn die
Wahrheit nur in Container-Configs und Code verstreut liegt, dauert
Onboarding (Claude oder Mensch) jedes Mal lange und es passieren Fehler
durch falsche Annahmen.

## Wie anwenden

Vor Arbeit:
```bash
ssh -i ~/.ssh/id_ed25519 root@<server> "cat /opt/<projekt>/HANDOFF.md"
```

Inhalt (siehe `templates/HANDOFF.md` als Skelett):
- **Stand:** Letzter Deploy, aktive Probleme, offene TODOs
- **Architektur:** Tech-Stack, Container, Datenbank, Reverse Proxy
- **Domains:** Live-Domains, Aliase, DNS-Status
- **Secrets:** Welche Keys liegen im Store, Rotations-History
- **Deploy:** Wie deployen (Blue/Green-Swap-Befehl, CI-Workflow-Name)
- **Tests:** Smoke-Befehl, Unit-Befehl, Test-URL für Staging
- **Bekannte Eigenheiten:** Was ist nicht offensichtlich aus Code/Configs

## Audit

`scripts/audit.mjs` prüft (per SSH):
- Existenz `/opt/<projekt>/HANDOFF.md`
- Letzte Änderung (älter als 30 Tage → Warnung)
