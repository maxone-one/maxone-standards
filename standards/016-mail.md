# 016: Mail (Architektur · Passwort-Sync)

**Status:** active
**Seit:** 2026-04-28 (Architektur), 2026-05-16 (Passwort-Sync)
**Gilt für:** alle Projekte mit Mail-Code (Edge-Functions, Backend-Routes, KI-Mail-Clients)

## Inhalt

- [A] Mail-Architektur: Outbound=Brevo, Inbound+Sent=Stalwart
- [B] Mailbox-Passwort-Sync: Ein Passwort, alle Stores

---

## A: Mail-Architektur

**Acht unverhandelbare Regeln** (destilliert aus 20 Bibel-Regeln + 5 Vorfällen):

1. **Outbound = Brevo** über `https://api.brevo.com/v3/smtp/email`. Niemals Stalwart-SMTP, niemals nodemailer direkt zu einem anderen MTA.
2. **Stalwart-Logs zeigen niemals ausgehende App-Mails**, wer dort nach Outbound sucht, sucht falsch.
3. **Inbound + Sent-Folder = Stalwart** über JMAP (`http://stalwart-mail:8080/jmap/session`, intern). Nie die Public-URL aus Edge-Functions.
4. **Brevo-Domain-Pre-Flight Pflicht** vor jedem Send: ohne `authenticated:true && verified:true` in `GET /v3/senders/domains` wird der Send lokal abgewiesen (Status `rejected_unauthenticated_domain`).
5. **Health-Checks gegen Stalwart NIE mit Fake-Auth-Headern**, Stalwart bannt nach 2 fehlgeschlagenen Auth-Versuchen. `fetch('http://stalwart-mail:8080/jmap/session')` ohne Authorization ist korrekt.
6. **JMAP-Endpoints direkt:** `/jmap/session`, nie `/.well-known/jmap` (307-Redirect, Deno-Fetch folgt ihm nicht zuverlässig).
7. **JMAP-Template-Segmente erhalten:** `uploadUrl` enthält `{accountId}`, per `.replace("{accountId}", this._accountId)` ersetzen, **niemals** per `.split("{")[0]` strippen.
8. **Bei "Mail nicht angekommen?": IMMER zuerst Brevo Events API** (`GET /v3/smtp/statistics/events?email=…`), nicht Stalwart-Logs.

**Pre-Flight-Pattern (Regel 4, Pflicht-Snippet):**

```ts
const _domainAuthCache = new Map<string, { ok: boolean; ts: number }>();

async function ensureBrevoDomainAuthenticated(fromEmail: string, brevoKey: string) {
  const domain = fromEmail.split('@')[1];
  const cached = _domainAuthCache.get(domain);
  if (cached && Date.now() - cached.ts < 24*60*60*1000) {
    if (!cached.ok) throw new Error(`[regel20] ${domain} not authenticated`);
    return;
  }
  const r = await fetch('https://api.brevo.com/v3/senders/domains',
    { headers: { 'api-key': brevoKey } });
  const j = await r.json();
  const d = (j.domains || []).find((x: any) => x.domain_name === domain);
  const ok = !!(d?.authenticated && d?.verified);
  _domainAuthCache.set(domain, { ok, ts: Date.now() });
  if (!ok) throw new Error(`[regel20] ${domain} not authenticated — refusing send`);
}
```

**JMAP-Template Fix (Regel 7):**
```ts
// FALSCH — 2026-04-10 Bug (Sent-Ordner 5 Tage leer)
const upParsed = new URL(session.uploadUrl.split('{')[0], this.baseUrl);

// RICHTIG
const upParsed = new URL(session.uploadUrl);
this.uploadUrl = `${this.baseUrl}${upParsed.pathname}`;
// uploadBlob() ersetzt zur Send-Zeit:
const url = (this.uploadUrl || `${this.baseUrl}/jmap/upload/{accountId}/`)
  .replace('{accountId}', this._accountId);
```

**Verbotene Befehle auf Prod:** `docker run --rm stalwartlabs/stalwart …`, `curl -u 'user:pass' http://stalwart-mail:8080/...`, `Authorization: Basic <fake>` gegen `/jmap/`, manuelle Edits in `/opt/supabase/docker/volumes/functions/*/index.ts`.

**Vollständige Bibel:** `maxone.one/briefings/ZENTINEL-STALWART-BIBEL.md` (23 Regeln, 5 Vorfälle).

---

## B: Mailbox-Passwort-Sync

Wer ein Mailbox-Passwort in Stalwart ändert, MUSS in derselben Operation alle abhängigen Stores aktualisieren:

| Store | Ort | Methode |
|---|---|---|
| Stalwart RocksDB | `/opt/stalwart/data/` | `PATCH /api/principal/<account>`, Pflicht-Start |
| maxone `email_accounts` | Supabase `maxone.email_accounts` | Konto entfernen + neu anlegen |
| SnappyMail-Session | Browser-Cookie | Logout + Re-Login durch Nutzer |

**Vollständige Sync-Reihenfolge:**
1. `PATCH /api/principal/<account>` gegen Stalwart
2. Zentinel: Konto entfernen → neu hinzufügen mit neuem Passwort
3. SnappyMail-Session invalidieren
4. Prüfen: `zentinel-health` → `failedCount: 0`

**Übergangs-Warnung** (bis automatischer Sync implementiert): Jeder Stalwart-PATCH-Endpunkt MUSS in der Response warnen:
```ts
return json({
  ok: true,
  warning: 'Passwort in Stalwart gesetzt. Bitte im Zentinel das Konto neu verbinden.'
});
```

**Ban-Zyklus stoppen wenn er läuft:**
```bash
docker restart stalwart-mail   # löscht in-memory Ban (~3 Min Zeitfenster)
# SOFORT danach: Sync-Reihenfolge durchführen — sonst startet Zyklus neu
```

**Warum:** 2026-05-16 `hey@viktoria-from.de`, Passwort über Atelier-Endpunkt geändert, nur Stalwart aktualisiert. `email-client`-MDN-Checker (IP `10.0.2.3`) authentifizierte sich alle 3 Min mit altem Passwort → 45+ Ban-Events zwischen 15:41 und 21:34 UTC. Stalwart-Neustart löscht nur den in-memory-Ban, ohne Store-Sync startet Zyklus 2 Min später neu.

---

## Audit

`scripts/audit.mjs` für Projekte mit Mail-Markern (`api.brevo.com`, `/jmap/session`, `stalwart-mail:8080`):

**Architektur (A):**
1. Brevo-Send-Code + `ensureBrevoDomainAuthenticated`-String fehlt → **FAIL** (Regel 4)
2. `uploadUrl.split("{")` im Code → **FAIL** (Regel 7, Sent-Blackhole-Risiko)
3. `Basic.*healthcheck` in Health-Endpoint-Code → **FAIL** (Regel 5, Self-Ban-Loop)
4. `mail.maxone.one` in Edge-Functions → **WARN** (interner Hostname Pflicht)
5. `/.well-known/jmap` in Edge-Code → **WARN** (Redirect-Hop brüchig)

**Passwort-Sync (B):**
1. `PATCH`-Call gegen `/api/principal/` ohne `warning`-Feld und ohne `[039]`-Kommentar → **FAIL**
2. `secrets =` in `config.toml` → **WARN** (RocksDB hat Vorrang)
