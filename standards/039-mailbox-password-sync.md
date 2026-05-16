# 039 — Mailbox-Passwort-Sync: Ein Passwort, alle Stores

**Status:** active
**Seit:** 2026-05-16
**Gilt für:** alle Projekte, die Stalwart-Mailboxen verwalten UND gleichzeitig
einen JMAP-Client (maxone `email-client` Edge Function) für dieselben
Postfächer betreiben. Projekte ohne JMAP-Client: nicht betroffen.

## Regel

Wer ein Mailbox-Passwort in Stalwart ändert (via Admin-API, CLI oder Atelier-
Endpunkt), **MUSS** in derselben Operation alle abhängigen Passwort-Stores
aktualisieren oder invalidieren:

| Store | Ort | Methode |
|-------|-----|---------|
| Stalwart RocksDB | `/opt/stalwart/data/` | `PATCH /api/principal/<account>` — Pflicht-Start |
| maxone `email_accounts` | Supabase-Tabelle `maxone.email_accounts` | Konto entfernen + neu anlegen (oder `update-account`) |
| SnappyMail-Session | Browser-Cookie / Server-Session | Logout + Re-Login durch den Nutzer |

Ein Endpunkt, der nur Stalwart aktualisiert ohne die abhängigen Stores zu
synchronisieren, ist unvollständig und muss mit einer expliziten
Nutzer-Warnung versehen werden (bis der Sync-Mechanismus implementiert ist).

## Warum

### Vorfall — 2026-05-16 Mailbox-Ban-Zyklus + SnappyMail-Ausfall (hey@viktoria-from.de)

- **Auslöser:** Das Passwort für `hey@viktoria-from.de` wurde über den
  Atelier-Endpunkt `/api/atelier/mailbox-password` geändert. Dieser Endpunkt
  macht `PATCH /api/principal/hey@viktoria-from.de` gegen Stalwarts Admin-API
  und gibt `{ ok: true }` zurück — er hat keine Kenntnis der maxone-Supabase-
  Tabelle `email_accounts`, in der dasselbe Passwort AES-GCM-verschlüsselt
  gespeichert ist.
- **Kaskade:** Der `email-client`-MDN-Checker (Container `supabase-edge-functions`,
  IP `10.0.2.3`) läuft alle ~3 Minuten und authentifiziert sich für jedes
  registrierte Postfach via JMAP gegen `stalwart-mail:8080`. Mit dem
  veralteten Passwort aus der Supabase-DB schlägt die JMAP-Session fehl →
  Stalwart löst `security.authentication-ban` aus → Ban-IP `10.0.2.3` →
  Ban-Ablauf → nächster MDN-Zyklus → erneuter Ban. Unendliche Wiederholung.
- **Endzustand:** 45+ Ban-Events zwischen 15:41 und 21:34 UTC, alle 3–4 Minuten.
  Stalwart meldet `JMAP session failed: 429` vom MDN-Checker.
- **SnappyMail-Ausfall:** SnappyMail (`snappymail-viktoria`, IP `10.0.1.8`)
  verbindet sich via IMAP (Port 993). Der Nutzer-Login scheiterte mit
  `AUTHENTICATIONFAILED Authentication failed` — nicht wegen des IP-Bans auf
  Port 8080, sondern weil SnappyMail noch das alte Passwort gespeichert hatte.
  Das neue Passwort war nur Stalwart bekannt.
- **Zeitfenster:** Letzte erfolgreiche JMAP-Auth: 13:41 UTC. Erste Ban:
  15:41 UTC. Passwortänderung ca. 14:00–15:30 UTC.
- **Design-Gap:** `mailbox-password.ts` hat keine Verknüpfung zur maxone-
  Supabase `email_accounts`. Beide Systeme sind unabhängige Passwort-Stores
  ohne Sync-Mechanismus. Ein Stalwart-Neustart löscht den Ban kurz, aber der
  nächste MDN-Zyklus (~2 Minuten später) bannt sofort wieder.

