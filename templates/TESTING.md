# TESTING: <PROJEKT>

## Was abgedeckt ist

### Smoke (`test/smoke.mjs`)
- [ ] Site erreichbar (200 auf /)
- [ ] Health-Endpoint (/api/health → 200)
- [ ] Widget / Chat (falls vorhanden)
- [ ] CORS-Header
- [ ] Supabase-Verbindung (falls verwendet)

### Unit (`test/units.mjs`)
- [ ] Business-Logik X mit Golden-Reference Y
- [ ] Edge-Case: ...

## Was NICHT abgedeckt ist

- [ ] <Liste der Lücken, wichtig, weil "Tests grün" ohne diese Liste falsch verstanden wird>
- [ ] Browser-Rendering (kein Playwright)
- [ ] E2E mit Login (manuell)

## Ausführen

```bash
# Lokal gegen Prod
npm test

# Gegen Staging
SITE=https://staging.<domain> npm test

# Nur Smoke
node test/smoke.mjs
```

## Erweitern bei Bugs

Jeder User-gemeldete Bug → Test, der ihn reproduziert, VOR dem Fix.
