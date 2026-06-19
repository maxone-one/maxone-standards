# Standard 033: Zentrale Infrastruktur: Bauen statt melden

**Status:** aktiv  
**Erstellt:** 2026-06-01  
**Gilt für:** alle maxone.one-Projekte

---

## Prinzip

Wenn ein Tool, MCP-Server, Crawler, Enricher oder Outreacher eine Funktion nicht kann: bauen, nicht melden. "Das geht leider nicht" ist keine Antwort.

Jede neue Funktion entsteht im zentralen Dienst und profitiert allen Projekten sofort. Dezentrale Einzellösungen sind verboten.

---

## Zentrale Dienste

| Dienst | URL | Zweck |
|--------|-----|-------|
| Crawler | https://crawler.maxone.one | Lead-Discovery, Stellensuche, Inbox-Checks, Web-Scraping |
| Enricher | https://enricher.maxone.one | Website-Email-Enrichment, Datenanreicherung |
| Outreacher | https://outreach.maxone.one | E-Mail-Sequenzen, Outbound (Sende-Engine, sendet über das Gateway) |
| Mail-Gateway | https://mail.maxone.one | EINZIGER Engpass für allen ausgehenden Mailverkehr (tx + outreach), fail-closed + Consent + append-only Audit. Einziger Halter der Provider-Keys. Spec: Standard 016-C. |

Alle drei sind API-first und von KI bedienbar. Neue Fähigkeiten werden als neue Job-Typen, Sources oder Worker eingebaut, nicht als Einzelskripte in Projekten.

---

## Build-not-Flag-Regel

Wenn eine Aufgabe nicht erledigt werden kann weil etwas fehlt:

1. Welcher zentrale Dienst ist der richtige Ort dafür?
2. Welcher Job-Type / Worker / Source fehlt?
3. Bauen, deployen, danach die ursprüngliche Aufgabe ausführen.

**Priorität:** Erweiterung vor Neubau. Bestehenden Worker anpassen bevor ein neuer entsteht. Neubau nur wenn Scope grundlegend anders ist (anderes Datenmodell, andere Queue, andere Auth).

---

## Cross-Project-Profit

Jede Erweiterung wird dokumentiert und sofort auf bestehende Projekte angewendet wenn sie profitieren können. Broadcast via Standard 021-C (Cross-Project).

Beispiele bereits umgesetzter Erweiterungen:
- `jobsearch` Job-Type im Crawler: findet offene Stellen, prüft ob noch offen, speichert in `job_listings`-Tabelle
- `inboxcheck` Job-Type (geplant): prüft Plattform-Postfächer (freelancermap, malt, gulp)

---

## Verbot

- Eigener Crawler-Code in Projekten (kein `fetch` + loop + Regex statt Crawler-API)
- Eigener Enricher-Code (kein manuelles WHOIS/Scraping statt Enricher-API)
- Eigene Outreach-Skripte (kein direktes Brevo-Call statt Outreacher-API)
- **Direkter Mail-Provider-Aufruf aus IRGENDEINEM Repo** (Brevo, SMTP, SendGrid, Mailgun, SES …). Aller Mailversand läuft über das Gateway `mail.maxone.one`, Provider-Keys nur dort. Spec: Standard 016-C.
- Begründung "das geht nicht" ohne vorherigen Bauversuch
