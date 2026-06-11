# 018: Auth & DB-Isolation (Supabase SSR Auth · DB pro Projekt)

**Status:** active
**Seit:** 2026-04-28 (Auth), 2026-05-18 (DB-Isolation), 2026-06-11 (Auth-Vollständigkeit)
**Gilt für:** alle Projekte mit Supabase-Auth und persistenter Datenhaltung

## Inhalt

- [A] Supabase SSR Auth: Middleware-Matcher umfasst alle Routes
- [B] DB-Isolation: ein Projekt, eine Datenbank
- [C] Vollwertiges Auth-System: kein Eigenbau-Flow, Reset + Verify + OAuth Pflicht
- [D] Wired-Team Access Control

---

## A: Supabase SSR Auth

In jedem Next.js-Projekt mit Supabase-Auth läuft die Auth-Middleware auf **allen** Routes außer Static-Assets. Niemals selektiven Matcher auf `/dashboard`, `/admin` etc. begrenzen.

**Pflicht-Matcher:**
```ts
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
```

> **Next.js 16:** Datei heißt `proxy.ts`, exportiert `proxy(request)` statt `middleware(request)`. Beide Dateien gleichzeitig → Build-Fehler.

**Pflicht in der Middleware:** `supabase.auth.getUser()` aufrufen, refreshte Cookies via `setAll` an Request UND Response weiterreichen, bei Redirects `set-cookie`-Header explizit kopieren.

**Vollständiges Pflicht-Setup:**
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );
  await supabase.auth.getUser();

  // Bei Redirects: Cookies mitschleppen
  function redirectWithCookies(url: URL) {
    const res = NextResponse.redirect(url);
    supabaseResponse.headers.getSetCookie().forEach(c => res.headers.append("set-cookie", c));
    return res;
  }
  return supabaseResponse;
}
```

**SvelteKit** (`src/hooks.server.ts`): `setAll`-Callback mit `try/catch`, ohne es killt der async Auth-Refresh den Node-Prozess:
```ts
setAll: (cookies) => {
  try {
    cookies.forEach(({ name, value, options }) =>
      event.cookies.set(name, value, { ...options, path: '/' }));
  } catch { /* Response bereits gesendet */ }
}
```

**Niemals:** selektiver Matcher, `auth.getUser()` ohne Middleware-Refresh davor, custom Cookie-Namen ohne geprüften Sync.

**Warum:** Middleware ist der einzige Ort wo refreshte Tokens zurück in Cookies geschrieben werden. Server Components haben read-only `cookies()`. Symptom bei selektivem Matcher: "nach Deploys muss ich mich immer wieder einloggen", nicht reproduzierbar genug für einen klaren Bug, aber zermürbend für B2B-Nutzer. SLF-Vorfall 2026-04-28.

---

## B: DB-Isolation

Jedes Projekt betreibt seine eigene, isolierte Datenbankinstanz. Keine zwei Projekte teilen sich denselben Supabase-Projekt-URL oder dieselbe PostgreSQL-Instanz.

**Verboten:**
- Selbe Supabase-URL in zwei Projekten → **FAIL**
- Direktverbindung auf Container einer anderen Instanz (`DATABASE_URL=...@supabase-db:5432`) → **FAIL**
- Getrenntes Schema in gemeinsamer PG-Instanz, Row-Level-Security allein reicht nicht → **verboten**

**Erlaubt:** API-Zugriff auf andere Projekte über deren öffentliche API. Infra-Agenten (z.B. vector) mit dokumentierter `registry/exceptions.yml`-Ausnahme für Monitoring-Zugriff (read-only, kein Schreiben auf fremde DBs).

**Isolation-Typen (ausreichend):** Supabase self-hosted eigene Instanz ✅, Supabase Cloud eigenes Projekt ✅, eigener PostgreSQL-Container ✅.

**Bekannte Verstöße (Stand 2026-05-18):**
- `repivot` teilt `panel.maxone.one` mit `maxone.one` → Migration nötig
- `plansey-2026` verbindet direkt auf `supabase-db:5432` → Migration nötig

**registry/projects.yml Pflichtfeld:**
```yaml
- name: stadtlahnflow
  supabase_url: https://api.stadtlahnflow.de
