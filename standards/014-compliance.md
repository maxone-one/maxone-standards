# 014 — Compliance-Lifecycle (Sunset · AVV/DPA-Registry)

**Status:** active
**Seit:** 2026-04-27 (Sunset), 2026-05-08 (AVV)
**Gilt für:** alle Projekte

## Inhalt

- [A] Sunset-Prozess
- [B] AVV/DPA-Registry (beide Richtungen)

---

## A — Sunset-Prozess

Wenn ein Projekt stillgelegt wird, läuft es durch einen definierten Prozess statt zu "verwaisen".

**Status-Lebenszyklus:**
```
live → sunset-pending (max. 30 Tage) → sunset → archived
```

**Pflicht-Schritte:**
1. `SUNSET.md` im Repo-Root anlegen (Datum, Grund, Verantwortlicher)
2. Datenexport für alle Nutzer (`pg_dump` nach Drive: `Sunset-Archiv/<projekt>/`)
3. Drittdienste bereinigen: Brevo deaktivieren, Supabase paused/deleted, Sentry/Analytics exportiert
4. Container stoppen + entfernen; `/opt/<projekt>/` und `/opt/secrets/<projekt>/` auf Drive sichern, dann auf Server löschen
5. DNS-A-Record entfernen oder auf Wartungs-Seite zeigen
6. `SUNSET.md` committen; GitHub Repo als Archive markieren
7. VECTOR informieren (kein Health-Check mehr)

**Domain-Lifecycle:** Customer-facing Domain ≥ 6 Monate live → mindestens 2 Jahre nach Sunset behalten + Wartungs-Seite mit "Service eingestellt am DD.MM.YYYY"-Hinweis.

**Warum:** Ohne Sunset verwaiste Container blockieren RAM/Ports (OOM-Risiko), Tracker feuern weiter ohne Rechtsgrundlage (DSGVO Art. 17), Domain-Übernahme-Risiko, AVV-Pflichten laufen weiter.

---

## B — AVV/DPA-Registry

Dieser Standard deckt **beide Richtungen** der DSGVO Art. 28-Pflicht ab.

### Richtung 1: Max ist Verantwortlicher — externe Auftragsverarbeiter

Jeder externe Dienstleister der personenbezogene Daten verarbeitet MUSS in `registry/projects.yml → data_processors` dokumentiert sein:

```yaml
data_processors:
  - service: Hetzner
    purpose: Hosting / VPS
    personal_data: App-Daten, IP-Adressen, Server-Logs
    region: EU / Deutschland
    avv_status: standard-terms
    evidence: Hetzner Account → Datenschutz / AVV
    reviewed_at: "2026-05-08"
    transfer_basis: EU-only
```

**avv_status:** `signed` | `account-enabled` | `standard-terms` | `not-required` (mit Begründung) | `missing` (nicht live-fähig) | `unknown` (nicht live-fähig)

**Typische Auftragsverarbeiter:** Hetzner, Supabase, Brevo, Mollie, Sentry/Umami, Anthropic/OpenAI, Google Workspace

### Richtung 2: Max ist Auftragsverarbeiter — AVV an Kunden

Wenn Max eine Plattform im Auftrag einer Kundenorganisation betreibt, MUSS er dieser Organisation einen AVV ausstellen:

```yaml
outbound_avv:
  - client: "Stadtlahnflow-Betreiber"
    contact: "ansprechpartner@beispiel.de"
    avv_status: signed
    evidence: "Google Drive / Vertraege / Stadtlahnflow-AVV-2026-05.pdf"
    reviewed_at: "2026-05-18"
```

**outbound_avv erforderlich bei:** `tags: customer` in der Registry (Plattform für eine bestimmte Organisation).

---

## Gate-Verknüpfung

- **Standard 013 CONCEPT.md (Gate 1):** geplante `data_processors` + `outbound_avv` in Section "Externe Dienste" entwerfen
- **Standard 013 LAUNCH-REVIEW.md (Gate 3):** vor Live-Gang gegen `registry/projects.yml` abgleichen
- **Sunset:** AVV-Kündigung, Datenlöschung und Exportpflichten beim Abbau prüfen

---

## Audit

`scripts/audit.mjs` prüft pro Projekt mit `status: live` oder `dev`:

**Sunset (`status: sunset-pending/sunset`):**
- `SUNSET.md` existiert mit Pflichtfeldern → fehlt = FAIL
- `sunset-pending` > 30 Tage → WARN
- `sunset` aber Container noch läuft → FAIL (per SSH)

**AVV Richtung 1 (`data_processors`):**
- Fehlt komplett → WARN
- `avv_status: missing` oder `unknown` → **FAIL**
- Fehlende Pflichtfelder → WARN
- `reviewed_at` > 12 Monate → WARN

**AVV Richtung 2 (`outbound_avv`):**
- `tags: customer` + live aber kein `outbound_avv` → WARN
- `avv_status: missing` → **FAIL**
- `reviewed_at` > 12 Monate → WARN
