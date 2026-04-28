# 013 — Supabase SSR Auth: Middleware-Matcher umfasst alle Routes

**Status:** active
**Seit:** 2026-04-28 (User-Direktive nach SLF-Vorfall)
**Gilt für:** alle Projekte mit Supabase-Auth + Next.js App Router (`@supabase/ssr`)

## Regel

In jedem Next.js-Projekt mit Supabase-Auth läuft die Auth-Middleware auf
**allen** Routes (außer Static-Assets). Niemals Matcher selektiv auf
`/dashboard`, `/admin` etc. begrenzen.

```ts
// src/middleware.ts (Next 15) oder proxy.ts (Next 16+)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
```

> **Next.js 16 Rename:** Ab Next 16 heißt die Datei `proxy.ts` und exportiert
> eine Funktion `proxy(request)` statt `middleware(request)`. Funktional
> identisch — alles aus diesem Standard gilt 1:1. Wenn beide Dateien existieren,
> bricht der Build ab (`Both middleware file and proxy file are detected`).

In der Middleware **immer**: `supabase.auth.getUser()` aufrufen, refreshte
Cookies via `setAll` an Request UND Response weiterreichen, und bei Redirects
`set-cookie`-Header explizit kopieren (sonst geht der frische Token verloren).

## Warum

Die Middleware ist laut Supabase-SSR-Doku der **einzige Ort**, an dem
refreshte Auth-Tokens zurück in Cookies geschrieben werden können. Server
Components erhalten einen **read-only** `cookies()`-Store — `cookieStore.set`
wirft, der Fehler wird in `setAll` silent gefangen und der frische Token geht
verloren. API-Routes haben dasselbe Problem in App-Router-Kontexten ohne
explizites `Response`-Handling.

Wenn der Matcher selektiv ist (typisch: `/dashboard/:path*`,
`/admin/:path*`), passiert Folgendes:

1. User loggt sich ein → Cookies gesetzt (Access-Token TTL ~1h, Refresh-Token
   langlebig).
2. User browst auf `/`, `/mitglieder`, `/profil`, `/landing` → Middleware
   feuert **nicht** → Cookie wird **nicht** refreshed.
3. Nach 1h ist der Access-Token im Cookie abgelaufen. Browser-`localStorage`
   refresht im Hintergrund — aber das nützt SSR nichts.
4. User landet auf `/dashboard` (oder beliebiger Route, die in einem Server
   Component `auth.getUser()` aufruft):
   - **Bestcase:** Middleware feuert, refresht Token, Refresh-Token noch
     gültig → User bleibt eingeloggt.
   - **Worstcase:** Refresh-Token-Rotation-Race (zwei parallele SSR-Requests
     verbrauchen denselben Refresh-Token, einer bekommt 400) → Session weg.
   - **Worstcase 2:** Deploy passiert genau in dem Moment, GoTrue antwortet
     kurz fehlerhaft, SDK invalidiert lokale Session → User logged out.

Symptom für den User: "Nach Deploys/Neustarts muss ich mich immer wieder
einloggen." Nicht reproduzierbar genug, um es als klaren Bug zu sehen, aber
zermürbend genug, dass User Vertrauen in die Plattform verlieren — speziell
im Kundenkontext (B2B, Geschäftsbetriebe melden sich frustriert ab).

## Wie anwenden

**Pflicht-Setup** (`src/middleware.ts`):

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
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Pflicht: refresht Token, schreibt frische Cookies via setAll oben.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Bei Redirects: set-cookie-Header explizit übernehmen, sonst Token weg.
  function redirectWithCookies(url: URL) {
    const res = NextResponse.redirect(url);
    supabaseResponse.headers.getSetCookie().forEach((cookie) => {
      res.headers.append("set-cookie", cookie);
    });
    return res;
  }

  // Projekt-spezifische Auth-Guards hier (Dashboard, Admin, etc.) — aber
  // *immer* mit redirectWithCookies, niemals NextResponse.redirect direkt.

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
```

**Trade-off:** Middleware feuert auf jedem Request — ~5–15ms zusätzlich pro
Request für die GoTrue-Validierung. Bei statisch gerenderten Seiten kein
Issue (Middleware läuft an der Edge, vor Page-Cache). Mehrwert: Sessions
überleben Deploys, Tab-Wechsel und längere Idle-Zeiten zuverlässig.

**Niemals:**
- Selektive Matcher wie `["/dashboard/:path*", "/admin/:path*"]`.
- `auth.getUser()` in Server Component aufrufen ohne Middleware-Refresh
  davor — der Component sieht potenziell stale Tokens.
- Im `setAll` der `server.ts` einen anderen Code-Pfad als Schweigen
  bauen — Server Components dürfen Cookies nicht schreiben, das ist
  by design.
- Custom Cookie-Namen / `cookieOptions` setzen, ohne den Sync zwischen
  Browser-Client und Server-Client genau geprüft zu haben.

## Stand pro Projekt

Initial-Audit 2026-04-28 (manuell, noch kein Audit-Skript):

| Projekt | Stack | Matcher-Status | Notizen |
|---|---|---|---|
| stadt-lahn-flow | Next.js + `@supabase/ssr` | ✅ broad matcher | gefixt 2026-04-28 (Commit `f7b5f6b`); vorher selektiv `/dashboard,/admin,/login,/claim,/auth` |
| vanfree | Next.js 14 + `@supabase/ssr` | ✅ broad matcher | `middleware.ts` (root) ruft `updateSession` aus `lib/supabase/middleware.ts` auf |
| voltfair.de | Next.js 16 + `@supabase/ssr` | ✅ broad matcher | nutzt `proxy.ts` (Next 16-Rename), broad matcher + `auth.getUser()` korrekt |
| maxone.one | SvelteKit | – nicht betroffen | anderer Auth-Flow (SvelteKit Hooks) |
| plansey-next | Next.js + NextAuth + `next-intl` | – nicht betroffen | nutzt NextAuth (`@/lib/auth`), kein Supabase SSR |
| katchi, getsnapflow, solarproof | Vite/React | – nicht betroffen | kein `@supabase/ssr` |
| snapflow, repivot, plansey, kitchen-station | unklar | ❓ | kein `package.json` an Root (Monorepo / leer) — bei nächstem Touch prüfen |

**Fazit (2026-04-28):** Audit deckt **3 PASS, 0 FAIL** auf. Alle aktiven Next.js
+ Supabase-SSR-Projekte sind konform. Die Regel bleibt aktiv als Schutz vor
Refactoring-Regressionen.

→ Audit reproduzierbar via `node scripts/audit.mjs --standard=013 --local-only`.

## Audit

`scripts/audit.mjs` soll pro Projekt prüfen:

- Existiert `src/middleware.ts` (oder `middleware.ts` im Root)?
- Falls ja: enthält das `config.matcher` einen Negative-Lookahead-Pattern
  (`(?!_next/static…`)? Oder ist es eine selektive Liste?
  - Negative-Lookahead vorhanden → PASS
  - Selektive Liste mit weniger als ~10 Pfaden → WARN (möglicher Bug 013)
  - Kein Matcher / keine Middleware aber Supabase-Auth aktiv → FAIL
- Enthält die Middleware einen `auth.getUser()`-Call? Sonst: WARN.

Bis das Skript existiert: bei jedem Projekt-Touch manuell prüfen.