```

---

## C: Vollwertiges Auth-System (kein Eigenbau-Flow)

Authentifizierung ist niemals ein selbstgebauter Teilflow mit ein paar Form-Actions. Jedes Projekt mit Login nutzt eine etablierte Auth-Engine (Supabase Auth/GoTrue oder vergleichbar) und implementiert deren **vollen** Funktionsumfang. Ein Login-Formular, das Code-per-Mail und Passwort kann, aber Reset, Verifizierung und Social-Login weglässt, ist kein Auth-System, sondern ein Conversion-Leck.

**Vor dem ersten Auth-Code:** OSS-Ökosystem absuchen (etablierte Auth-Lösung, fertige Provider-Integration). Kein handgestrickter Session-/OTP-Flow, wenn eine vollständige Lösung existiert.

**Auth-Identitäten projektisoliert (Voraussetzung, siehe B):** Supabase GoTrue verwaltet genau ein `auth`-Schema pro Datenbank. Getrennte Daten-Schemas (`maxone`, `snapflow`, …) in derselben DB trennen die Tabellen, aber **nicht** die Identitäten, alle Projekte teilen sich dann denselben `auth.users`-Pool. Vollwertige Auth setzt deshalb eine eigene DB/Instanz pro Projekt voraus, nicht nur ein eigenes Schema. Eine Conversion- oder Nutzer-Aussage über einen geteilten `auth.users`-Topf ist nicht projektscharf und damit wertlos.

**Admin-Identität eigener Marken liegt extern (Break-Glass):** Der primäre Admin-Login einer maxone-eigenen Marke läuft über eine Adresse außerhalb der eigenen Infrastruktur (externes Gmail), niemals über eine Mailbox, die auf genau dieser Plattform liegt. Sonst sperrt ein Infra-Ausfall den Admin gleichzeitig aus dem System und aus der Reset-/OTP-Mail (zirkuläre Recovery-Abhängigkeit). Fremde Dienste umgekehrt: dort registriert sich Max mit der Marken-Adresse `max@maxone.one` (Außendarstellung, Schadensbegrenzung). Globale Regel, CLAUDE.md 2026-06-11.

**Pflicht-Funktionsumfang (vollständig, nicht verhandelbar):**
- **Login und Signup getrennt.** Account-Anlage passiert ausschließlich im bewussten, als Signup gekennzeichneten Flow, niemals als Nebeneffekt eines Logins.
- **Passwort-Reset.** "Passwort vergessen" mit `resetPasswordForEmail` und Reset-Seite. Ohne Reset-Pfad ist der Login unvollständig.
- **E-Mail-Verifizierung als Gate.** Ein Account zählt erst als aktiver Nutzer oder Lead, wenn die E-Mail bestätigt ist. Unbestätigt = keine Conversion, kein Zugang zu geschützten Funktionen.
- **OAuth/OIDC-Provider (Social Login).** "Mit Google/Apple anmelden" als First-Class-Option, mit Identity-Linking auf die bestehende E-Mail statt eines Zweitaccounts.
- **E-Mail-Normalisierung und Dedupe.** googlemail↔gmail, Gmail-Punkte und Plus-Aliase, Groß-/Kleinschreibung. Kein Duplikat-Account durch eine Schreibvariante derselben Adresse.

**OTP/Magic-Code:**
- Reiner Login bestehender Nutzer: `signInWithOtp({ email, options: { shouldCreateUser: false } })`. Der Supabase-Default `true` ist auf Login-Routes **verboten**.
- `shouldCreateUser: true` ausschließlich im expliziten Signup-Flow.

**Verboten:**
- OTP-Action ohne explizites `shouldCreateUser: false` auf einer Login-Route → **FAIL** (legt bei jedem Vertipper eine stille Karteileiche an).
- Login ohne Passwort-Reset-Pfad → **FAIL**.
- Stilles Scheitern: ein Auth-Fehler ohne sichtbare Rückmeldung an den Nutzer → **FAIL** (siehe Wiki-Konzept silent-failures).

**Warum:** Ein vertippter Mail-Eintrag im OTP-Login mit `shouldCreateUser: true` erzeugt lautlos einen Account, an den nie eine Bestätigung geht. Der Interessent wartet auf einen Code, der nie kommt, und ist verloren. Wer sich bei der Adresse nur leicht vertut, legt einen Zweitaccount an, statt in sein Konto zu kommen, sieht ein leeres Profil und glaubt, seine Daten seien weg. Beides passiert ohne Fehlermeldung und schlägt direkt auf die Conversion durch.

**Vorfall (2026-06-11):** maxone.one Umbrella-Login. OTP-Action mit Default `shouldCreateUser: true`, kein Passwort-Reset-Flow, `googlemail.com` und `gmail.com` als getrennte Duplikat-Accounts. Bei der Analyse zeigte sich ein 018-B-Verstoß als Wurzel: maxone teilt sich die `postgres`-DB und damit die instanzweite `auth.users` mit mehreren Projekten (`snapflow`, `pivotin`, `plansey`, `zerv` und Legacy-Fotografie im `public`-Schema). Das `maxone.profiles`-Schema trägt zudem Fremd-/Altdaten (maxone.studio-Foto-Kunden), während die echten Admins nur in `iam.user_roles` liegen. Eine erste, projektübergreifende Zählung ("20% tote Accounts") war dadurch nicht maxone-scharf und wurde verworfen. Auslöser für diese Regel.

---

## D: Wired-Team Access Control

Jeder KI-Mitarbeiter ist eine separate Identität mit eigenem Postfach, eigenen Credentials und eigenem MCP-Key-Scope. Niemand sieht in die Mailbox eines Kollegen.

| Mitarbeiter  | Eigene Mailbox | Max' Mailbox | Alle anderen Mailboxen | Zentinel-Admin |
|--------------|----------------|--------------|------------------------|----------------|
| Vector       | ✅             | ✅           | ✅ volle Kontrolle     | ✅             |
| Vigil        | ✅             | ✅           | ✅ volle Kontrolle     | ✅             |
| Alle anderen | ✅             | ❌           | ❌                     | ❌             |

**Technische Umsetzung:** Stalwart hat einen Principal pro Mitarbeiter (eigene Credentials). In `maxone.email_accounts` ist jeder Agent als eigene Zeile mit `jmap_user = eigene Adresse` aktiv. In `maxone.mcp_keys` gilt: `allowed_account_ids = [eigene UUID]` für alle außer Vector/Vigil, die `NULL` (Admin-Scope) bekommen. `mcp_audit_log` protokolliert jede Aktion mit `key_label`.

**Onboarding neuer Agenten:** Principal in Stalwart anlegen, `email_accounts`-Zeile aktivieren, `mcp_keys`-Eintrag anlegen. Template: `ops/create-agent-principal.py` im Zentinel-Repo.

---

## Audit

**Auth:**
- `src/middleware.ts` / `middleware.ts` mit Negative-Lookahead-Pattern → PASS
- Selektiver Matcher mit < 10 Pfaden → WARN
- Kein Matcher bei Supabase-Auth → FAIL
- `auth.getUser()`-Call fehlt → WARN

**Auth-Vollständigkeit (C):**
- `signInWithOtp` auf Login-Route ohne `shouldCreateUser: false` → FAIL
- Login-Route ohne Passwort-Reset-Flow (`resetPasswordForEmail`) → FAIL
- Kein E-Mail-Verify-Gate vor Account-Aktivierung → WARN
- Kein OAuth/OIDC-Provider konfiguriert → WARN
- Anteil unbestätigter Accounts in `auth.users` > 10% → WARN (Conversion-Leck)
- Admin-Identität einer eigenen Marke auf einer Mailbox derselben Infra (statt extern) → WARN (Break-Glass verletzt)

**DB-Isolation:**
- `supabase_url` fehlt in Registry → WARN
- Selbe URL bei zwei Projekten ohne `exceptions.yml`-Ausnahme → FAIL
- `DATABASE_URL` zeigt auf Container eines anderen Projekts → FAIL
