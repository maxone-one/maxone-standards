# 030 — Mail-Architektur (Outbound=Brevo, Inbound+Sent=Stalwart)

**Status:** active
**Seit:** 2026-04-28
**Gilt für:** alle Projekte, die programmatisch E-Mails versenden,
empfangen oder lesen (Edge-Functions, Backend-Routes, KI-Mail-Clients
wie Zentinel). Reine Marketing-Newsletter über UI-Wizards (Brevo-
Frontend manuell) sind nicht betroffen.

## Regel

Jedes Projekt mit Mail-Code **MUSS** dieser Architektur folgen:

1. **Outbound = Brevo** über `https://api.brevo.com/v3/smtp/email`.
   Niemals über Stalwart-SMTP, niemals über `nodemailer` direkt zu
   einem anderen MTA. Stalwart-Logs zeigen **niemals** ausgehende
   App-Mails — wer im Stalwart-Log nach Outbound sucht, sucht falsch.
2. **Inbound + Sent-Folder = Stalwart** über JMAP
   (`http://stalwart-mail:8080/jmap/session`, intern; nie über die
   Public-URL aus Edge-Functions).
3. **Brevo-Domain-Pre-Flight (Regel 20 der Bibel) Pflicht vor jedem
   Send.** Ohne `authenticated:true && verified:true` in
   `GET /v3/senders/domains` wird der Send mit Status
   `rejected_unauthenticated_domain` abgewiesen — **bevor** er
   Brevo erreicht.
4. **Health-Checks gegen Stalwart NIE mit Fake-Auth-Headern.**
   Stalwart bannt nach **2** fehlgeschlagenen Auth-Versuchen. Ein
   Probe wie `Basic healthcheck:invalid` triggert den Auto-Ban
   innerhalb von 4 Minuten und nimmt das ganze Mail-System mit.
5. **JMAP-Endpoints direkt:** `/jmap/session`, nie
   `/.well-known/jmap` (307-Redirect, Deno-Fetch im Edge-Runtime
   folgt ihm nicht zuverlässig).
6. **JMAP-Template-Segmente erhalten:** `uploadUrl` aus
   `/jmap/session` enthält `{accountId}` — beim Host-Rewrite niemals
   per `.split("{")[0]` strippen, sondern in der Send-Methode per
   `.replace("{accountId}", this._accountId)` ersetzen. Sonst
   landen Sent-Kopien als Orphan-Blobs im Default-Account `"a"`,
   und Stalwart antwortet **klaglos mit 200**.
7. **Bei „Mail nicht angekommen?"-Diagnose IMMER zuerst Brevo
   Events API** (`GET /v3/smtp/statistics/events?email=…`),
   nicht Stalwart-Logs. Stalwart sieht Outbound nie.
8. **Kein direkter Edit von Live-Edge-Functions auf dem Server.**
   Reihenfolge: Repo-Edit → Commit → Deploy via CI →
   `scp` aus Repo (nur wenn manuell nötig). Direkt-Edits in
   `/opt/supabase/docker/volumes/functions/email-client/index.ts`
   werden bei der nächsten Deploy-Welle überschrieben.

## Warum

