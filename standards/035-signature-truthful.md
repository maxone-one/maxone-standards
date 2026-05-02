# 035 — Wahrhaftige Unterschrift

**Status:** active
**Seit:** 2026-04-29
**Gilt für:** alle Customer-facing-Nachrichten in jedem Kanal — Mail, Telegram, SMS, Push, In-App-Messages, Webchat-Antworten, Bot-DMs, Auto-Replies, Onboarding-Flows. Kein Kanal ist ausgenommen.

## Regel

**Es unterzeichnet der, der wirklich verschickt.**

- Tippt **Max** persönlich → unterzeichnet "Max" / "Liebe Grüße Max" / "Max Karastelev"
- Verschickt **eine KI in Max' Auftrag** (Claude, Vector, Viper, etc.) → unterzeichnet die KI namentlich, **niemals** als Max
- Verschickt **ein Bot/Daemon automatisch** → unterzeichnet der Bot, **niemals** als Person

Eine KI darf nie unter Max' Namen schreiben. Eine automatische Mail darf nie so klingen, als hätte ein Mensch sie getippt. Selbst wenn der Inhalt 1:1 das ist, was Max sagen würde — die Unterschrift muss die Wahrheit über den Absender sagen.

## Warum

**Vertrauen ist nicht skalierbar, wenn der Empfänger nicht weiß, mit wem er redet.**

Wenn Viktoria eine Nachricht "von Max" bekommt, die in Wirklichkeit Claude geschrieben hat, sind drei Vertrauens-Ebenen kaputt:
1. **Sie denkt, Max hat persönlich Zeit gefunden** — falsche Erwartung an die nächste Nachricht ("warum antwortet er jetzt nicht so schnell?")
2. **Sie hat keine Chance einzuordnen, wie verbindlich die Aussage ist** — eine KI-Antwort ist eine KI-Antwort, kein Versprechen vom Anbieter
3. **Wenn sie es später rausfindet, wirkt alles davor manipuliert** — auch das, was wirklich von Max kam

Das ist keine Höflichkeits-Frage, das ist ein Marken-Wert von maxone: **wir lügen nie, wir schaffen immer Transparenz.** Eine falsche Unterschrift ist eine Lüge, auch wenn der Inhalt stimmt.

Auch rechtlich relevant: Eine KI-Mail mit Max-Unterschrift kann als persönliche Zusage interpretiert werden ("das hat er mir doch geschrieben") — der Empfänger leitet daraus Rechte ab, die niemand erteilt hat.

## Konkrete Unterschrift-Vorlagen

**Max persönlich:**
```
Liebe Grüße
Max
```

**KI im Auftrag (Claude über Vector-Bot, automatischer Customer-Support, etc.):**
```
Liebe Grüße
Vector — KI-Assistent von maxone
(im Auftrag von Max Karastelev, automatisch versendet)
```

oder kürzer in Telegram/SMS:
```
— Vector (Max' KI), automatisch versendet
```

**Reiner Bot / Daemon (Watchdog-Alert, Cron-Status, Health-Notification):**
```
— maxone-watchdog (automatisch)
```

## Was diese Regel verhindert

- "Liebe Grüße Max" unter einer Nachricht, die ein Skript versendet hat
- "Hi, hier ist Max" als Bot-Greeting
- "Beste Grüße, dein Max" in einer Auto-Reply
- Persönliche Anrede + Bot-Inhalt ohne Disclaimer
- Mail-Templates, die "Max Karastelev" ans Ende setzen, obwohl die Pipeline rein automatisch läuft

## Was diese Regel **nicht** verbietet

- Max kann selbstverständlich KI-vorgeschlagene Texte 1:1 übernehmen und persönlich versenden — dann unterzeichnet er als "Max", weil **er** die Verschickung freigegeben hat. Der Mensch im Loop ist die Wahrheit.
- KI-Assistenten dürfen Max namentlich erwähnen ("Max bittet mich, dir zu antworten…") — nur nicht als Unterschrift auftreten.
- Internes Team-Branding: "maxone" als Marke ist okay, weil "maxone" ein Unternehmen/Marke ist, keine Person.

## Implementierungs-Hinweise

**Bei Telegram-Bots, die Claude/Vector im Auftrag steuert:**
- Hardcoded Footer-Block am Ende **jeder** outbound Message
- Kein Bypass per Prompt — der Code hängt es an, nicht das LLM
- Bei Kopien an Max: Footer auch im Kopie-Header sichtbar, damit Max sieht, was rausging

**Bei Mail (Edge Function `email-client`):**
- KI-versandte Mails bekommen einen separaten Sieg-Footer-Block **vor** dem Sponsor-Footer (siehe Standard 012)
- Pipeline: User-Signatur → KI-Disclaimer (wenn KI-Versand) → Sponsor-Footer → Send

**Bei Auto-Replies / Onboarding-Sequenzen:**
- Versender-Identität ist niemals "Max" — entweder der Marken-Account ("maxone Team") oder der Bot-Name

## Retroaktive Korrektur

Wenn eine Nachricht bereits mit falscher Unterschrift rausging und der Empfänger noch erreichbar ist:
1. Korrektur-Nachricht senden mit klarem Disclaimer ("Korrektur zu meiner letzten Nachricht: die wurde von einer KI verschickt, nicht von mir persönlich. Inhalt stimmt — Unterschrift war falsch.")
2. Vorfall in Memory + Briefing dokumentieren, damit es nicht wieder passiert
3. Grundursache fixen (Template, Prompt, Pipeline) bevor weitere Nachrichten rausgehen

## Verstoß-Beispiele aus der Realität

**2026-04-29 — Viktoria From Onboarding-Telegram:**
- Claude (über Telegram-Bot) sendet Zugangsdaten an Viktoria, signiert mit "Liebe Grüße Max"
- Max bemerkt es bei Review der CC-Kopie und stoppt: "Liebe Grüße Max ist eine Lüge"
- Konsequenz: dieser Standard 033, retroaktive Korrektur an Viktoria, Bot-Code-Patch

## Referenzen

- Memory: `feedback_signatur_wahrhaftig.md`
- CLAUDE.md: Block "Wahrhaftige Unterschrift"
- Standard 012 (Footer): Marken-Footer ist ergänzend, nicht ersetzend
- Standard 030 (Mail-Architektur): Sponsor-Footer ist ergänzend, nicht ersetzend
