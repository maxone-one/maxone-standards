# 041 — AVV-/DPA-Registry

**Status:** active
**Seit:** 2026-05-08
**Gilt fuer:** alle Projekte, die personenbezogene Daten durch externe Dienstleister verarbeiten lassen

## Regel

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

## Warum

DSGVO Art. 28 verlangt, dass Verarbeitung durch Auftragsverarbeiter durch einen
bindenden Vertrag oder ein anderes Rechtsinstrument geregelt ist. Der Vertrag
muss unter anderem Gegenstand, Dauer, Art und Zweck der Verarbeitung,
Datenkategorien, Betroffenengruppen sowie Rechte und Pflichten des
Verantwortlichen festlegen.

In Vibe-Coding- und SaaS-Setups entstehen AVV-Luecken besonders leicht:

- ein neuer Mail-, Analytics-, AI-, Hosting- oder Storage-Dienst wird schnell
  eingebaut, aber nicht vertraglich geprueft
- der Dienst hat Subprozessoren oder Drittlandtransfer, die nicht in der
  Datenschutzerklaerung landen
- die technische Integration ist sichtbar, der Vertragsstatus aber nur im Kopf
  oder in einem Account-Menue
- bei Sunset wird der Dienst gekuendigt, aber AVV-/Datenloeschpflichten werden
  nicht nachgezogen

Dieser Standard macht AVV nicht zu einer Chat-Erinnerung, sondern zu einer
pruefbaren Registry-Pflicht.

## Wie anwenden

**1. In `registry/projects.yml`:**

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

**2. Erlaubte `avv_status`-Werte:**

- `signed` — individueller AVV/DPA abgeschlossen
- `account-enabled` — AVV im Anbieter-Account akzeptiert/aktiviert
- `standard-terms` — AVV/DPA ist Bestandteil der Anbieterbedingungen
- `not-required` — Dienst ist kein Auftragsverarbeiter; Begruendung in `evidence`
- `missing` — nicht live-faehig, bevor geklaert
- `unknown` — nicht live-faehig, bevor geklaert

**3. Typische Kandidaten:**

- Hosting/VPS/Storage: Hetzner, Cloudflare, AWS, Azure, GCP
- Datenbank/Auth: Supabase Cloud, Firebase, Neon, PlanetScale
- Mail/CRM: Brevo, Mailchimp, SendGrid, Postmark
- Payment: Stripe, PayPal, Mollie (Rolle pruefen: haeufig eigener
  Verantwortlicher plus Auftragsverarbeitung fuer Teilfunktionen)
- Analytics/Monitoring: Sentry, Datadog, Plausible/Umami Cloud, Google
  Analytics
- AI-/LLM-APIs: OpenAI, Anthropic, OpenRouter, sonstige Modellanbieter
- Forms/Automation: Typeform, Zapier, Make, Google Workspace, Microsoft 365

**4. Gate-Verknuepfung:**

- Standard 015 `CONCEPT.md`: geplante `data_processors` bereits in Section
  "Externe Dienste" entwerfen
- Standard 013 `LAUNCH-REVIEW.md`: vor Live-Gang gegen `registry/projects.yml`
  abgleichen
- Standard 014 Sunset: AVV-/DPA-Kuendigung, Datenloeschung und Exportpflichten
  beim Abbau pruefen
- Standard 016 Stack-Whitelist: Dienst ohne klaerbaren AVV-/DPA-Status ist fuer
  PII-Projekte nicht whitelistfaehig
- Standard 017 DSGVO-Tracker: Tracker-Inventar und AVV-Registry muessen
  dieselben externen Dienste nennen

## Audit

`scripts/audit.mjs` prueft pro Projekt mit `status: live` oder `status: dev`:

- `data_processors` fehlt komplett -> **WARN**
- `data_processors: []` bei Customer-/Product-/Brand-Projekt mit Domain ->
  **WARN** (explizit pruefen, ob wirklich kein Auftragsverarbeiter existiert)
- Eintrag ohne `service`, `purpose`, `personal_data`, `region`,
  `avv_status`, `evidence` oder `reviewed_at` -> **WARN**
- `avv_status: missing` oder `unknown` bei Live-Projekt -> **FAIL**
- unbekannter `avv_status` -> **WARN**
- `reviewed_at` aelter als 12 Monate -> **WARN**

Das Audit ersetzt keine juristische Pruefung. Es erzwingt nur, dass die Pruefung
nicht vergessen und nicht zwischen Chat, Account-Menues und Markdown verstreut
wird.

## Quellen

- DSGVO Art. 28 (EU-Verordnung 2016/679, EUR-Lex)
- European Data Protection Board: Guidelines zu Controller-/Processor-Rollen
  und Pflichtinhalten eines Controller-Processor-Contracts
