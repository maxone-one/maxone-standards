# 041 — AVV-/DPA-Registry

**Status:** active
**Seit:** 2026-05-08
**Gilt fuer:** alle Projekte, die personenbezogene Daten durch externe Dienstleister verarbeiten lassen ODER die im Auftrag eines Kunden personenbezogene Daten verarbeiten

## Regel

Dieser Standard deckt **beide Richtungen** der DSGVO Art. 28-Pflicht ab.

---

### Richtung 1: Max ist Verantwortlicher — externe Auftragsverarbeiter

Jeder externe Dienstleister, der personenbezogene Daten im Auftrag eines
Maxone-Projekts verarbeitet, MUSS vor Live-Gang in `registry/projects.yml`
als `data_processors`-Eintrag dokumentiert sein.

Fuer jeden Auftragsverarbeiter muss festgehalten werden:

- Dienstname
- Zweck der Verarbeitung
- verarbeitete Datenkategorien
- Server-/Verarbeitungsregion
- AVV-/DPA-Status
- Nachweis-Ort, z. B. Account-Pfad, Vertragsablage, Vendor-Doku oder Notiz
- Datum der letzten Pruefung
- Subprozessor-/Drittland-Hinweis, falls relevant

Kein Live-Gang mit `avv_status: missing` oder `unknown`, wenn der Dienst
personenbezogene Daten verarbeitet. Wenn ein Dienst kein Auftragsverarbeiter ist
(z. B. eigenstaendiger Verantwortlicher wie manche Payment-Anbieter), muss das
explizit als `avv_status: not-required` begruendet werden.

---

### Richtung 2: Max ist Auftragsverarbeiter — AVV an Kunden

Wenn Max eine Plattform im Auftrag einer Kundenorganisation betreibt und dabei
personenbezogene Daten der Kunden-Nutzer verarbeitet, ist Max Auftragsverarbeiter.
Der Kunde ist Verantwortlicher. Max MUSS diesem Kunden einen AVV ausstellen.

Typische Erkennungsmerkmale (`tags: customer` in der Registry):
- Plattform wird fuer eine bestimmte Organisation/Gemeinde/Firma betrieben
- Nutzer der Plattform sind Klienten/Buerger/Mitarbeiter dieser Organisation
- Max kontrolliert die Infrastruktur, der Auftraggeber definiert den Zweck

Fuer jede solche Beziehung muss in `registry/projects.yml` ein
`outbound_avv`-Eintrag angelegt werden:

```yaml
outbound_avv:
  - client: "Kundenname / Organisation"
    contact: "Ansprechpartner oder E-Mail"
    avv_status: signed        # signed | sent | missing | not-required
    evidence: "Ablageort des unterzeichneten AVV (z. B. Google Drive-Pfad)"
    reviewed_at: "YYYY-MM-DD"
    notes: "Optionale Anmerkung"
```

Erlaubte `avv_status`-Werte fuer `outbound_avv`:

- `signed` — AVV beidseitig unterzeichnet, liegt im Archiv
- `sent` — AVV wurde an Kunden versandt, Gegenzeichnung steht aus
- `missing` — AVV wurde noch nicht erstellt; nicht live-faehig
- `not-required` — Kein Auftragsverarbeitungsverhaeltnis (Begruendung in `notes`)

Projekte mit `tags: product`, `brand`, `infra` oder `internal` benoetigen
`outbound_avv` nur, wenn sie nachweislich B2B-Kunden haben, die eigene
Kundendaten ueber die Plattform verarbeiten lassen. In diesem Fall explizit
eintragen; andernfalls Feld weglassen.

---

## Warum

DSGVO Art. 28 verlangt fuer **jede** Auftragsverarbeitung einen bindenden Vertrag —
unabhaengig davon, ob Max Auftraggeber oder Auftragnehmer ist. Der Vertrag muss
Gegenstand, Dauer, Art und Zweck der Verarbeitung, Datenkategorien,
Betroffenengruppen sowie Rechte und Pflichten des Verantwortlichen festlegen.

In Vibe-Coding- und SaaS-Setups entstehen AVV-Luecken besonders leicht:

- ein neuer Mail-, Analytics-, AI-, Hosting- oder Storage-Dienst wird schnell
  eingebaut, aber nicht vertraglich geprueft (Richtung 1)
- eine Kundenplattform geht live, ohne dass der Kunde einen AVV von Max erhalten
  hat — obwohl Max Nutzerdaten des Kunden verarbeitet (Richtung 2)
- bei Sunset wird der Dienst gekuendigt, aber AVV-/Datenloeschpflichten werden
  nicht nachgezogen

Dieser Standard macht AVV nicht zu einer Chat-Erinnerung, sondern zu einer
pruefbaren Registry-Pflicht — in beiden Richtungen.

