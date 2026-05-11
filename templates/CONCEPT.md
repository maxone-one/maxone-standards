# CONCEPT — <PROJEKTNAME>

> Pflicht-Dokument nach [Standard 015](https://github.com/maxone-one/maxone-standards/blob/main/standards/015-concept-gate.md).
> Vor erster Code-Zeile ausfüllen, Sign-Off einholen.
> Checkliste: [`checklists/015-concept-gate.md`](https://github.com/maxone-one/maxone-standards/blob/main/checklists/015-concept-gate.md)

---

## Problem

Ein bis drei Sätze: welches Problem löst das Projekt, für wen? Wenn das nicht
in einem Absatz passt, ist das Konzept noch nicht reif.

## Ziel / Erfolgs-Kriterium

Was ist „fertig"? Nicht „Feature X läuft", sondern: was misst messbar Erfolg?
(z.B. „1.000 aktive Nutzer in 6 Monaten", „intern: vermeidet 5h/Woche manuelle
Arbeit").

## Nutzer

| Rolle              | Anonym? | Eingeloggt? | Zahlend? | Anzahl bei Launch |
|--------------------|---------|-------------|----------|-------------------|
| z.B. Endkunde      | ja      | optional    | nein     | ?                 |
| z.B. Admin         | nein    | ja          | nein     | 1–2               |
| z.B. Pro-Nutzer    | nein    | ja          | ja       | ~10               |

## Datenmodell

Welche Entitäten gibt es, was wird gespeichert, wie sensibel?

| Entität     | Felder (Beispiele)                     | Sensitivität                                      |
|-------------|----------------------------------------|---------------------------------------------------|
| `users`     | email, password_hash, created_at       | personenbezogen (DSGVO Art. 4 Nr. 1)              |
| `orders`    | user_id, items, total, address         | personenbezogen + finanzbezogen                   |
| `messages`  | sender_id, recipient_id, body          | personenbezogen, möglicherw. Art. 9 wenn medizin. |

**Besondere Kategorien (Art. 9 DSGVO):** ja / nein — falls ja, welche?
*(Gesundheit, Religion, ethn. Herkunft, Sexualleben, Biometrie, …)*

**DSFA fällig:** ja / nein / unklar — Begründung: ...

## Auth-Modell

Pro Entität: wer darf lesen, wer darf schreiben? Default = niemand ausser
Owner.

| Entität     | Lesen                       | Schreiben                  | Löschen        |
|-------------|-----------------------------|----------------------------|----------------|
| `users`     | self                        | self (eigener Account)     | self           |
| `orders`    | self + admin                | self bei Erstellung, sonst admin | admin    |
| `messages`  | sender + recipient          | sender                     | sender         |

**Implementierung:** Supabase RLS-Policies pro Tabelle (Default-deny ohne
Policy). Service-Role nur server-seitig.

## Externe Dienste

Jeder Drittdienst, der Daten verarbeitet, mit Verarbeitungsrolle und
AVV-Status. Dienste, die personenbezogene Daten im Auftrag verarbeiten, muessen
vor Live-Gang zusaetzlich in `registry/projects.yml -> data_processors` nach
Standard 041 stehen.

| Dienst         | Zweck                         | Server-Region | AVV/DPA           | Datenkategorie      |
|----------------|-------------------------------|---------------|--------------------|---------------------|
| Hetzner        | Hosting                       | EU (Falkenstein) | ✅ Standard       | alle                |
| Supabase       | DB + Auth                     | EU (Frankfurt)| ✅ Pro-Plan        | User, App-Daten     |
| Brevo          | Transaktions-Mails            | EU            | ✅ im Account      | E-Mail-Adressen     |
| Stripe         | Zahlungen                     | EU/US         | ✅ Standard         | Zahlungsdaten       |
| OpenAI / Anthropic | (nur falls genutzt)       | US            | …                   | …                   |

**Registry-Abgleich (Standard 041):** geplante `data_processors`:

| Dienst | Zweck | Datenkategorie | Region | AVV/DPA-Status | Nachweis-Ort |
|--------|-------|----------------|--------|----------------|--------------|
|        |       |                |        |                |              |

**Server-Lock:** Code läuft nur auf eigener Infra (Hetzner) ODER auf
Whitelist-Plattform (siehe Standard 016, geplant). Lovable / Bolt / Base44
/ v0 nur mit dokumentiertem Migrationspfad.

## Threat-Model (Top 3–5)

Was ist das wahrscheinlichste Schadensszenario? Pro Risiko: wie wird es
abgewendet?

1. **Risiko:** unautorisierter Zugriff auf fremde Nutzerdaten (BOLA/IDOR)
   **Abwehr:** RLS-Policies + Pen-Test User-A vs User-B vor Launch (013-J)

2. **Risiko:** Service-Role-Key im Frontend-Bundle exfiltrierbar
   **Abwehr:** Bundle-Scan in CI (013-F), nur `PUBLIC_*` Keys client-seitig

3. **Risiko:** Tracker ohne Consent → DSGVO-Bussgeld
   **Abwehr:** Consent-Banner vor erstem Tracker-Request (013-D), Audit
   externer Hosts beim Initial-Load

4. *(weitere)*

## Stack-Wahl

| Schicht             | Wahl                                  | Warum diese?                                |
|---------------------|---------------------------------------|---------------------------------------------|
| Frontend Framework  | SvelteKit / Next.js / …               | passt zu Erfahrung, eigene Infra-portabel   |
| Backend             | Supabase / eigener Node-Server / …    | ...                                         |
| Datenbank           | Postgres (Supabase) / SQLite / …      | ...                                         |
| Hosting             | Hetzner VPS                           | EU, eigene Kontrolle, Standard 002 erfüllbar|
| Reverse Proxy       | Traefik                               | Standard maxone-prod                        |
| KI-Coding-Tool      | Claude Code / Cursor / …              | Standard 016 (geplant) konform              |
| Externe AI-Modelle  | Anthropic (CLI, kein API) / …         | siehe globale Regel CLAUDE.md               |

**Nicht-Wahl:** Plattformen aus Standard 016 Blacklist (Lovable, Bolt,
Base44, v0) — Begründung warum ausgeschlossen: Lock-in, AVV-Lücken,
dokumentierte Sicherheitsvorfälle.

## Out of Scope

Was wird absichtlich NICHT gebaut, um Scope-Creep zu verhindern? Jeder
Punkt mit Begründung.

- Beispiel: „Mehrsprachigkeit" — initial nur DE, EN später wenn Kunden danach
  fragen. Verhindert übermässigen i18n-Overhead vor Product-Market-Fit.
- Beispiel: „mobile App" — PWA reicht, native App erst ab 1k Nutzer.

## Offene Fragen

Was ist noch zu klären, bevor Code-Bau startet? Jede offene Frage
verschiebt Gate 1.

- ...
- ...

---

## Gate 1 — Konzept-Sign-Off

- **Vorgeschlagen von:** Vor- Nachname (@github-user) am 2026-MM-DD
- **Reviewed von:** Vor- Nachname (@github-user) am 2026-MM-DD
- **Gate 1:** PASSIERT — Code-Bau freigegeben
- **Bekannte Risiken aus Threat-Model:**
  - ...
- **DSFA fällig (DSGVO Art. 35):** ja / nein / unklar — geprüft am 2026-MM-DD
- **Standard 016 (Stack-Whitelist) konform:** ja / nein (Begründung wenn nein)

---

## Re-Review (bei Konzept-Änderung)

Wenn Datenmodell, Auth-Modell oder externe Dienste sich ändern: oben
ergänzen, hier neuen Sign-Off-Block anhängen.

> *(Beispiel-Eintrag)*
>
> ### Re-Review 2026-MM-DD — Anlass: neuer Drittdienst „...", neue Tabelle „..."
>
> - Reviewed von: ... am 2026-MM-DD
> - Geänderte Sektionen: Datenmodell, Externe Dienste
> - Bekannte Risiken aus neuem Modell: ...
