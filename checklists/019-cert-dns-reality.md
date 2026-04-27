# Checkliste: 019 — Cert + DNS-Realität

Pflicht vor jedem Live-Gang und nach jeder Domain-Migration.

---

## A. DNS

- [ ] A-Record (oder AAAA) zeigt auf eine bekannte Server-IP:
      - `128.140.40.235` (maxone-prod, Hetzner DE)
      - `46.225.107.118` (voltfair-cli, Hetzner DE)
      - `46.225.168.235` (voltfair-db, Hetzner DE)
      - `46.225.88.53`   (vybora-prod, Hetzner DE)
- [ ] Falls **Cloudflare-Proxy aktiv**: DNS-Eintrag bewusst gewählt
      (Performance vs. DSGVO — Cloudflare ist US-Cloud, AVV
      DSGVO-konform aber Lock-in)
- [ ] Falls **fremder Hoster** (Vercel, Netlify, Lovable, etc.):
      LAUNCH-REVIEW.md Section J Punkt 8 begründet warum kein
      Hetzner-Hosting

## B. TLS-Zertifikat

- [ ] Aussteller: **Let's Encrypt** (Standard 004 verlangt DNS-01)
- [ ] Restlaufzeit > 30 Tage zum Zeitpunkt des Audits
- [ ] Subject `CN` oder SAN deckt die Domain ab (kein
      Mismatched-Cert)
- [ ] Bei Wildcard-Cert (`*.maxone.one`): Wildcard-Pfad in
      `/opt/traefik/dynamic/` dokumentiert
- [ ] Auto-Renewal aktiv: Traefik-`acme.json` enthält die Domain,
      letzter Renewal < 80 Tage her

## C. Migrationen — DNS-Hygiene

- [ ] Vor DNS-Umstellung: TTL des A-Records auf 300s reduzieren
      (24h vorher), nach Stabilisierung wieder auf 3600s
- [ ] Alte IP entfernen sobald neue stabil läuft (kein Round-Robin
      auf zwei IPs ohne Grund)
- [ ] DNS-Push und Audit am gleichen Tag (sonst vergisst man die
      Validierung)

## D. CAA-Records (optional)

- [ ] CAA-Record erlaubt `letsencrypt.org` als Aussteller
- [ ] CAA-Record verbietet andere CAs (defensiver Schutz vor
      Mis-Issuance)

## E. Recovery-Plan

- [ ] DNS-Login (INWX) im Passwort-Tresor
- [ ] Falls TLS-Renewal kaputt: manueller Befehl dokumentiert
      (`docker exec traefik traefik certificate ...` oder
      `/opt/traefik/scripts/renew.sh` — siehe HANDOFF.md auf Server)
- [ ] Telegram-Bot für VECTOR-Cert-Alarm konfiguriert (optional, aber
      empfohlen für Kunden-Sites)

---

## Manueller Check-Workflow (~3 min pro Domain)

1. `dig +short A <domain>` — IP gegen Server-Liste vergleichen
2. `echo | openssl s_client -connect <domain>:443 -servername <domain>
   2>/dev/null | openssl x509 -noout -dates -issuer -subject`
   - `notAfter` → Restlaufzeit
   - `issuer` → "Let's Encrypt"
   - `subject` → CN matches Domain
3. Browser-Test: https://<domain> öffnen, Schloss-Symbol klicken,
   Cert-Pfad ansehen
4. Bei Findings: VECTOR Telegram-Alert konfigurieren falls noch nicht