Diese Regel ist die destillierte Form von **20 unverhandelbaren
Regeln** aus der Stalwart-Bibel
([`maxone.one/briefings/ZENTINEL-STALWART-BIBEL.md`](https://github.com/maxone-one/maxone.one/blob/main/briefings/ZENTINEL-STALWART-BIBEL.md)),
die aus drei realen Vorfällen gewachsen sind:

### Vorfall 1 — 2026-03-24 Stalwart Admin Lockout
- `docker run` für einen Test → Orphan-Container blockierte Ports und
  RocksDB.
- Passwort in `config.toml` geändert ohne zu wissen, dass die
  RocksDB-DB Vorrang hat.
- Mehrere blinde Restart-Versuche, dann Brevo-Credentials in der CLI
  exponiert → Key-Rotation → Downtime aller Projekte.

### Vorfall 2 — 2026-04-05 Self-Inflicted Fail2Ban Loop
- `zentinel-health` schickte alle 2 Minuten `Basic healthcheck:invalid`
  → Stalwart bannte die Edge-Runtime-IP `10.0.2.3` nach 2 Calls.
- Recovery-Pfad lief vom Host gegen `http://stalwart-mail:8080/api/...`
  → Host bekam selbst einen Ban.
- Restart-Loop alle 2 Minuten bis Max die Timer manuell stoppte.
- Permanenter Fix: Commit `1a04dc0` (Health-Check ohne Authorization,
  `unban-stalwart.sh` über container-loopback, 9-Layer-Defense für
  Vector-Chat).

### Vorfall 3 — 2026-04-10 Sent-Items-Blackhole + Brevo Silent Rejection
- **Bug A:** `JmapClient.init()` warf via `.split("{")[0]` das
  `{accountId}/`-Template aus `uploadUrl`. Blob-Uploads landeten im
  Default-Account `"a"` statt im Caller-Account `"x"`. Stalwart
  antwortete 200, kein Side-Effect, Sent-Ordner blieb 5 Tage leer.
  7 Sent-Kopien zwischen 03.04. und 10.04. waren Blob-Orphans.
- **Bug B:** Eine spezifische Mail
  `max@maxone.one → r.jenau@linagames.de` (2026-04-03 14:43 UTC) wurde
  von Brevo mit `event=error` rejected, weil die Domain `maxone.one`
  erst 2026-04-05 17:21 UTC authentifiziert wurde. DB-Status war
  `sent`, Empfänger bekam nichts, **erst 7 Tage später** durch
  Empfänger-Rückfrage entdeckt.
- **Permanenter Fix:** Regel 19 + Regel 20 (Pre-Flight) in
  `email-client` deployed 2026-04-10.

### Vorfall 4 — 2026-04-27 Falsch-Negativ-Diagnose
- Diagnose von „hat Maik meine Mail bekommen?" begann fehlerhaft mit
  Stalwart-Logs (zeigten nichts → falsches „nein"). Erst nach
  Architektur-Recherche wurde Brevo Events API geprüft → Antwort lag
  dort. Globale Regel + Memory erzwingt jetzt **Brevo-First**.

### Vorfall 5 — 2026-05-16 Mailbox-Passwort-Desync + Ban-Zyklus
- Passwort für `hey@viktoria-from.de` über Atelier-Endpunkt geändert.
  Stalwart RocksDB aktualisiert, maxone-Supabase `email_accounts` nicht.
- `email-client` MDN-Checker (IP `10.0.2.3`) authentifiziert sich alle ~3 Min
  mit dem veralteten Passwort → 45+ `security.authentication-ban` Events
  zwischen 15:41 und 21:34 UTC.
- SnappyMail zeigte `AUTHENTICATIONFAILED` — Browser hatte ebenfalls das alte
  Passwort gespeichert.
- Stalwart-Neustart löscht den in-memory-Ban; ohne Store-Sync beginnt der
  Zyklus 2 Minuten nach dem Neustart neu. Nicht unterbrechbar ohne Sync.
- **Permanenter Fix:** Regel 23 (Bibel) + Standard 039.

**Gemeinsamer Nenner:** Alle fünf Vorfälle entstanden, weil die
Architektur-Trennung (Outbound=Brevo, Inbound+Sent=Stalwart) oder die
Store-Konsistenz (Stalwart RocksDB ↔ maxone email_accounts) nicht
internalisiert war — entweder im Code oder im Diagnose-Reflex. Ein Standard,
den das Audit prüft, ist die einzige zuverlässige Verteidigung.

## Wie anwenden

### A. Welche Projekte sind betroffen?

Ein Projekt ist betroffen, wenn der Code mindestens einen
**Mail-Marker** enthält:

- `api.brevo.com` (Brevo HTTP-API)
- `/jmap/session` oder `/jmap/upload` (Stalwart JMAP)
- `stalwart-mail:8080` (interner Hostname)
- Edge-Function-Verzeichnis `email-client/` oder `email/` mit Send-
  Logik
- `nodemailer.createTransport` mit Host `smtp-relay.brevo.com`
  oder `mail.maxone.one`

Stand 2026-04-28 betroffen: **maxone.one** (Zentinel
`/admin/email`). Andere Projekte SKIP.

### B. Pre-Flight-Funktion (Regel 20)

Pflicht-Snippet im Send-Code-Pfad:

```ts
// Pre-flight check vor jedem Brevo-Send (cached pro Domain für 24h)
const _domainAuthCache = new Map<string, { ok: boolean; ts: number }>();
const DOMAIN_TTL_MS = 24 * 60 * 60 * 1000;

async function ensureBrevoDomainAuthenticated(
  fromEmail: string,
  brevoKey: string,
): Promise<void> {
  const domain = fromEmail.split('@')[1];
  const cached = _domainAuthCache.get(domain);
  if (cached && Date.now() - cached.ts < DOMAIN_TTL_MS) {
    if (!cached.ok) {
      throw new Error(`[regel20] Brevo domain ${domain} not authenticated (cached)`);
    }
    return;
  }
  let r: Response;
  try {
    r = await fetch('https://api.brevo.com/v3/senders/domains', {
      headers: { 'api-key': brevoKey, accept: 'application/json' },
    });
  } catch (e) {
    // Fail-open bei Brevo-API-Outage — lieber riskante Mail als Stillstand
    console.warn('[regel20] Brevo lookup failed, fail-open:', e);
    return;
  }
  const j = await r.json();
  const d = (j.domains || []).find((x: any) => x.domain_name === domain);
  const ok = !!(d && d.authenticated && d.verified);
  _domainAuthCache.set(domain, { ok, ts: Date.now() });
  if (!ok) {
    throw new Error(`[regel20] Brevo domain ${domain} not authenticated — refusing send`);
  }
}
```

Bei Reject: `maxone.sent_emails` bekommt
`status='rejected_unauthenticated_domain'` (nicht `'sent'`), damit
der Brevo-Bounce-Watchdog diese Mails aus der Sent-Statistik
rausrechnen kann.

### C. JMAP-Template-Erhaltung (Regel 19)

```ts
// FALSCH (das war der 2026-04-10 Bug)
const upParsed = new URL(session.uploadUrl.split('{')[0], this.baseUrl);
this.uploadUrl = `${this.baseUrl}${upParsed.pathname}`;
//   → /jmap/upload/  ← KEIN accountId, Blobs landen im Default-Account "a"

// RICHTIG
const upParsed = new URL(session.uploadUrl);
this.uploadUrl = `${this.baseUrl}${upParsed.pathname}`;
//   → /jmap/upload/{accountId}/

// uploadBlob() ersetzt das Template zur Send-Zeit:
const url = (this.uploadUrl || `${this.baseUrl}/jmap/upload/{accountId}/`)
  .replace('{accountId}', this._accountId);
```

### D. Health-Check ohne Auth (Regel 4)

```ts
// FALSCH — bannt sich selbst nach 2 Calls
fetch('http://stalwart-mail:8080/jmap/session', {
  headers: { Authorization: 'Basic ' + btoa('healthcheck:invalid') },
});

// RICHTIG — 200 OK ohne Auth-Counter-Increment
fetch('http://stalwart-mail:8080/jmap/session');
```

### E. Diagnose-Reihenfolge (Regel „Brevo-First")

Bei „Hat X meine Mail bekommen?":

1. **Brevo Events API** für den Domain-Owner-Account:
   ```bash
   curl -sS -H "api-key: $BREVO_API_KEY" \
     "https://api.brevo.com/v3/smtp/statistics/events?email=$EMPFAENGER&limit=20" | jq
   ```
2. Erst bei `delivered` und Empfänger-Negativ-Bestätigung weiter zu
   Stalwart (sehr selten).

### F. Verbotene Befehle / Patterns auf Prod

Aus der Bibel Sektion II — diese Patterns dürfen weder im Code noch
in Runbook-Snippets erscheinen:

- `docker run --rm stalwartlabs/stalwart …`
- `curl -u 'user:pass' http://stalwart-mail:8080/...` (vom Host aus)
- `Authorization: Basic <fake>` gegen `/jmap/`
- `stalwart-cli reload-config` als Heilung für blocked-ip
- `stalwart-cli --console …` (Rust-Panic in v0.15.x)
- Manuelle Edits in
  `/opt/supabase/docker/volumes/functions/*/index.ts`

## Audit

`scripts/audit.mjs` für jedes Projekt mit Mail-Markern:

1. **Klassifikation:**
   - Mail-Marker im Code (siehe A) → **betroffen**
   - Sonst → SKIP („kein Mail-Code")
2. **Pre-Flight-Pflicht (Regel 20):** Wenn Brevo-Send-Code
   (`api.brevo.com/v3/smtp/email`) gefunden wird, muss in derselben
   Datei oder einem importierten Modul **auch** der String
   `ensureBrevoDomainAuthenticated` (oder ein Marker `[regel20]`)
   vorkommen.
   - Vorhanden → PASS
   - Fehlt → **FAIL** mit Hinweis auf Vorfall 3
3. **JMAP-Template-Anti-Pattern (Regel 19):** Suche nach
   `uploadUrl.split("{")` bzw. `uploadUrl.split('{')`.
   - Gefunden → **FAIL** („Regel 19 verletzt — Sent-Blackhole-Risiko")
   - Nicht gefunden → PASS
4. **Health-Check-Anti-Pattern (Regel 4):** Suche nach
   `Basic.*healthcheck` in Edge-Function- oder Health-Endpoint-
   Code.
   - Gefunden → **FAIL** („Regel 4 verletzt — Self-Ban-Loop-Risiko")
   - Nicht gefunden → PASS
5. **Public-Hostname-Anti-Pattern (Regel 15):** Edge-Function-
   Verzeichnisse (`supabase/functions/**` oder `functions/**`)
   dürfen `mail.maxone.one`, `mail.maxone.studio` o.ä.
   nicht im Send-/JMAP-Pfad benutzen — interner Hostname
   `stalwart-mail:8080` ist Pflicht.
   - `mail.<domain>` in Edge-Funktion gefunden → **WARN**
   - Sonst → PASS
6. **JMAP-Wellknown-Anti-Pattern (Regel 14):**
   `/.well-known/jmap` im Edge-Code → **WARN** (Redirect-Hop ist
   im Edge-Runtime brüchig).
7. **DB-Status-Schema:** Wenn `sent_emails`-ähnliche Tabelle
   gefunden wird (Schema-File / Migration), muss
   `rejected_unauthenticated_domain` als möglicher Status
   vorkommen.
   - Gefunden → PASS
   - Schema vorhanden, Status fehlt → **WARN**

Audit-ID: `030-mail-architecture`. Reason-Strings benennen die
verletzte Regel-Nummer (z.B. „Regel 19 verletzt").

## Cross-Reference

- **Bibel-Original:** [`maxone.one/briefings/ZENTINEL-STALWART-BIBEL.md`](https://github.com/maxone-one/maxone.one/blob/main/briefings/ZENTINEL-STALWART-BIBEL.md)
  (23 Regeln, 5 Vorfälle, lebendiges Dokument — bei jedem Update
  dort auch hier nachziehen)
- **Standard 039:** `039-mailbox-password-sync.md` — Passwort-Desync-Muster
  (Stalwart ↔ maxone email_accounts ↔ SnappyMail); Audit-Check für
  Atelier-Endpunkte ohne Sync-Warnung
- **Globale CLAUDE.md:** Sektion „Zentinel/Stalwart/Mail: Bibel ist
  Pflicht (OBERSTE PRIORITAET, 2026-04-27)" — Brevo-First-Reflex
- **VULN-CATALOG:** neuer Eintrag B7 (Mail-Architektur-Drift)
- **003 Secrets-Store:** Brevo-API-Key liegt in
  `/opt/secrets/global/keys.env` (`BREVO_API_KEY`); Brevo-SMTP-Keys
  pro Projekt in `/opt/secrets/<projekt>/keys.env`.

## Externe Quellen

- Brevo HTTP-API Doku — developers.brevo.com (`/v3/smtp/email`,
  `/v3/senders/domains`, `/v3/smtp/statistics/events`)
- Stalwart JMAP Server Doku — stalw.art (`/jmap/session`,
  `/jmap/upload/{accountId}/`)
- IETF RFC 8620 (JMAP Core), RFC 8621 (JMAP for Mail) — Pflicht-
  Lektüre vor JMAP-Client-Code
