# Checkliste: 013: Launch-Gate Review

Pflicht vor jedem `dev` → `live` Übergang. Jeder Punkt wird im Projekt-eigenen
`LAUNCH-REVIEW.md` abgehakt, nicht hier. Diese Datei ist die Master-Liste.

Wenn ein Punkt nicht zutrifft (z.B. kein Tracking, kein User-Login):
**explizit mit `n/a — Begründung`** beantworten, nicht überspringen.

---

## A. Code-Verständnis & Verantwortung

- [ ] Verantwortliche Person namentlich benannt (Sign-Off-Block ausgefüllt)
- [ ] Black-Box-Anteil geschätzt: welche Files / wie viel % wurden NICHT
      Zeile für Zeile gelesen?
- [ ] Falls > 20 % KI-generiert und ungelesen: zusätzlicher Review-Pass mit
      `security-review` Skill ODER manueller Code-Review durch zweite Person
- [ ] `package-lock.json` oder `pnpm-lock.yaml` committed (kein Floating)
- [ ] `npm audit --production` läuft ohne **Critical** oder **High**
      (Moderate dokumentieren, nicht ignorieren)
- [ ] Keine bekannten Lücken in Hauptframework (Next.js, SvelteKit, Vite, …)

## B. Auth & Authorization

- [ ] Auth-Flow manuell durchgespielt: Registrierung, Login, Logout, Reset
- [ ] **Privilege-Escalation getestet:** unautorisierter User kann nicht
      auf fremde Resourcen / Admin-Routes zugreifen
      (`curl` mit User-A-Token gegen User-B-Resource = 403, nicht 200)
- [ ] Kostenpflichtige Features wirklich gegen Bezahlstatus geprüft
      (nicht nur clientseitig versteckt)
- [ ] Session-Timeout sinnvoll, Logout invalidiert Token
- [ ] Passwort-Reset-Flow: Token-Lebensdauer < 1h, single-use

## C. Datenbank-Sicherheit (Supabase / Postgres)