---

## Wie anwenden

**1. `data_processors` in `registry/projects.yml` (Richtung 1):**

```yaml
data_processors:
  - service: Hetzner
    purpose: Hosting / VPS / Storage
    personal_data: alle App-Daten, IP-Adressen, Server-Logs
    region: EU / Deutschland
    avv_status: standard-terms
    evidence: Hetzner Account -> Datenschutz / AVV
    reviewed_at: "2026-05-08"
    subprocessors: siehe Anbieter-Doku
    transfer_basis: EU-only
```

**2. Erlaubte `avv_status`-Werte (Richtung 1):**

- `signed` — individueller AVV/DPA abgeschlossen
- `account-enabled` — AVV im Anbieter-Account akzeptiert/aktiviert
- `standard-terms` — AVV/DPA ist Bestandteil der Anbieterbedingungen
- `not-required` — Dienst ist kein Auftragsverarbeiter; Begruendung in `evidence`
- `missing` — nicht live-faehig, bevor geklaert
- `unknown` — nicht live-faehig, bevor geklaert

**3. `outbound_avv` in `registry/projects.yml` (Richtung 2):**

```yaml
outbound_avv:
  - client: "Stadtlahnflow-Betreiber"
    contact: "ansprechpartner@beispiel.de"
    avv_status: signed
    evidence: "Google Drive / Vertraege / Stadtlahnflow-AVV-2026-05.pdf"
    reviewed_at: "2026-05-18"
```

**4. Typische Kandidaten Richtung 1:**

- Hosting/VPS/Storage: Hetzner, Cloudflare, AWS, Azure, GCP
- Datenbank/Auth: Supabase Cloud, Firebase, Neon, PlanetScale
- Mail/CRM: Brevo, Mailchimp, SendGrid, Postmark
- Payment: Mollie (Rolle pruefen: haeufig eigener Verantwortlicher plus
  Auftragsverarbeitung fuer Teilfunktionen)
- Analytics/Monitoring: Sentry, Datadog, Plausible/Umami Cloud
- AI-/LLM-APIs: Anthropic, OpenAI, OpenRouter, sonstige Modellanbieter
- Forms/Automation: Typeform, Zapier, Make, Google Workspace, Microsoft 365

**5. Gate-Verknuepfung:**

- Standard 015 `CONCEPT.md`: geplante `data_processors` und `outbound_avv` bereits
  in Section "Externe Dienste" entwerfen
- Standard 013 `LAUNCH-REVIEW.md`: vor Live-Gang gegen `registry/projects.yml`
  abgleichen
- Standard 014 Sunset: AVV-/DPA-Kuendigung, Datenloeschung und Exportpflichten
  beim Abbau pruefen
- Standard 016 Stack-Whitelist: Dienst ohne klaerbaren AVV-/DPA-Status ist fuer
  PII-Projekte nicht whitelistfaehig
- Standard 017 DSGVO-Tracker: Tracker-Inventar und AVV-Registry muessen
  dieselben externen Dienste nennen

---

## Audit

`scripts/audit.mjs` prueft pro Projekt mit `status: live` oder `status: dev`:

**Richtung 1 (`data_processors`):**

- `data_processors` fehlt komplett -> **WARN**
- `data_processors: []` bei Customer-/Product-/Brand-Projekt mit Domain ->
  **WARN** (explizit pruefen, ob wirklich kein Auftragsverarbeiter existiert)
- Eintrag ohne `service`, `purpose`, `personal_data`, `region`,
  `avv_status`, `evidence` oder `reviewed_at` -> **WARN**
- `avv_status: missing` oder `unknown` bei Live-Projekt -> **FAIL**
- unbekannter `avv_status` -> **WARN**
- `reviewed_at` aelter als 12 Monate -> **WARN**

**Richtung 2 (`outbound_avv`):**

- Projekt hat `tags: customer` und Live-Status, aber kein `outbound_avv` -> **WARN**
- `outbound_avv`-Eintrag ohne `client`, `avv_status`, `evidence` oder
  `reviewed_at` -> **WARN**
- `avv_status: missing` bei Live-Projekt -> **FAIL**
- `reviewed_at` aelter als 12 Monate -> **WARN**

Das Audit ersetzt keine juristische Pruefung. Es erzwingt nur, dass die Pruefung
nicht vergessen und nicht zwischen Chat, Account-Menues und Markdown verstreut
wird.

---

## Quellen

- DSGVO Art. 28 (EU-Verordnung 2016/679, EUR-Lex)
- European Data Protection Board: Guidelines zu Controller-/Processor-Rollen
  und Pflichtinhalten eines Controller-Processor-Contracts
