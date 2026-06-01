# Checkliste: 018: Bundle-Drift-Audit

Pflicht vor jedem Live-Gang und nach jeder Migration die Hostnamen ändert.

---

## A. Build-Hygiene

- [ ] Build-Cache vor Production-Build geleert (`.vite/`, `.next/cache/`,
      `.svelte-kit/`, `node_modules/.cache/`)
- [ ] Production-Build mit explizit gesetztem Mode (`NODE_ENV=production`,
      `vite build`, `next build`, nicht `dev`)
- [ ] Source-Maps in der Bundle-Konfig deaktiviert oder auf `hidden`
      (Vite: `build.sourcemap: false`, Next.js:
      `productionBrowserSourceMaps: false`)
- [ ] Falls Sentry/Datadog: Source-Maps via CI hochladen, dann lokale
      `.map`-Dateien aus Asset-Output löschen vor Container-Image-Build

## B. Migrationen: alte Hostnamen raus

- [ ] Alle `*.maxone.studio`-URLs aus Source migriert (außer
      `mail.maxone.studio`, `autoconfig.maxone.studio`)
- [ ] `panel.maxone.studio` → `panel.maxone.one`
- [ ] `agent.maxone.studio` → `agent.maxone.one`
- [ ] `analytics.maxone.studio` → `analytics.maxone.one`
- [ ] Build neu erzeugt nach jeder URL-Änderung (`grep -r "maxone.studio"
      dist/` muss leer sein, außer Mail-Hosts)

## C. Plattform-Wasserzeichen

- [ ] Bundle enthält keine Strings: `lovable`, `bolt.new`, `base44`,
      `built with v0`, `replit-agent`
- [ ] Falls historische Lock-in-Erbe: in `LAUNCH-REVIEW.md` Section J
      Punkt 8 dokumentiert + Migrationsplan
- [ ] Migration auf Whitelist-Stack abgeschlossen (Standard 016)

## D. Dev-Hosts und Loopback

- [ ] Keine `localhost:*` URLs im Bundle
- [ ] Keine `127.0.0.1`, `0.0.0.0`, `host.docker.internal`
- [ ] Keine `*.local`, `*.test` oder `*.dev` Hosts
- [ ] Konfiguration nutzt Build-Time-ENV (`VITE_API_URL`, `NEXT_PUBLIC_*`)
      mit Production-Default

## E. Secrets im Bundle

- [ ] Kein Service-Role-Key (`"role":"service_role"` in JWT-Payload)
- [ ] Kein Stripe Secret-Key (`sk_live_*`)
- [ ] Kein Anthropic API-Key (`sk-ant-*`), wir nutzen sowieso CLI
- [ ] Keine Brevo SMTP-Credentials
- [ ] Nur `anon`-Key bzw. `NEXT_PUBLIC_`/`VITE_PUBLIC_`-Prefix Variablen
      im Bundle (Standard 022 verstärkt das)

## F. Source-Map-Disclosure

- [ ] Keine `//# sourceMappingURL=...` Direktive im Bundle
- [ ] Falls doch nötig: `.map`-Datei via CDN-Restriktion oder
      Sentry-only-Upload schützen
- [ ] Test: `curl -sI https://<domain>/<asset>.js.map` → 404 oder 403

## G. CDN- und Browser-Cache

- [ ] Cache-Busting im Asset-Filename (Hash-Suffix:
      `app.abc123.js` statt `app.js`)
- [ ] Cache-Header gesetzt: `Cache-Control: public, max-age=31536000,
      immutable` für gehashte Assets
- [ ] Nach Migration: Edge-Cache geleert (Cloudflare Purge / CDN-Console)
- [ ] HTML selbst hat kurzen Cache (`max-age=0` oder `no-cache`) damit
      neue Asset-Hashes ankommen

---

## Manueller Check-Workflow (~5 min pro Domain)

1. Browser im Inkognito öffnen, DevTools → Network leeren
2. Live-Domain laden, Hard-Reload (Ctrl+Shift+R)
3. Network-Tab → Filter „JS" → größtes Asset öffnen → Source ansehen
4. Strg+F suchen nach: `maxone.studio`, `localhost`, `lovable`,
   `sourceMappingURL`
5. Application → Storage → Cookies + LocalStorage prüfen
6. Bei jedem Treffer: Repo-Stand vs Live vergleichen
   (`git log -- src/` letzter Commit, dann `curl https://<domain>/<asset>`)
7. Bei Drift: re-build → re-deploy → Cache purge → Audit nochmal
