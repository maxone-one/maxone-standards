# 054 — Brevo Transactional API für Outreach-Sends

**Status:** active  
**Gilt für:** SLF (stadtlahnflow.de) — übertragbar auf jedes Projekt mit Outreach-Versand  
**Zuletzt aktualisiert:** 2026-05-28

---

## Problem

Wir nutzen nodemailer + Brevo SMTP-Relay für alle Mails — auch für Outreach-Kampagnen.
Das führt zu:

- **Tracking-Flickenteppich:** eigener Pixel (`/api/track`), eigener Click-Redirect,
  eigene `outreach_events`-Tabelle, Brevo-Webhook als Backup — vier Systeme für eine Aufgabe.
- **Manuelle Suppression:** Bounces, Unsubscribes und Spam-Complaints werden selbst in die
  `leads`-Tabelle geschrieben. Brevo pflegt die Suppression-Liste parallel unabhängig — kein Sync.
- **Null historische Opens:** SMTP-Sends ohne explizit konfigurierten Pixel liefern 0 Öffnungen,
  weil Brevo über SMTP nur dann trackt, wenn Tracking im Account aktiviert ist und der Pixel
  injiziert wird.
- **Selbstgebautes Rate-Limiting:** `delay(500)` zwischen jedem Send, selbst verwaltet.
- **Kein message-ID-Anker:** Events kommen ohne eindeutige Mail-ID — Korrelation läuft über
  E-Mail-Adresse + Zeitfenster, was bei Re-Sends falsche Zuordnungen erzeugen kann.

---

## Lösung

**Outreach-Sends (Kalt-Akquise, Sendeplan-Batches) laufen über die Brevo Transactional API.**  
Alles andere (Buchungsbestätigungen, Mitglieder-Notifications, OTPs) bleibt auf SMTP.

```
POST https://api.brevo.com/v3/smtp/email
Authorization: api-key <BREVO_API_KEY>
```

### Was Brevo damit automatisch liefert

| Feature | Vorher (SMTP) | Nachher (API) |
|---|---|---|
| Open-Tracking | eigener Pixel nötig | Brevo injiziert automatisch |
| Click-Tracking | eigener Redirect nötig | Brevo rewritet Links |
| Bounce-Handling | manuell in leads.bounced | Brevo-Suppression + Webhook |
| Spam-Complaint | Webhook-only | Brevo-Suppression + Webhook |
| message-ID | keiner | Brevo gibt `messageId` zurück |
| Rate-Limiting | delay(500) selbst | Brevo-intern |

---

## Grenze: Was bleibt auf SMTP

| Typ | Beispiele | Warum SMTP bleibt |
|---|---|---|
| Transaktional | Buchungsbestätigung, .ics-Anhang, OTP | Kein Tracking-Bedarf, einmalig |
| Mitglieder-Notifications | Vernetzung, Direktnachrichten, Challenges | Kein Kampagnen-Kontext |
| Interne Mails | Admin-Notifications, Watchdog-Alerts | Kein Tracking-Bedarf |

---

## Implementation-Vertrag

### 1. Zentraler Brevo-Client

**`src/lib/brevo-send.ts`** — Single Source of Truth für alle API-Sends.

```typescript
export interface BrevoRecipient {
  email: string;
  name?: string;
}

export interface BrevoSendOptions {
  to: BrevoRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender?: { name: string; email: string };
  tags?: string[];                          // für Brevo-Statistik
  headers?: Record<string, string>;         // List-Unsubscribe etc.
  params?: Record<string, string>;          // Custom-Params für Brevo-Template-Engine
}

export interface BrevoSendResult {
  messageId: string;
}

export async function sendViaBrevoApi(
  opts: BrevoSendOptions,
): Promise<BrevoSendResult>
```

- Liest `BREVO_API_KEY` aus ENV
- Wirft bei HTTP-Fehler eine typisierte Exception
- Gibt `{ messageId }` zurück — der Aufrufer speichert ihn in `outreach_send_log`

### 2. HTML-Pipeline für Outreach

Die Template-Replacements (`{{VORNAME}}`, `{{PROFIL_SLUG}}` etc.) laufen weiterhin bei uns.
Das fertige HTML wird als `htmlContent` an die API übergeben.

**Was entfällt:**
- `injectOpenPixel()` — Brevo injiziert automatisch
- `createTransport().sendMail()` — ersetzt durch `sendViaBrevoApi()`

**Was bleibt:**
- `buildUnsubscribeFooter()` — unsere Abmeldelogik (`/api/unsubscribe`) bleibt
- `{{LEAD_HASH}}` / `{{BATCH_ID}}` — weiterhin für Unsubscribe-URL und `/api/track/click`

### 3. messageId speichern

`outreach_send_log` bekommt eine neue Spalte `brevo_message_id text`.  
Wenn der Brevo-Webhook mit `message-id` kommt, kann er exakt korreliert werden.

Migration:
```sql
ALTER TABLE outreach_send_log
  ADD COLUMN IF NOT EXISTS brevo_message_id text;
```

### 4. Webhook-Handler bleibt

`/api/webhooks/brevo` bleibt unverändert. Er empfängt jetzt zuverlässiger
`opened`- und `click`-Events, weil Brevo diese über die API-Sends nativ trackt.

### 5. Tags-Konvention

| Outreach-Typ | Tags |
|---|---|
| Sendeplan-Batch | `["outreach", "sendeplan"]` |
| Persönlicher Versand | `["outreach", "persoenlich"]` |
| Entschuldigungs-Mail | `["outreach", "entschuldigung"]` |
| Custom | `["outreach", "custom"]` |

---

## Migrationspfad (SLF)

Dateien in Reihenfolge:

1. `src/lib/brevo-send.ts` — neuer Client (kein Produktions-Impact)
2. `src/app/api/cron/outreach/route.ts` — Hauptpfad, größter Impact
3. `src/lib/outreach-send.ts` — `sendPlannedBatch()`
4. `src/app/api/admin/outreach/send-persoenlich/route.ts`
5. `src/app/api/admin/outreach/send/route.ts`
6. `src/app/api/admin/outreach/send-apology/route.ts`
7. `src/app/api/admin/outreach/send-custom/route.ts`
8. `injectOpenPixel()` aus `email-unsubscribe-footer.ts` entfernen (oder als Fallback lassen)

---

## ENV-Variablen

| Variable | Zweck |
|---|---|
| `BREVO_API_KEY` | Transactional API Key (bereits vorhanden) |
| `BREVO_SMTP_USER` | Nur noch für SMTP-Pfade (Notifications, Buchungen) |
| `BREVO_SMTP_PASS` | Nur noch für SMTP-Pfade |

`BREVO_API_KEY` liegt bereits in `/opt/secrets/slf/keys.env`.

---

## Audit-Checks

```bash
# Kein createTransport mehr in Outreach-Pfaden
grep -rn "createTransport" src/app/api/admin/outreach src/app/api/cron/outreach src/lib/outreach-send.ts

# Kein injectOpenPixel in Outreach-Pfaden
grep -rn "injectOpenPixel" src/app/api/admin/outreach src/app/api/cron/outreach

# Brevo-Client existiert
test -f src/lib/brevo-send.ts

# messageId-Spalte vorhanden
# → via DB-Migrationscheck
```

---

## Nicht-Ziele

- Brevo-Template-Engine nutzen — unsere Templates bleiben in der DB, Rendering bei uns
- SMTP komplett abschalten — bleibt für Transaktional/Notifications
- Kontakt-Listen in Brevo pflegen — wir bleiben Source of Truth in Supabase
