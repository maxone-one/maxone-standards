# maxone-standards

Zentrale Quelle für Architektur-, Deploy-, Security- und Text-Standards aller
maxone-Projekte. Kein Runtime-Code, nur Regeln, Templates, Checklisten und
Tools, um diese Regeln auf alle Projekte (eigene + Kunden) anzuwenden und ihre
Einhaltung zu überprüfen.

## Warum

Mit aktuell 11+ eigenen Projekten passiert es regelmäßig, dass eine Änderung
an einem Projekt mehrere andere bricht, weil jedes Projekt seine eigene
Variante von Deploy, Secrets, Tests, Pfaden hat. Bei zukünftigen Kunden­
projekten ist das nicht akzeptabel.

`maxone-standards` ist die **Single Source of Truth** für:

- **Architektur-Standards** (Next.js Rendering, Docker, Reverse Proxy, DB)
- **Deploy-Standards** (Blue/Green, Image-Transfer, kein Build auf Prod)
- **Security-Standards** (Secrets-Store, TLS via DNS-01, Credential-Hoheit)
- **Compliance-Standards** (DSGVO, AVV/DPA, Tracker, Impressum, Launch-Reviews)
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

## Standards nach Kategorie

### 🚀 Deploy & Infrastruktur
| Nr. | Name |
|-----|------|
| 001 | Blue/Green Deployment |
| 002 | Kein Build auf Prod |
| 003 | Zentraler Secrets-Store |
| 004 | TLS via DNS-01 |
| 006 | HANDOFF.md |
| 007 | Pfade & Naming |
| 008 | Domain-Policy |
| 026 | Self-Hosted First |
| 027 | Deploy-Pipeline |
| 028 | Container-Misconfig |
| 033 | Post-Deploy Warmup |

### 🔒 Security & Compliance
| Nr. | Name |
|-----|------|
| 017 | DSGVO Tracker-Audit |
| 019 | Cert & DNS Reality |
| 020 | Pentest Light |
| 022 | Secret-Scan |
| 023 | Static Analysis |
| 029 | Indirect Prompt Injection |
| 035 | Wahrhaftige Unterschrift |
| 041 | AVV/DPA-Registry |

### 📋 Prozess & Qualität
| Nr. | Name |
|-----|------|
| 005 | Test-First |
| 013 | Launch-Gate-Review |
| 014 | Sunset |
| 015 | Concept-Gate |
| 018 | Bundle-Drift-Audit |
| 021 | Re-Review-Reminder |
| 024 | Code-Health-Budget |
| 036 | Spec-Archive |
| 037 | Tech-Stack-Currency |
| 038 | Cross-Project-Broadcast |

### 🧱 Code-Architektur & UI
| Nr. | Name |
|-----|------|
| 010 | Credits-API |
| 011 | Vector-Chat-Widget |
| 012 | Footer-Standard |
| 016 | Stack-Whitelist |
| 025 | LLM-App-Spezial |
| 032 | Supabase SSR Auth |
| 044 | SSoT & kein Hardcode |
| 045 | Dashboard-Layout |
| 046 | DevPanel |

### 🌐 Text, Sprache & Marke
| Nr. | Name |
|-----|------|
| 009 | Impressum-Widget |
| 040 | Deutsche Umlaute |

### 📡 Observability & Betrieb
| Nr. | Name |
|-----|------|
| 031 | Routine-Platform |
| 034 | Cost-Caps & Budget-Alerts |
| 042 | Version-Marker |

### 📬 Mail & Kommunikation
| Nr. | Name |
|-----|------|
| 030 | Mail-Architektur |
| 039 | Mailbox-Password-Sync |
| 043 | Cron-Email-Dedup |

---

## Nicht-Ziele

- Keine Runtime-Logik, kein Code der gedeployed wird
- Kein Ersatz für `CLAUDE.md` (globale Verhaltensregeln), `standards/` ist
  die ausführliche Doku, `CLAUDE.md` der Quick-Reference für Claude
- Kein Build-System / Mono-Repo, Projekte bleiben eigenständig
