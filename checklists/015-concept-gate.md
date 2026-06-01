# Checkliste: 015: CONCEPT.md / Gate 1

Pflicht VOR der ersten Code-Zeile. Jeder Punkt wird in der Projekt-eigenen
`CONCEPT.md` (Repo-Root) abgehakt, nicht hier. Diese Datei ist die
Master-Liste.

Wenn ein Punkt nicht zutrifft (z.B. keine externen Dienste, kein Auth):
**explizit mit `n/a — Begründung`** beantworten, nicht überspringen.

---

## A. Problem & Ziel

- [ ] Problem-Beschreibung in 1-3 Sätzen, konkret (kein „digitalisieren wir XYZ")
- [ ] Erfolgs-Kriterium messbar formuliert (Nutzerzahl, gesparte Stunden,
      Conversion-Rate, etwas, das in 6 Monaten überprüfbar ist)
- [ ] Wenn Erfolgs-Kriterium fehlt: Projekt ist „rein experimentell"
      explizit so deklariert (kein Ressourcen-Pull aus Live-Projekten)

## B. Nutzer & Zugang

- [ ] Pro Rolle: anonym? eingeloggt? zahlend?, Tabelle ausgefüllt
- [ ] Geschätzte Nutzerzahl bei Launch (Grössenordnung reicht)
- [ ] Falls > 1.000 Nutzer oder Verarbeitung sensitiver Daten: DSFA-Prüfung
      vermerkt

## C. Datenmodell

- [ ] Alle Entitäten gelistet mit Beispiel-Feldern
- [ ] Sensitivität pro Entität bewertet (öffentlich / personenbezogen /
      Art. 9 DSGVO)
- [ ] Besondere Kategorien gem. Art. 9 DSGVO explizit als ja/nein markiert
- [ ] DSFA-Pflicht-Prüfung dokumentiert (Art. 35 DSGVO)

## D. Auth-Modell

- [ ] Pro Entität: wer darf lesen / schreiben / löschen
- [ ] Default-Antwort ist „Owner", Abweichungen (Admin, öffentlich) explizit
      begründet
- [ ] RLS-Strategie skizziert: Policy pro Tabelle, kein `USING (true)`
- [ ] Service-Role-Key NUR server-seitig dokumentiert
- [ ] Bezahlfeatures (falls vorhanden): server-seitige Prüfung gegen
      Bezahlstatus geplant, nicht nur clientseitige Anzeige

## E. Externe Dienste

- [ ] Vollständige Liste aller Drittdienste, die Daten verarbeiten
- [ ] Pro Dienst: Server-Region (EU bevorzugt)
- [ ] Pro Dienst: AVV/DPA-Status (für jeden Verarbeiter Pflicht, DSGVO Art. 28)
- [ ] US-Dienste explizit begründet (warum kein EU-Pendant?)
- [ ] Datenfluss skizziert (welche Daten gehen WAS für Zwecke an WEN)

## F. Threat-Model

- [ ] Mindestens 3 konkrete Schadensszenarien (kein „Hacker greifen an")
- [ ] Pro Risiko: Abwehr genannt mit Verweis auf konkreten Standard/Mechanismus
- [ ] OWASP-Top-10-Klassen abgeprüft, ob im Projekt-Kontext relevant
      (A01 Access Control, A02 Crypto, A03 Injection, A04 Design,
      A05 Misconfig, A07 Auth, A08 Integrity, A09 Logging, A10 SSRF)
- [ ] Wenn Vibe-Coding-Tool eingesetzt: bekannte AI-Code-Lückenklassen
      (siehe `standards/VULN-CATALOG.md`) im Threat-Model erwähnt

## G. Stack-Wahl

- [ ] Frontend, Backend, DB, Hosting, Reverse Proxy, AI-Coding-Tool benannt
- [ ] Pro Wahl: 1-Satz-Begründung (nicht „weil schnell")
- [ ] Standard 016 (Stack-Whitelist, geplant) konform, Lovable / Bolt /
      Base44 / v0 nur mit dokumentiertem Migrations-Pfad
- [ ] EU-Hosting bevorzugt, wenn nicht: warum
- [ ] AI-Modell-Aufrufe via Claude CLI (CLAUDE.md global), nicht via API/SDK

## H. Out of Scope

- [ ] Mindestens 3 Punkte explizit ausgeschlossen
- [ ] Pro Punkt: Begründung (verhindert späteres Scope-Creep, das wieder
      ungeprüfte Funktionen einführt)

## I. Offene Fragen

- [ ] Liste aller offenen Fragen, die VOR Gate-1-Sign-Off geklärt sein müssen
- [ ] Falls Fragen unbeantwortet bleiben: Sign-Off NICHT erteilen, Konzept
      bleibt im Status „Draft"

## J. Vibe-Coding-spezifisch (wenn KI initial-generiert)

- [ ] Konzept VOM MENSCHEN geschrieben, KI darf ko-editieren, nicht draften
- [ ] Reviewer hat Konzept unabhängig vom Autor gelesen + verstanden
      (Sign-Off bestätigt Verständnis, nicht nur Kosmetik)
- [ ] Stack-Wahl listet AI-Coding-Tool explizit (Claude Code / Cursor /
      Vybora / …)
- [ ] Plattform-Lock-in adressiert: wenn Lovable/Bolt/Base44/v0/Replit-Agent
      genutzt → Migrationspfad VOR Gate 1 geplant

---

## Sign-Off-Block (kopieren ins CONCEPT.md)

```markdown
## Gate 1 — Konzept-Sign-Off

- **Vorgeschlagen von:** Vor- Nachname (@github-user) am YYYY-MM-DD
- **Reviewed von:** Vor- Nachname (@github-user) am YYYY-MM-DD
- **Gate 1:** PASSIERT — Code-Bau freigegeben
- **Bekannte Risiken aus Threat-Model:**
  - ...
- **DSFA fällig (DSGVO Art. 35):** ja / nein / unklar — geprüft am YYYY-MM-DD
- **Standard 016 (Stack-Whitelist) konform:** ja / nein (Begründung wenn nein)
```

---

## Re-Review-Trigger

Konzept muss neu sign-off werden, wenn:
- Datenmodell sich ändert (neue Entität, neue Sensitivitäts-Klasse)
- Auth-Modell sich ändert (neue Rolle, andere Berechtigungen)
- Neuer externer Dienst dazukommt
- Stack-Komponente getauscht wird (z.B. DB-Wechsel, Framework-Migration)
- Spätestens vor Gate 3 (Standard 013, `LAUNCH-REVIEW.md`) Konzept noch aktuell?
