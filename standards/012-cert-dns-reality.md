# 012, Cert- und DNS-Realität

**Status:** active
**Seit:** 2026-04-27
**Gilt für:** alle Projekte mit `status: live` und öffentlicher Domain

## Regel

Für jede live-Domain muss gelten:

- **DNS** zeigt auf eine Server-IP aus unserer Server-Liste
  (maxone-prod, voltfair-cli, voltfair-db, vybora-prod). Andere IPs
  sind dokumentationspflichtig (Lock-in-Risiko).
- **TLS-Zertifikat** ist gültig (nicht abgelaufen, Restlaufzeit > 14 Tage),
  vom erwarteten Aussteller (Let's Encrypt, Standard 002 verlangt
  DNS-01) und der `subject`/`SAN` deckt die Domain ab.

## Warum

Drift zwischen Repo, Server und DNS schleicht sich ein und wird oft erst
bei Kundenanruf bemerkt. Konkrete Vorfälle 2026-04:

- **plansey.app** hatte den DNS-A-Record auf eine Lovable-IP zeigen,
  obwohl wir den Build selbst hosten. Resultat: HTTP 404 vom Lovable-CDN
  für eine Domain, die wir „verloren" hatten ohne es zu merken.
- **vanfree** (Domain `vanfree.de` bis Phase 2) hatte TLS-Handshake-Fehler
  (`ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`), Audit 017 und 018 konnten gar
  nichts mehr sehen, weil der Server keinen TLS-Cert mehr hat.
- **karastelev.de**-Wildcard (siehe CLAUDE.md TLS-Direktive 2026-04-22)
  hatte 2026-04-22 das Account-Ratelimit gesprengt, weil HTTP-01 für
  ein nicht erreichbares Subdomain wiederholt scheiterte → Lehre:
  DNS-01-Migration und Cert-Monitoring sind zwei Seiten derselben Medaille.

Ohne diesen Standard merkt man Cert-Ablauf erst wenn Browser warnen, das
ist 7 Tage zu spät, wenn der Auto-Renewer aus irgendeinem Grund stockt.

## Wie anwenden

**1. Bei Gate 3 (Standard 008 LAUNCH-REVIEW.md):**
   - Section L (neu) listet: erwartete Server-IP + tatsächliche
     DNS-Auflösung + Cert-Aussteller + Cert-Expiry
   - Bei Wildcard-Cert (`*.maxone.one`): notieren, sonst ist die
     Sub-Domain-Liste manuell zu pflegen

**2. Wöchentlich (Cron):**
   - `node scripts/audit.mjs --standard=019` über VECTOR-Cron
   - Bei WARN/FAIL: Telegram-Alarm an Max

**3. Bei Migration einer Domain:**
   - DNS-A-Record umstellen → bis zu 24h TTL abwarten
   - Audit `--standard=019` → `--project=<name>` neu laufen lassen
   - Neuer Cert sollte automatisch von Traefik via DNS-01 geholt werden
     (Standard 002), dauert ~1-2 min nach erstem Hit

## Was das Audit NICHT findet

- **Wildcard-Cert-Validität für Sub-Sub-Domains**, wir prüfen den
  exakten Domain-String der Registry, nicht abgeleitete Hosts.
- **DNSSEC-Validierung**, DNS-Resolver vertrauen wir; wer DNS-Spoofing
  erkennen will, braucht eine separate Pipeline.
- **CAA-Record-Compliance**, nice-to-have, aber nicht im Scope.
- **Geo-Routing** (z.B. CDN-IPs unterschiedlich pro Region), Audit läuft
  von einer einzigen IP, sieht nur das was diese IP sieht.

## Audit

`scripts/audit.mjs` prüft pro Projekt mit `status: live` + Domain:

1. **DNS A-Record** via `dns.promises.resolve4(domain)` (Timeout 5s)
   - Alle aufgelösten IPs gegen `KNOWN_SERVER_IPS` prüfen (von der
     `SERVERS`-Map abgeleitet)
   - Treffer in Whitelist → DNS-OK
   - Sonst → DNS-WARN mit der konkreten IP (Lock-in oder Drift)
2. **TLS-Cert** via `tls.connect({ host, port: 443, servername: host })`
   (Timeout 5s):
   - `valid_to` parsen → Restlaufzeit in Tagen
     - `> 14` → OK
     - `7-14` → WARN ("Cert läuft bald ab")
     - `0-7` → FAIL ("Cert läuft in <7 Tagen ab")
     - `< 0` → FAIL ("Cert abgelaufen")
   - `issuer.O` enthält "Let's Encrypt" → OK, sonst WARN
     ("anderer Issuer, Standard 002 verlangt Let's Encrypt")
   - Cert deckt Domain ab (`subject.CN` oder `subjectaltname` SAN) →
     OK, sonst FAIL
3. **TLS-Handshake-Fehler** → FAIL ("TLS-Handshake fehlgeschlagen")
4. Wird mit `--local-only` übersprungen (kein Netzwerk)

PASS = DNS auf bekannte Server-IP + Cert gültig > 14d + LE + Subject-Match.
WARN = Drift in einer Dimension ohne unmittelbares Outage-Risiko.
FAIL = Cert defekt/bald-ab oder TLS-Handshake nicht möglich.
