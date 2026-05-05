# maxone-standards

Zentrale Quelle für Architektur-, Deploy-, Security- und Text-Standards aller
maxone-Projekte. Kein Runtime-Code — nur Regeln, Templates, Checklisten und
Tools, um diese Regeln auf alle Projekte (eigene + Kunden) anzuwenden und ihre
Einhaltung zu überprüfen.

## Warum

Mit aktuell 11+ eigenen Projekten passiert es regelmäßig, dass eine Änderung
an einem Projekt mehrere andere bricht — weil jedes Projekt seine eigene
Variante von Deploy, Secrets, Tests, Pfaden hat. Bei zukünftigen Kunden­
projekten ist das nicht akzeptabel.

`maxone-standards` ist die **Single Source of Truth** für:

- **Architektur-Standards** (Next.js Rendering, Docker, Reverse Proxy, DB)
- **Deploy-Standards** (Blue/Green, Image-Transfer, kein Build auf Prod)
- **Security-Standards** (Secrets-Store, TLS via DNS-01, Credential-Hoheit)
- **Test-Standards** (Smoke + Unit, ENV-Overrides, TESTING.md)
- **Pfad-Standards** (`/opt/<projekt>/`, `HANDOFF.md`, Container-Naming)
- **Text-Standards** (Impressum, Mail-Footer, Error-Pages, Cookie-Hinweise)
- **Sprach-Standards** (Echte Umlaute, wahrhaftige Unterschrift)

## Struktur

```
standards/    Die Regeln selbst (Markdown, versioniert, mit Begründung)
templates/    Wiederverwendbare Skelette (docker-compose, GH-Actions, .env)
scripts/      audit.mjs (Compliance-Scan), apply-template.mjs (Roll-out)
registry/     projects.yml — alle Projekte mit Domain/Server/Status
texts/        Wiederverwendbare Texte (Impressum, Footer, Error-Seiten)
checklists/   Neues Projekt, Neuer Kunde, Pre-Deploy, Post-Deploy
```

## Anwendung

```bash
# Alle Projekte gegen alle Standards prüfen
node scripts/audit.mjs

# Nur ein Projekt
node scripts/audit.mjs --project=snapflow.one

# Template in ein Projekt ausrollen
node scripts/apply-template.mjs --template=docker-compose.blue-green --project=plansey
```

## Nicht-Ziele

- Keine Runtime-Logik, kein Code der gedeployed wird
- Kein Ersatz für `CLAUDE.md` (globale Verhaltensregeln) — `standards/` ist
  die ausführliche Doku, `CLAUDE.md` der Quick-Reference für Claude
- Kein Build-System / Mono-Repo — Projekte bleiben eigenständig
