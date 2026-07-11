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
| n8n (Automatisierung) | selfhosted auf maxone-prod | No-Code-/Workflow-Automatisierung + Webhook-Orchestrierung, projektübergreifender Hub. Kein gehostetes SaaS (Zapier/Make). |

Alle drei sind API-first und von KI bedienbar. Neue Fähigkeiten werden als neue Job-Typen, Sources oder Worker eingebaut, nicht als Einzelskripte in Projekten.

---

## No-Code-Automatisierung: selfhosted n8n, nie Zapier/Make

Alle No-Code-/Workflow-Automatisierung und Webhook-Orchestrierung läuft über **selfhosted n8n** (auf maxone-prod), nie über Zapier, Make oder ein anderes gehostetes SaaS. Grund: Datenhoheit, selfhosted-Linie, keine laufenden Fremdkosten, "Code für KI, von KI". Analog zur Tool-Wahl-Logik Mollie-nie-Stripe und Claude-CLI-nie-Anthropic-API.

- n8n ist der **projektübergreifende Automatisierungs-Hub**: jedes Projekt (snapflow, venfree, alle maxone-Properties) hängt seine Webhooks dort ein, statt je Projekt einen eigenen SaaS-Connector.
- Eigene Dienste bleiben **toolagnostisch**: sie sprechen Standard-HTTP/JSON und senden signierte Webhooks (HMAC). n8n konsumiert sie nativ, der Dienst weiß nichts von n8n, kein Vendor-Lock-in.
- Optionaler Ein-Klick-Komfort je Dienst: eine eigene n8n-Community-Node oder ein fertiges Workflow-Template (analog zu einem WordPress-Plugin), nie eine harte Kopplung.

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

## Fremder Kunde = Referenz, Eigengebrauch = Tenant-Flag

**Ein zentraler Dienst wird immer für den fremden Kunden gebaut, nie für den Eigengebrauch.** Der fremde Kunde ist die Referenz und das Zielbild. Der eigene Gebrauch (maxone selbst als Nutzer eines Dienstes) ist nur ein **Tenant-Flag** auf demselben Pfad, niemals ein zweiter Codepfad und niemals eine Abkürzung, die zur Architektur wird.

Konkret: braucht der Eigengebrauch eine Sonderbehandlung (z.B. „meine eigenen Leads sind sofort akzeptiert, ohne Bezahlvorgang"), wird das als Tenant-Konfiguration gelöst (`auto_approve=true`), die im normalen Kundenpfad einfach einen Schritt überspringt. Der Kundenpfad bleibt der einzige Pfad.

Begründung: sobald der Eigengebrauch einen eigenen, kürzeren Codeweg bekommt, verrottet der Kundenpfad ungetestet, und die Dogfooding-Abkürzung wird versehentlich zur Produktrealität. Wer für den Kunden baut und sich selbst als Tenant behandelt, testet den Kundenpfad bei jeder eigenen Nutzung mit.

Anwendungsfall (Lead-Liefer-Produkt, 2026-07): Kunde bestellt Leads, bekommt sie pseudonymisiert, akzeptiert pro Lead (Mollie-Abrechnung). Der Eigengebrauch (GridDone) ist ein Tenant mit `auto_approve`, dessen Karten sofort als akzeptiert gelten, ohne Abrechnungsereignis, auf demselben Auslieferungs-Codepfad. Konzept: `maxone-enricher/LEAD-CRM-ZIELBILD.md`.

---

## Verbot

- Eigener Crawler-Code in Projekten (kein `fetch` + loop + Regex statt Crawler-API)
- Eigener Enricher-Code (kein manuelles WHOIS/Scraping statt Enricher-API)
- Eigene Outreach-Skripte (kein direktes Brevo-Call statt Outreacher-API)
- No-Code-/Automatisierungs-SaaS (Zapier, Make, IFTTT o.ä.) für Workflow-/Webhook-Orchestrierung. Stattdessen selfhosted n8n auf maxone-prod.
- **Direkter Mail-Provider-Aufruf aus IRGENDEINEM Repo** (Brevo, SMTP, SendGrid, Mailgun, SES …). Aller Mailversand läuft über das Gateway `mail.maxone.one`, Provider-Keys nur dort. Spec: Standard 016-C.
- Begründung "das geht nicht" ohne vorherigen Bauversuch