- [ ] Auf JEDER Tabelle: Row Level Security aktiviert (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Auf JEDER Tabelle: mindestens eine Policy definiert (Default-deny ohne Policy)
- [ ] **Anon-Key getestet:** kann nur lesen/schreiben was er soll
      (Test-Skript: `curl https://<projekt>.supabase.co/rest/v1/<tabelle>`
      mit Anon-Key → erwartete Antwort)
- [ ] Service-Role-Key NUR server-seitig (kein `NEXT_PUBLIC_*`, kein
      `VITE_*`, kein Frontend-Bundle)
- [ ] DB-Backups laufen (Supabase Pro automatisch, sonst manueller Cron)
- [ ] Test/Prod sind **getrennte Supabase-Projekte** mit unterschiedlichen
      URLs und Keys (KEIN gemeinsamer Schema-Branch)

## D. Datenschutz / DSGVO

- [ ] **Datenschutzerklärung** existiert und listet jeden Drittdienst namentlich
      (Hetzner, Supabase, Brevo, Stripe, Sentry, Google Fonts, …)
- [ ] **Impressum** korrekt (über Standard 009, zentrale API)
- [ ] **Cookie-Inventar:** alle gesetzten Cookies dokumentiert
      (Name, Zweck, Lebensdauer, First/Third-Party)
- [ ] **Tracker-Inventar:** alle externen Hosts beim Initial-Load
      (Browser DevTools → Network → Domains; idealerweise: nur eigene)
- [ ] **Consent-Banner** für alle nicht-essentiellen Tracker
      (Analytics, Marketing-Pixel, Maps mit Personenbezug, eingebettete YouTube/Vimeo)
- [ ] Tracker werden ERST nach Consent geladen (nicht "im Banner abgewählt
      aber Skript läuft trotzdem")
- [ ] **AVV / DPA** abgeschlossen mit jedem Auftragsverarbeiter
      (Hetzner ✅ standardmäßig, Brevo ✅ im Account, Supabase ✅ Plus-Plan)
- [ ] **Standard 009:** alle Auftragsverarbeiter in
      `registry/projects.yml -> data_processors` dokumentiert
      (`service`, `purpose`, `personal_data`, `region`, `avv_status`,
      `evidence`, `reviewed_at`)
- [ ] Google Fonts: lokal eingebunden ODER Consent ODER nicht verwendet
      (LG München I, Az. 3 O 17493/20)
- [ ] Externe Embeds (YouTube, Vimeo, Maps): Two-Click-Lösung oder Consent
- [ ] Server-Region: EU (Hetzner ✅, Supabase EU-Region prüfen)
- [ ] Kontakt-Formular: kein Daten-Sharing ohne Hinweis, Spam-Schutz
      ohne reCAPTCHA (oder mit Consent)

## E. Test/Prod-Trennung

- [ ] Prod-DB-Credentials NICHT in `.env.local` von Devs
- [ ] Lokale Entwicklung gegen lokales/Test-Supabase, nicht gegen Prod
- [ ] CI hat eigene Test-DB (oder rein lokale Tests ohne DB)
- [ ] Keine Agent/Tool-Verbindung von Dev-Maschine direkt auf Prod-DB
      (Replit-Vorfall: Agent löschte Prod ohne Trennung)
- [ ] Prod-Datenbank-Mutationen nur über reviewten Migrations-Pfad
      (Supabase Migrations / Prisma / Drizzle), nicht ad-hoc per `psql`

## F. Frontend-Secrets / Public Bundle

- [ ] Bundle nach Build durchsucht (`grep -r "sk_" dist/` o.ä.), keine
      privaten Keys (Stripe, Supabase Service-Role, OpenAI, …)
- [ ] Nur `NEXT_PUBLIC_*` / `VITE_*` / `PUBLIC_*` Keys im Frontend, und
      diese sind explizit sicher für Public (Anon-Key, Stripe-PK)
- [ ] Keine `console.log` mit Tokens / User-Daten in Production-Build
- [ ] Source-Maps in Production: deaktiviert ODER private serviert

## G. Externe Integrationen

- [ ] Liste aller externen APIs (Brevo, Stripe, OpenAI, …) im Review-File
- [ ] Webhooks haben Signatur-Prüfung (Stripe: `Stripe-Signature` Header
      verifiziert mit Webhook-Secret)
- [ ] Rate-Limits bei eigenen API-Routes (sonst Bot-Abuse)
- [ ] CORS bewusst konfiguriert (nicht `*` für authentifizierte Endpoints)

## H. Infrastruktur

- [ ] Standard 002 erfüllt (kein Build auf Prod)
- [ ] Standard 003 erfüllt (Secrets im Store)
- [ ] Standard 004 erfüllt (TLS DNS-01)
- [ ] Standard 005 erfüllt (Smoke + Unit Tests vorhanden)
- [ ] Standard 001 erfüllt für Live-Projekte (Blue/Green)
- [ ] Health-Check in `docker-compose.yml`
- [ ] Logs gehen irgendwohin (mindestens `docker logs`, idealerweise
      zentral aggregiert)

## I. Operations / Recovery

- [ ] Was passiert bei DB-Verlust? Backup-Restore-Pfad ist getestet
      (mindestens einmal: Backup ziehen, in Test-DB einspielen, prüfen)
- [ ] Was passiert bei Container-Crash? Restart-Policy `unless-stopped`
- [ ] HANDOFF.md auf dem Server vorhanden (Standard 006)
- [ ] Monitoring / Alerting: jemand erfährt es, wenn die Site down ist
      (Vector-Health-Check für maxone-Projekte)

## J. Vibe-Coding-Lückenklassen (NEU 2026-04-27)

Hintergrund: Studienlage 2025/26 (Veracode, Georgetown CSET, Tenzai,
Escape.tech, Georgia Tech Vibe Security Radar) zeigt, dass AI-generierter
Code reproduzierbar dieselben Klassen einbaut. Diese Sektion fängt sie ab.

- [ ] **XSS:** kein `dangerouslySetInnerHTML` (React) / `{@html …}` (Svelte) /
      `v-html` (Vue) ohne DOMPurify oder gleichwertigen Sanitizer.
      Suchbefehl:
      `grep -rEn "dangerouslySetInnerHTML|@html |v-html=" src/`
      → jeder Treffer in `LAUNCH-REVIEW.md` Section J namentlich begründet.

- [ ] **Log-Injection:** kein `console.log` / `logger.info` mit roher
      User-Input-Konkatenation. Strukturiertes Logging (Pino, Winston) statt
      Template-Strings. Suchbefehl:
      `grep -rEn 'console\.(log|info|error).*\$\{.*req\.' src/`
      → 0 Treffer in Auth-/User-Pfaden.

- [ ] **SSRF:** jeder `fetch(url)` / `axios.get(url)` / `http.request(url)`
      mit URL aus User-Input hat (1) Allowlist erlaubter Hosts UND (2)
      Block für RFC1918 (10/8, 172.16/12, 192.168/16), 127.0.0.1,
      169.254.169.254 (AWS-Metadata), 100.64/10 (Carrier-NAT).
      Manuelle Review der Treffer von:
      `grep -rEn 'fetch\(.*req\.|axios\..*req\.' src/`
      Hintergrund: Tenzai 2026, alle 5 getesteten AI-Coding-Tools
      bauen dieselbe SSRF-Lücke ein, 100 %.

- [ ] **Backend-Secrets:** Standard 022 (`gitleaks`) hat 0 Findings im
      aktuellen Code. Findings nur in der Git-Historie sind dokumentiert
      und betroffene Keys rotiert. Ergänzt Section F (Frontend-Bundle-Scan),
      ersetzt sie nicht.

- [ ] **Static Analysis:** Standard 023 (`semgrep --config=p/owasp-top-ten
      --severity=ERROR`) hat 0 ERROR-Findings. WARNING-/INFO-Findings hier
      namentlich aufführen mit Begründung.

- [ ] **Unauth-Routes:** Vollständige Liste aller API-Routen erstellt
      (`find . -path '*/api/*' -name '*.ts'` o.ä.), jede mit Auth-Status
      markiert (`auth-required` / `public-by-design`). Public-Routen
      (Health, Webhooks, öffentliche APIs) namentlich begründet.
      Pen-Test: `curl` ohne Token gegen jede `auth-required` Route →
      401/403 erwartet, nicht 200.

- [ ] **BOLA / horizontale Privilege-Escalation:** Pen-Test (siehe
      Section B): User-A-Token gegen User-B-Resource, gegen User-B-Order,
      gegen User-B-Datei → jeweils 403. Hintergrund: Enrichlead 2025,
      genau dieser Fall.

- [ ] **Plattform-Lock-in:** Falls Code ursprünglich auf Lovable / Bolt /
      Base44 / v0 / Replit-Agent gebaut wurde: vollständige Migration auf
      eigene Infra durchgeführt UND kompletter Code-Re-Read durch zweite
      Person (Mensch oder VAULT-Persona-Session). Ursprung in
      `LAUNCH-REVIEW.md` Section J dokumentiert.
      Hintergrund: Escape.tech 2026, von 5.600 produktiv deployten
      Lovable/Bolt/Base44-Apps haben 2.000 hochkritische Lücken, 400
      exponierte Secrets, 175 PII-Leaks live.

---

## Sign-Off-Block (kopieren ins LAUNCH-REVIEW.md)

```markdown
## Sign-Off — YYYY-MM-DD

- **Verantwortlich:** Vor- Nachname (@github-user)
- **Geprüft am:** YYYY-MM-DD
- **Sektionen abgehakt:** A B C D E F G H I J (alle 10)
- **Black-Box-Anteil KI-generiert:** X %
  - Tools verwendet: ...
  - Reviewed durch: ... (Skill, zweite Person, ...)
- **Bekannte Restrisiken:** ...
- **Nächstes Re-Review fällig:** YYYY-MM-DD (max. +12 Monate)
- **Signatur:** [optional PGP-signed]
```
