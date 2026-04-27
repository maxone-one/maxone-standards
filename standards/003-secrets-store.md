# 003 — Zentraler Secrets-Store

**Status:** active
**Seit:** 2026-03 (etabliert), formalisiert 2026-04-27
**Gilt für:** alle Projekte auf maxone-prod, perspektivisch alle Server

## Regel

Alle Secrets liegen unter `/opt/secrets/<projekt>/keys.env` auf maxone-prod
als Single Source of Truth. Globale Keys (Brevo API, INWX) liegen unter
`/opt/secrets/global/`. Projekt-`.env` referenziert/kopiert vom Store —
niemals umgekehrt.

## Warum

Vor dem Store waren Secrets in 11 verschiedenen Projekt-`.env`-Dateien, oft
veraltet, manchmal mehrfach verwendet (Cross-Projekt-Brevo-SMTP-Key war ein
Vorfall am 24.03.2026). Bei Rotation musste man jede `.env` einzeln finden.
Mit Store: ein Ort, bekannte Struktur, von VECTOR lesbar.

## Wie anwenden

**Struktur:**
```
/opt/secrets/
├── global/
│   ├── keys.env          # BREVO_API_KEY, etc.
│   └── inwx.env          # DNS-01 Credentials für Traefik
├── stalwart/
│   └── keys.env          # Stalwart-Admin
└── <projekt>/
    └── keys.env          # Projekt-spezifisch (JWT, SMTP, etc.)
```

**Permissions:** 700 auf Ordner, 600 auf Dateien (nur root).

**Rotation-Reihenfolge:**
1. Neuen Key generieren
2. In Store speichern
3. In ALLE betroffenen Projekt-`.env` kopieren
4. Container `--force-recreate`
5. JEDEN Endpunkt testen
6. Drive-Backup
7. VECTOR informieren
8. Alten Key löschen — nur wenn alles grün ist

**Niemals:**
- Credentials im Klartext in CLI-Befehlen (`docker exec -e`, `curl -u`)
- Credentials nur in Projekt-`.env` ohne Store-Eintrag
- Passwörter ungefragt ändern
- Eigene Secrets generieren und stillschweigend eintragen

## Audit

`scripts/audit.mjs` prüft (per SSH):
- Existenz `/opt/secrets/<projekt>/keys.env` für jedes Projekt
- Permissions (700/600)
- Drive-Backup-Status (Datum letztes Backup)
