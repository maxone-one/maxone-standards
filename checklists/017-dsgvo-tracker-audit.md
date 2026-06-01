# Checkliste: 017: DSGVO-Tracker-Audit

Pflicht vor jedem Live-Gang (zusammen mit Standard 013 Section D).

---

## A. Fonts

- [ ] Google Fonts NICHT via CDN eingebunden (`fonts.googleapis.com`
      / `fonts.gstatic.com` im HTML grep → 0 Treffer)
- [ ] Stattdessen: lokale Fonts (`@fontsource/*` oder selbst hostet
      `.woff2`) ODER `fonts.bunny.net` (DSGVO-konform)
- [ ] Falls Google Fonts unvermeidbar: erst nach Consent geladen +
      Hinweis in Datenschutzerklärung

## B. Analytics

- [ ] Bevorzugt: Plausible / Umami / Matomo (DSGVO-friendly,
      EU-self-host, cookielos)
- [ ] Falls Google Analytics: Consent-Mode v2, Anonymize-IP, lädt erst
      nach Consent
- [ ] GTM: nur als Container für consent-konformes Laden,
      keine Default-Tags ohne Consent-Bedingung
- [ ] Bei eigenen Brands: `analytics.maxone.one` (Umami) ist Default

## C. Marketing-Pixel

- [ ] Facebook Pixel: nur wenn unbedingt nötig, dann nur nach Consent
- [ ] LinkedIn Insight Tag, TikTok Pixel, etc.: gleiche Regel
- [ ] Empfehlung: serverseitiges Conversion-Tracking statt clientseitiger
      Pixel (UTM-Parameter + Backend)

## D. Externe Embeds

- [ ] YouTube: `youtube-nocookie.com` ODER Two-Click-Lösung ODER kein
      Embed
- [ ] Vimeo: ähnlich
- [ ] Google Maps: ersetzen durch OpenStreetMap (Leaflet/MapLibre) ODER
      Two-Click ODER nur Link auf externes Maps
- [ ] Twitter/X-Embeds: per Default-`<blockquote>` ohne Script,
      Script erst nach Consent
- [ ] Instagram-Embeds: ähnlich

## E. Inventar & Dokumentation

- [ ] **Cookie-Inventar** (DevTools → Application → Cookies):
      | Name | Zweck | Lebensdauer | First/Third-Party |
      |------|-------|-------------|-------------------|
- [ ] **Externe Hosts beim Initial-Load** (DevTools → Network → Domains
      → Spalte „Domain"):
      Liste aller fremden Domains. Erwartung: nur eigene + Webfont-Quelle
      + Vector-Chat
- [ ] **Webbkoll-Scan** durchgeführt:
      `https://webbkoll.dataskydd.net/de/check?url=https://<domain>`
      → Score und Findings dokumentiert in `LAUNCH-REVIEW.md` Section D
- [ ] **Datenschutzerklärung** listet jeden Drittdienst namentlich
      (DSGVO Art. 13/14)
- [ ] **AVV / DPA** mit jedem Drittanbieter abgeschlossen
      (Hetzner ✅ Standard, Brevo ✅ im Account, Supabase ✅ Pro-Plan,
      Stripe ✅ Standard)

## F. Consent-Banner

- [ ] Banner zeigt VOR jedem nicht-essentiellen Tracker (Network-Tab
      vor und nach Klick vergleichen)
- [ ] Klare Ablehn-Option auf erster Ebene (kein „Settings > Optionen >
      Reject all", DSGVO-konform = ein Klick)
- [ ] Auswahl wird respektiert (Tracker bleiben aus, wenn abgewählt)
- [ ] Auswahl ist widerrufbar (irgendwo auf der Site, z.B. Footer-Link
      „Cookie-Einstellungen")

## G. Server-Region und AVV

- [ ] Hosting-Region: EU (Hetzner ✅ DE/FI)
- [ ] Datenbank-Region: EU
- [ ] CDN: EU-Edges bevorzugt
- [ ] Mail-Versand: Brevo (EU) statt Mailchimp/SendGrid
- [ ] Falls US-Cloud-Komponente: SCC + DSFA dokumentiert (Schrems-II)

---

## Pen-Test-Workflow (manuell, ~15 min pro Domain)

1. Browser im Inkognito-Modus öffnen, DevTools auf
2. Network-Tab leeren (Trash-Icon)
3. Live-Domain laden, OHNE Consent-Banner zu klicken
4. Im Network-Tab Spalte „Domain" sortieren
5. Jede fremde Domain (nicht eigene + nicht maxone.one) flaggen
6. Falls fremde Trackerei vor Consent: → **Verstoss**
7. Consent-Banner: akzeptieren
8. Network-Tab erneut leeren, Page reload
9. Welche Tracker werden jetzt zusätzlich geladen? → in
   Datenschutzerklärung dokumentiert?
10. Cookies prüfen (Application → Storage → Cookies):
    jeder First-Party / Third-Party Cookie im Cookie-Inventar?
