# 022: SSoT & Version-Marker (Version-Marker · Cron-Dedup · Kein Hardcode)

**Status:** active
**Seit:** 2026-05-17
**Gilt für:** alle deploybare Web-Apps und alle Projekte

## Inhalt

- [A] Version-Marker (ENV + /api/version + Footer-Banner)
- [B] Cron-E-Mail-Dedup-Schutz
- [C] SSoT & kein Hardcode für geteilte Werte

---

## A: Version-Marker

Jedes deploybare Web-Projekt weist seinen Build an drei Stellen aus:

1. **`BUILD_ID` als ENV im Container**, Short-SHA (7-8 Zeichen). Lesbar per `docker inspect ... | grep BUILD_ID=`.
2. **`/api/version` Endpoint**, `{ "build_id": "abc1234", "deployed_at": "..." }`
3. **Sichtbarer Banner im Footer**, `v: abc1234`, klein, klickbar auf GitHub-Commit

Alle drei MÜSSEN denselben Wert tragen. Drift = manueller Server-Build = Audit-FAIL.

**Build-Pipeline:**
```yaml
- name: Build image
  run: docker build --build-arg BUILD_ID="${GITHUB_SHA::8}" -t <projekt>-app:latest .
```

```dockerfile
ARG BUILD_ID=dev
ENV BUILD_ID=${BUILD_ID}
```

**Per-Framework:**
- Next.js: `app/api/version/route.ts` mit `export const dynamic = "force-dynamic"`
- SvelteKit: `src/routes/api/version/+server.ts` mit `import { BUILD_ID } from "$env/static/private"`
- Vite/React SPA: `/version.json` bei Build erzeugen (kein API-Endpoint möglich)

**Warum:** Drift-Check braucht maschinenlesbare Wahrheit auf Prod. Vorfall 2026-05-06: Traefik routete beide Slots gleichzeitig, ohne sichtbaren Banner war "welche Version siehst du?" beim Bug-Report nicht beantwortbar.

---

## B: Cron-E-Mail-Dedup-Schutz

Jeder Cron-Job der E-Mails versendet MUSS sicherstellen: Zähler wird **ausschließlich nach erfolgreichem Dedup-Write** inkrementiert.

**Pflicht-Muster:**
```typescript
const sendRes = await sendEmail(recipient, subject, template);
if (!sendRes.success) { totals.failed_send++; continue; }

const { error: insertErr } = await admin
  .from("email_sequences")
  .insert({ email: recipient, sequence_type: kind });

if (insertErr) {
  totals.failed_log++;
  continue;          // PFLICHT: kein Zähler ohne gesicherten Marker
}

totals.sent++;       // erst hier
```

**Anti-Muster (verboten):**
```typescript
if (insertErr) { logFailure(...); }
// kein continue → nächster Run sendet erneut
totals.sent++;
```

Gilt analog für Boolean-Flags (`reminder_sent_7d`, `reminder_sent_14d`).

**Logging-Konvention:** `[CronName] INSERT_LOG_FAILED { step, user_id, pg_code }`, damit VECTOR bei Drift Alarm schlagen kann.

**Warum:** 2026-05-17 in 9 Stellen in voltfair.de gefunden. Fehler-Kette: Mail versendet → DB-Insert schlägt fehl → Zähler trotzdem erhöht → kein Marker in DB → nächster Cron-Lauf sendet erneut. Stiller Fehler, kein Alert, Zähler positiv.

---

## C: SSoT & kein Hardcode

Kein Wert der in mehr als einer Datei verwendet wird, darf hardcoded im Komponentencode stehen.

| Kategorie | Kanonischer Ort |
|---|---|
| Social-Media-Links | `maxone-standards/config/social.ts` → sync → `lib/social.ts` |
| Marken-URLs | `lib/constants.ts` pro Projekt / ENV wo sinnvoll |
| Rechtliche Texte / Impressum | Zentrale API (→ Standard 007) |
| Secrets & API-Keys | `/opt/secrets/` Store (→ Standard 002) |
| Build-IDs | ENV-Injection zur Build-Zeit (→ A oben) |
| Farbpaletten / Tokens | `tailwind.config` / CSS-Custom-Properties |

**Cross-Repo-Werte:** kanonische Datei in `maxone-standards/config/<name>.ts`, Sync-Script verteilt, Projekte haben `lib/<name>.ts` (generiert, nicht manuell editiert).

**Verboten:**
```ts
// Hardcoded Social-Link im Footer
<a href="https://github.com/irgendwas">GitHub</a>
// Hardcoded Farbe inline
<div style={{ color: '#16a34a' }}>
```

---

## Audit

**Version-Marker:**
1. Build-Pipeline setzt `BUILD_ID` als build-arg → WARN wenn fehlt
2. Dockerfile: `ARG BUILD_ID` + `ENV BUILD_ID` → WARN wenn fehlt
3. `/api/version` liefert 200 + JSON mit `build_id` → FAIL wenn 404
4. Footer enthält `v:\s*[a-f0-9]{7,8}` → WARN wenn fehlt
5. Drift zwischen ENV / Endpoint / Banner → FAIL

**Cron-Dedup:** alle `app/api/cron/**/route.ts` mit `sendEmail`:
- Dedup-Error-Block ohne `continue` vor Counter-Increment → **FAIL**

**SSoT:** Social-Links, bekannte tote Handles, hardcoded Jahre ohne `new Date().getFullYear()`, Inline-Secrets → FAIL/WARN.