**Lesson:** Ein partielles Passwort-Update ist schlimmer als kein Update — das
System fährt in einen kontinuierlichen Selbst-Ban-Zyklus, der alle Mail-Dienste
für das betroffene Postfach blockiert, bis manuell synchronisiert wird.

## Wie anwenden

### A. Pflicht-Warnung in Atelier-Endpunkten (Übergangs-Zustand)

Bis ein automatischer Sync implementiert ist, muss jeder Endpunkt der ein
Stalwart-Passwort ändert, explizit warnen:

```ts
// mailbox-password.ts — nach erfolgreichem Stalwart-PATCH
return json({
  ok: true,
  warning: 'Passwort in Stalwart gesetzt. Bitte im maxone-Mailkonto das Konto ' +
           'entfernen und neu hinzufügen (Zentinel → Einstellungen → Konto neu ' +
           'verbinden). Ohne diesen Schritt läuft der Mail-Sync in einen Ban-Zyklus.'
});
```

### B. Vollständige Sync-Reihenfolge

Bei jeder autorisierten Passwortänderung:

1. `PATCH /api/principal/<account>` gegen Stalwart Admin-API
2. In maxone Zentinel: Konto unter Einstellungen → Konten entfernen, dann
   neu hinzufügen mit dem neuen Passwort
3. SnappyMail-Session des Nutzers invalidieren (Logout + Re-Login)
4. Prüfen: `zentinel-health` → `failedCount: 0` für das betroffene Konto

### C. Ban-Zyklus erkennen und stoppen

Wenn der Zyklus bereits läuft:

```bash
# Symptom bestätigen
tail -200 /opt/stalwart/data/logs/stalwart.log.$(date +%Y-%m-%d) | grep 'ban'
# Wiederkehrende Zeilen für dasselbe accountName alle 3–4 Min = Desync

# Stalwart neu starten (löscht in-memory Ban, gibt ~3 Min Zeitfenster)
docker restart stalwart-mail

# Sofort Schritt B ausführen — ohne Sync startet der Zyklus in ~3 Min neu
```

### D. Ziel-Zustand: automatischer Sync

`mailbox-password.ts` sollte nach dem Stalwart-PATCH direkt den
`email_accounts`-Eintrag in der maxone-Supabase re-verschlüsseln. Das
erfordert den AES-GCM-Key (identisch mit dem in der Edge Function) und einen
direkten Supabase-Call oder einen Webhook. Bis dahin bleibt Schritt A Pflicht.

## Audit

`scripts/audit.mjs` für Projekte mit Stalwart-Admin-API-Zugriff:

1. **Klassifikation:** Marker `STALWART_ADMIN_URL` oder
   `/api/principal/` im Code → **betroffen**. Sonst SKIP.
2. **Passwort-Endpunkt ohne Sync-Warnung:**
   Suche nach `PATCH`-Calls gegen `/api/principal/` in Endpunkt-Code
   (`pages/api/atelier/mailbox*`, `routes/api/**`).
   - Vorhanden: muss in derselben Datei entweder ein `warning`-Feld in der
     Response oder ein Kommentar `[039]` enthalten.
   - Fehlt → **FAIL** mit Hinweis auf Vorfall 2026-05-16.
3. **config.toml-Passwort-Pattern (Bibel Regel 7):**
   Suche nach `secrets =` in Stalwart-`config.toml`.
   - Gefunden → **WARN** (RocksDB hat Vorrang, Config-Änderung wirkungslos).

Audit-ID: `039-mailbox-password-sync`.

## Cross-Reference

- **Bibel Regel 23 + Vorfall 5:**
  `maxone.one/briefings/ZENTINEL-STALWART-BIBEL.md`
- **Standard 030:** Destillat der allgemeinen Stalwart/JMAP-Regeln; dieser
  Standard ergänzt spezifisch den Passwort-Desync-Fall
- **Standard 003:** Stalwart-Admin-Credentials aus
  `/opt/secrets/<projekt>/keys.env`, nie hardcoded
- **Betroffene Projekte Stand 2026-05-16:** maxone.one (`email-client`
  Edge Function, `email_accounts`-Tabelle), viktoria-from
  (`mailbox-password.ts` Atelier-Endpunkt)
