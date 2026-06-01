# 019: Kosten-Caps und Budget-Alerts auf jedem kostenpflichtigen Drittdienst

**Status:** active
**Seit:** 2026-05-02 (User-Direktive nach 715,08-EUR-Vorfall mit Google Places API)
**Gilt für:** alle Projekte, jeder kostenpflichtige Drittdienst (API, Cloud, SaaS)

## Regel

Jeder kostenpflichtige Drittdienst, dessen Kosten an Nutzungsmenge gekoppelt sind, MUSS **drei Verteidigungslinien** haben, bevor er produktiv eingesetzt wird:

1. **Server-seitiges Hard-Cap beim Anbieter** (Quota / Daily-Limit / Budget-Cap im Provider-Konsole). Wert so gewählt, dass er sicher unter dem Free-Tier-Kontingent oder dem maximal akzeptablen Monatsbudget liegt, mit mindestens 10 % Sicherheits-Puffer.
2. **Code-seitiges Soft-Cap** im Aufrufer (Counter pro Run, Hard-Stop wenn Schwelle erreicht, Log-Eintrag). Zweite Linie für den Fall dass der Provider-Cap zu spät greift oder pro-Tag/pro-Minute statt pro-Run begrenzt.
3. **Idempotenz / Wiederholungs-Guard im Code**: jeder Job-Lauf darf NIEMALS dieselbe Arbeit doppelt machen. Konkret: persistierter Marker (Timestamp, Status, ETag) auf JEDEN Versuch, nicht nur bei Erfolg. Sonst werden "kein Treffer"-Fälle bei jedem Lauf neu bezahlt.

Zusätzlich: **Provider-seitiger Billing-Alert bei 50 % / 80 % / 100 %** des Monatsbudgets. Alert geht NICHT an die Schaltzentrale-Gruppe, sondern als **Privat-DM an Max** (über VECTOR oder direkten Provider-Mail-Alert auf Max-Inbox).

API-Keys MÜSSEN restriktiv konfiguriert sein:
- IP-Restriktion auf den/die Server, die den Key tatsächlich nutzen
- API-Restriktion auf nur die tatsächlich genutzten Endpoints
- Keine API-Key-Embeddings im Frontend / Browser-Bundle

## Warum

**Vorfall 2026-05-02 (715,08 EUR):** Der SLF-Crawler (`stadt-lahn-flow/crawler/src/enrich-reviews.ts`) ruft Google Places API täglich für ~3000 Leads auf. Filter `getLeadsForReviewEnrichment()` filterte nur Leads OHNE bereits importierte Reviews raus, Leads die KEIN Google-Profil haben (Text Search → 0 Treffer) wurden täglich neu probiert, weil kein "schon versucht"-Marker existierte. Folge: ~3000 × 2 Calls/Tag × 30 Tage × Pro-Pricing = 715,08 EUR im April 2026.

**Was alle drei Verteidigungslinien gerettet hätten:**
1. Server-Cap (z.B. 150 Calls/Tag) hätte bei 4500/Monat hart gestoppt, Schaden auf ~25 EUR begrenzt.
2. Code-Cap (4500/Monat im Run) hätte bei Überschreitung sofort exited.
3. `places_last_attempted_at`-Marker hätte das Re-Probieren von Anfang an verhindert, der eigentliche Bug.

Es waren am 2026-05-02 vor dem Fix: 0 von 3 vorhanden.

**Begründung "warum drei Linien":** Provider-Caps können verzögert greifen (Quota-Update braucht Minuten, manche Provider haben pro-Minute-Limits aber kein Tages-Limit). Code-Caps können durch Bugs umgangen werden. Wiederholungs-Guards können wegrefactort werden. Drei Linien sind redundant by design, wenn eine fällt, fangen die anderen es auf.

