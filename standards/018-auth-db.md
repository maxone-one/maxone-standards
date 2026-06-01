# 018 — Auth & DB-Isolation (Supabase SSR Auth · DB pro Projekt)

**Status:** active
**Seit:** 2026-04-28 (Auth), 2026-05-18 (DB-Isolation)
**Gilt für:** alle Projekte mit Supabase-Auth und persistenter Datenhaltung

## Inhalt

- [A] Supabase SSR Auth: Middleware-Matcher umfasst alle Routes
- [B] DB-Isolation: ein Projekt, eine Datenbank

---

## A — Supabase SSR Auth

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

**SvelteKit** (`src/hooks.server.ts`): `setAll`-Callback mit `try/catch` — ohne es killt der async Auth-Refresh den Node-Prozess:
```ts
setAll: (cookies) => {
  try {
    cookies.forEach(({ name, value, options }) =>
      event.cookies.set(name, value, { ...options, path: '/' }));
  } catch { /* Response bereits gesendet */ }
}
```

**Niemals:** selektiver Matcher, `auth.getUser()` ohne Middleware-Refresh davor, custom Cookie-Namen ohne geprüften Sync.

**Warum:** Middleware ist der einzige Ort wo refreshte Tokens zurück in Cookies geschrieben werden. Server Components haben read-only `cookies()`. Symptom bei selektivem Matcher: "nach Deploys muss ich mich immer wieder einloggen" — nicht reproduzierbar genug für einen klaren Bug, aber zermürbend für B2B-Nutzer. SLF-Vorfall 2026-04-28.

---

## B — DB-Isolation

Jedes Projekt betreibt seine eigene, isolierte Datenbankinstanz. Keine zwei Projekte teilen sich denselben Supabase-Projekt-URL oder dieselbe PostgreSQL-Instanz.

**Verboten:**
- Selbe Supabase-URL in zwei Projekten → **FAIL**
- Direktverbindung auf Container einer anderen Instanz (`DATABASE_URL=...@supabase-db:5432`) → **FAIL**
- Getrenntes Schema in gemeinsamer PG-Instanz — Row-Level-Security allein reicht nicht → **verboten**

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

## D — Wired-Team Access Control

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

**DB-Isolation:**
- `supabase_url` fehlt in Registry → WARN
- Selbe URL bei zwei Projekten ohne `exceptions.yml`-Ausnahme → FAIL
- `DATABASE_URL` zeigt auf Container eines anderen Projekts → FAIL
