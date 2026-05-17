# 043 — Cron-E-Mail-Dedup-Schutz

**Status:** active
**Seit:** 2026-05-17
**Gilt für:** alle Cron-Route-Handler (`app/api/cron/**/route.ts`), die
programmatisch E-Mails versenden und den Versand über einen Dedup-Marker
absichern (Boolean-Flag auf einer Lead-Zeile, Insert in `email_sequences`,
Insert in `retention_emails_sent` o.ä.).

## Regel

Jeder Cron-Job, der folgende Sequenz enthält:

1. **E-Mail versenden** (`sendEmail(…)`)
2. **Dedup-Marker schreiben** (Insert / Update / Upsert in der DB)
3. **Erfolgs-Zähler inkrementieren** (`totals.sent++`, `results.X++`)

**MUSS** sicherstellen, dass der Zähler **ausschließlich nach erfolgreichem
Dedup-Write** inkrementiert wird. Schlägt der DB-Write fehl, muss der
aktuelle Loop-Schritt per `continue` übersprungen werden — bevor der Zähler
erhöht wird.

### Pflicht-Muster

```typescript
const sendRes = await sendEmail(recipient, subject, template);
if (!sendRes.success) {
  totals.failed_send++;
  logFailure("SEND_MAIL", { ... }, new Error(sendRes.error ?? "unknown"));
  continue;
}

const { error: insertErr } = await admin
  .from("email_sequences")
  .insert({ email: recipient, sequence_type: kind, reference_id: id });

if (insertErr) {
  totals.failed_log++;
  logFailure("INSERT_LOG", { ... }, insertErr);
  continue;          // ← PFLICHT: kein Zähler ohne gesicherten Marker
}

totals.sent++;       // ← erst hier, nach bestätigtem DB-Write
```

### Anti-Muster (VERBOTEN)

```typescript
// ✗ Fehler: counter++ außerhalb des Success-Zweigs
if (insertErr) {
  logFailure("INSERT_LOG", { ... }, insertErr);
  // kein continue — naechster Run sieht keinen Marker und sendet erneut
}
totals.sent++;
```

Das gilt analog für Boolean-Flags auf Lead-Zeilen
(`reminder_sent_7d`, `reminder_sent_14d`, `reminder_sent_30d`):

```typescript
const mark = await admin.from("leads").update({ reminder_sent_7d: true }).eq("id", id);
if (mark.error) {
  logCronFailure("MARK_REMINDER_7D", { lead_id: id }, mark.error);
  continue;          // ← PFLICHT
}
results.reminders7d++;
```

## Warum

Wurde beim autonomen Bug-Scan vom 2026-05-17 in **9 Stellen** in voltfair.de
gefunden (Commits `b324bf3`, `1e9c065`, `ff6668b`, `5cfcf18`).

**Fehler-Kette:**

1. E-Mail erfolgreich versendet.
2. DB-Insert des Dedup-Markers schlägt fehl (kurzzeitiger DB-Fehler,
   Constraint-Violation, Netzwerk-Timeout).
3. Counter wird trotzdem inkrementiert — Job-Response sieht „1 sent".
4. Beim nächsten Cron-Lauf: kein Marker in der DB → Bedingung erfüllt →
   dieselbe E-Mail wird erneut versendet.
5. Empfänger bekommt Duplikat. Bei stündlichen Crons: potenziell Dutzende
   Duplikate bis zur manuellen Entdeckung.

Der Fehler ist **still** — kein Error im Job-Log, kein Alert, Zähler zeigt
positiven Wert. Einzig VECTOR kann bei anhaltender Log-Drift
(`INSERT_LOG_FAILED` ohne zurückgehende Dedup-Zähler) Alarm schlagen.

## Wie anwenden

### A. Neue Cron-Jobs

Vorlage immer in dieser Reihenfolge:

```
1. Empfänger bestimmen + Seed-Guard (isSeedEmail)
2. sendEmail(…) aufrufen
3. if (!sendRes.success) { log; continue; }
4. Dedup-Marker in DB schreiben
5. if (dbErr) { log; continue; }          ← PFLICHT
6. totals.sent++ / results.X++
```

### B. Bestehende Cron-Jobs (in-diff only)

Nicht als Repo-weiten Sweep ausführen. Nur korrigieren, wenn die betroffene
Datei im aktuellen Diff-Bereich liegt.

### C. Logging-Konvention

Der `logFailure`-Aufruf beim Dedup-Write-Fehler **muss** einen eindeutigen
VERB enthalten, sodass VECTOR bei Drift Alarm schlagen kann:

```
[CronName] INSERT_LOG_FAILED { step, user_id, pg_code, pg_message }
[LeadReminders] MARK_REMINDER_7D_FAILED { lead_id, pg_code, pg_message }
```

## Audit

`scripts/audit.mjs` prüft alle Dateien unter `app/api/cron/**/route.ts`:

1. **Klassifikation:** Datei enthält `sendEmail` → betroffen, sonst SKIP.
2. **Dedup-Write-Erkennung:** Suche nach DB-Writes, die als Dedup-Marker
   dienen: `email_sequences`, `retention_emails_sent`, `reminder_sent_`,
   `mark\d+\.error`, `insertErr`, `insert_err`.
3. **Continue-Guard-Check:** Jeder erkannte Dedup-Error-Block
   (`if (.*[Ee]rr.*) {`) muss `continue` enthalten, bevor der Counter
   inkrementiert wird.
   - `continue` vorhanden → PASS
   - Block ohne `continue` vor Counter-Increment → **FAIL**

Audit-ID: `043-cron-email-dedup`.

## Cross-Reference

- **Vorfalls-Commits:** `b324bf3`, `1e9c065`, `ff6668b`, `5cfcf18`
  (voltfair.de, Bug-Scan 2026-05-17, 9 Fixes)
- **030-mail-architecture:** Outbound-Architektur (Brevo), Pre-Flight-Check
- **Standard 022 (secret-scan):** Keine Credentials in Log-Payloads
- **CLAUDE.md voltfair:** Seed-E-Mail-Guard `isSeedEmail()` ist Pflicht
  vor jedem automatischen Send