**Begründung "Privat-DM, nicht Gruppe":** Schaltzentrale-Gruppe ist für operative Routine-Meldungen (Deploys, Crawl-Ergebnisse, Health). Kosten-Alerts sind privat-finanziell, Max will das nicht in einer Gruppe sehen, in der ggf. Mitgründer / Kunden / Mitarbeiter mitlesen.

## Wie anwenden

### Vor dem ersten Aufruf eines kostenpflichtigen Dienstes

**Pflicht-Checkliste in der PR-Beschreibung des Features das den Dienst nutzt:**
- [ ] Provider-seitiges Tages-/Monatslimit gesetzt (Screenshot oder Link in PR)
- [ ] Code-seitiger Run-Cap implementiert (`MONTHLY_BUDGET` / `DAILY_BUDGET`-Konstante mit Hard-Stop)
- [ ] Wiederholungs-Marker im Datenmodell (Timestamp-Spalte oder Status-Enum), gesetzt auf JEDEN Versuch
- [ ] Provider-Billing-Alert bei 50/80/100 % aktiv, Empfänger ist private Max-Adresse oder VECTOR-Privat-DM
- [ ] API-Key IP-restricted und API-restricted (Screenshot der Key-Config)
- [ ] `/opt/secrets/<projekt>/keys.env` Eintrag mit Kommentar `# COST-CAPPED via 034 — see standard`

### Bei laufendem Dienst (Audit alle 90 Tage)

```bash
# Pro Projekt: alle externen API-Calls auflisten
grep -rE "fetch.*https?://[a-z]+\.(googleapis|openai|anthropic|stripe|brevo|mollie|aws)\." src/ crawler/

# Für jeden Treffer prüfen:
# 1. Ist ein Cap im Provider gesetzt? (Doku im /opt/secrets/<projekt>/COST-CAPS.md)
# 2. Hat der Code einen Counter / Budget-Stop?
# 3. Gibt es einen "schon versucht"-Marker für den Aufruf-Pfad?
```

### VECTOR-Alert-Pfad (Privat-DM an Max)

Wenn ein Quota-Hit oder Budget-Alarm auftritt:
- Provider-Alert kommt als Mail rein (Brevo / GCP / Stripe / etc.)
- VECTOR-Inbound-Hook leitet weiter als Telegram-DM **an `@karastoni` direkt**, NICHT an `@maxone-schaltzentrale`-Gruppe
- Telegram-Chat-ID für Max-DM liegt in `/opt/secrets/vector/keys.env` als `TELEGRAM_CHAT_ID_MAX_DM`
- Format: `[KOSTEN-ALERT] <Projekt>/<Service>: <Schwelle erreicht> — <aktueller Stand> / <Limit>`

## Audit

`scripts/audit.mjs` prüft pro Projekt:

1. **Code-Pattern:** Suche nach `fetch(.*googleapis|openai|anthropic|stripe|brevo)`, jeder Treffer braucht in derselben Datei eine `MONTHLY_BUDGET`/`DAILY_BUDGET`-Konstante oder einen dokumentierten Audit-Skip.
2. **Marker-Spalte:** Wenn `enrich-` oder `crawler-` im Pfad → in DB-Migration MUSS eine `*_last_attempted_at` oder `*_status`-Spalte vorhanden sein.
3. **`COST-CAPS.md`:** Pro Projekt eine Datei `/opt/<projekt>/COST-CAPS.md` mit Liste aller kostenpflichtigen APIs + Provider-Cap + Code-Cap + Alert-Empfänger.
4. **API-Key-Restriktion:** Stichproben-Check über GCP/AWS/Stripe-API: sind Keys IP-restricted?

## Beziehung zu anderen Standards

- **002-secrets-store:** API-Keys gehören in den Store. Cost-Caps sind eine Eigenschaft des Keys.
- **026-self-hosted-first:** Reduziert die Anzahl kostenpflichtiger Dienste, was self-hosted ist, kann nicht durchdrehen wegen Pay-per-Call.
- **VULN-CATALOG:** Eintrag im Block "Kosten-/Quota-Lecks" mit Verweis auf diesen Standard.
