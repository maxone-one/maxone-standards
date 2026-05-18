#!/usr/bin/env node
// audit.mjs — Compliance-Scan über alle Projekte gegen alle Standards
//
// Verwendung:
//   node scripts/audit.mjs                    # alle Projekte, alle Standards
//   node scripts/audit.mjs --project=snapflow # nur ein Projekt
//   node scripts/audit.mjs --standard=001     # nur eine Regel
//   node scripts/audit.mjs --local-only       # SSH-Checks überspringen
//   node scripts/audit.mjs --root=/opt        # path_local durch path_server
//                                              ersetzen (Linux-Audit, Standard 031
//                                              GH-Action-Runner). Wert wird als
//                                              Fallback genutzt, wenn ein Projekt
//                                              keinen path_server hat: <root>/<name>.
//
// SSH-Checks brauchen ~/.ssh/id_ed25519 für maxone-prod (128.140.40.235) und
// ~/.ssh/voltfair für voltfair-cli (46.225.107.118). Bei Fehler wird der Check
// als WARN (nicht FAIL) gewertet, damit das Audit auch ohne Konnektivität läuft.

import { existsSync, readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { promises as dns } from 'node:dns';
import tls from 'node:tls';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Module-level Flag, in main() aus --local-only gesetzt. Standard 017 fragt
// Live-Domains via fetch() ab — bei --local-only wird übersprungen.
let OFFLINE = false;

const SERVERS = {
  'maxone-prod':   { host: '128.140.40.235', user: 'root', key: '~/.ssh/id_ed25519' },
  'voltfair-cli':  { host: '46.225.107.118', user: 'root', key: '~/.ssh/voltfair' },
  'voltfair-db':   { host: '46.225.168.235', user: 'root', key: '~/.ssh/voltfair' },
  'vybora-prod':   { host: '46.225.88.53',   user: 'root', key: '~/.ssh/id_ed25519' },
};

// Standard 019 — DNS-Whitelist: alle eigenen Server-IPs.
const KNOWN_SERVER_IPS = new Set(Object.values(SERVERS).map(s => s.host));

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    const [k, v] = arg.replace(/^--/, '').split('=');
    args[k] = v ?? true;
  }
  return args;
}

function loadRegistry() {
  const text = readFileSync(join(ROOT, 'registry', 'projects.yml'), 'utf8');
  return yaml.load(text).projects;
}

function loadExceptions() {
  const path = join(ROOT, 'registry', 'exceptions.yml');
  if (!existsSync(path)) return [];
  try {
    const text = readFileSync(path, 'utf8');
    return yaml.load(text)?.exceptions ?? [];
  } catch (e) {
    console.warn(`[exceptions] Parse-Fehler in ${path}: ${e.message.slice(0, 80)} — ignoriere`);
    return [];
  }
}

// Findet eine aktive (nicht abgelaufene) Ausnahme für (project, checkId).
// standard-Match per startsWith: "011" matched "011-vector-chat-widget".
function findActiveException(exceptions, projectName, checkId, today) {
  return exceptions.find(e => {
    if (e.project !== projectName) return false;
    if (!checkId.startsWith(String(e.standard))) return false;
    if (!e.expires_until) return false;  // Pflichtfeld — ohne Ablauf nicht aktiv
    return new Date(e.expires_until) >= today;
  });
}

function ssh(server, command, timeoutMs = 8000) {
  const cfg = SERVERS[server];
  if (!cfg) throw new Error(`unbekannter Server: ${server}`);
  const keyPath = cfg.key.replace('~', process.env.HOME || process.env.USERPROFILE);
  return execFileSync(
    'ssh',
    ['-i', keyPath, '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', '-o', 'StrictHostKeyChecking=no', `${cfg.user}@${cfg.host}`, command],
    { encoding: 'utf8', timeout: timeoutMs, stdio: ['ignore', 'pipe', 'pipe'] }
  );
}

const PASS = (msg) => ({ ok: true, msg });
const FAIL = (msg) => ({ ok: false, msg });
const WARN = (msg) => ({ ok: true, warn: true, msg });
const SKIP = (msg) => ({ ok: true, skip: true, msg });

// Walk repo source files (skip node_modules, .next, dist, .git, etc.)
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.turbo', '.svelte-kit', 'coverage', '.cache', 'out']);
const SCAN_EXT = new Set(['.tsx', '.ts', '.jsx', '.js', '.svelte', '.astro', '.vue', '.html', '.mjs']);

function* walkSource(root, depth = 0) {
  if (depth > 8) return;
  let entries;
  try { entries = readdirSync(root, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name.startsWith('.') && e.name !== '.well-known') continue;
    if (SKIP_DIRS.has(e.name)) continue;
    const p = join(root, e.name);
    if (e.isDirectory()) yield* walkSource(p, depth + 1);
    else if (e.isFile() && SCAN_EXT.has(extname(e.name))) yield p;
  }
}

function grepRepo(repoRoot, regex, maxFiles = 5) {
  const hits = [];
  for (const file of walkSource(repoRoot)) {
    let text;
    try { text = readFileSync(file, 'utf8'); } catch { continue; }
    if (regex.test(text)) {
      hits.push(file.slice(repoRoot.length + 1).replace(/\\/g, '/'));
      if (hits.length >= maxFiles) break;
    }
  }
  return hits;
}

// Impressum-API-Cache — einmalig pro Audit-Lauf
let _impressumApiData = null;
let _impressumApiFetched = false;
async function fetchImpressumApi() {
  if (_impressumApiFetched) return _impressumApiData;
  _impressumApiFetched = true;
  try {
    const res = await fetch('https://panel.maxone.one/functions/v1/impressum',
      { signal: AbortSignal.timeout(5000) });
    if (res.ok) _impressumApiData = await res.json();
  } catch { /* API nicht erreichbar — Feldprüfung wird übersprungen */ }
  return _impressumApiData;
}

function findImpressumFiles(repoRoot) {
  const hits = [];
  for (const file of walkSource(repoRoot)) {
    const rel = file.slice(repoRoot.length + 1).replace(/\\/g, '/');
    if (/impressum|imprint/i.test(rel)) hits.push({ abs: file, rel });
  }
  return hits;
}

// --- Local Checks ---

const localChecks = {
  '007-paths': (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    if (!existsSync(project.path_local)) return FAIL(`Pfad fehlt: ${project.path_local}`);
    const ws = join(project.path_local, `${project.workspace}.code-workspace`);
    if (!existsSync(ws)) return FAIL(`Workspace fehlt: ${ws}`);
    return PASS();
  },
  '001-blue-green': (project) => {
    if (project.status !== 'live') return SKIP('nicht live');
    if (project.deploy === 'blue-green') return PASS();
    return FAIL(`deploy=${project.deploy ?? 'null'} (sollte blue-green sein)`);
  },
  '008-domain-policy': (project) => {
    const d = project.domain;
    if (!d) return PASS();
    if (d.endsWith('.maxone.studio') && !['mail.maxone.studio', 'autoconfig.maxone.studio'].includes(d)) {
      return FAIL(`Domain auf .studio: ${d}`);
    }
    return PASS();
  },
  '002-no-build-on-prod': (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    const composeFile = project.compose_file ?? 'docker-compose.yml';
    const composePath = join(project.path_local, composeFile);
    if (!existsSync(composePath)) return WARN(`${composeFile} nicht im Repo-Root`);
    const text = readFileSync(composePath, 'utf8');
    const hasImage = /^\s*image:\s/m.test(text);
    const hasBuild = /^\s*build:/m.test(text);
    if (hasImage && hasBuild) return PASS(`${composeFile}: image: + build:`);
    if (hasImage && !hasBuild) return PASS(`${composeFile}: nur image: (CI-Build separat)`);
    if (!hasImage && hasBuild) return FAIL(`${composeFile}: nur build:, kein image: → Server würde bauen!`);
    return WARN(`${composeFile}: weder image: noch build: gefunden`);
  },
  '004-tls-dns01': (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    if (!project.domain) return SKIP('keine Domain');
    const composeFile = project.compose_file ?? 'docker-compose.yml';
    const composePath = join(project.path_local, composeFile);
    if (!existsSync(composePath)) return WARN(`${composeFile} fehlt`);
    const text = readFileSync(composePath, 'utf8');
    if (!/traefik\.enable=true/.test(text) && !/traefik\.http\.routers/.test(text)) {
      return SKIP('keine Traefik-Labels (vermutlich kein eigener Reverse-Proxy)');
    }
    if (/certresolver=letsencrypt/.test(text)) return PASS();
    if (/certresolver=/.test(text)) return WARN('certresolver gesetzt, aber nicht "letsencrypt"');
    return FAIL('kein certresolver in Traefik-Labels');
  },
  '005-test-first': (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    const smoke = existsSync(join(project.path_local, 'test', 'smoke.mjs'))
               || existsSync(join(project.path_local, 'tests', 'smoke.mjs'));
    const testingMd = existsSync(join(project.path_local, 'TESTING.md'));
    if (smoke && testingMd) return PASS('smoke.mjs + TESTING.md');
    if (smoke && !testingMd) return WARN('smoke.mjs ja, TESTING.md fehlt');
    if (!smoke && testingMd) return WARN('TESTING.md ja, smoke.mjs fehlt');
    return FAIL('weder smoke.mjs noch TESTING.md');
  },
  '009-impressum-widget': async (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    if (project.tags === 'infra') return SKIP('Infra-Projekt');
    if (project.tags === 'internal') return SKIP('Internes Tool');

    const apiOld = grepRepo(project.path_local, /panel\.maxone\.studio\/functions\/v1\/impressum/, 1);
    if (apiOld.length) return WARN(`nutzt panel.maxone.studio (auf .one migrieren) — ${apiOld[0]}`);

    const apiNew = grepRepo(project.path_local, /panel\.maxone\.one\/functions\/v1\/impressum/, 10);
    const hasApi = apiNew.length > 0;

    if (!hasApi && !project.impressum_local_intentional) {
      const localImpressum = grepRepo(project.path_local, /\b(impressum|imprint)\b/i, 1);
      if (localImpressum.length) return WARN(`Impressum lokal? siehe ${localImpressum[0]}`);
      return SKIP('keine Impressum-Erwähnung gefunden');
    }

    const apiNewPrimary = apiNew.find(f => /impressum|imprint/i.test(f)) ?? apiNew[0];
    const location = hasApi ? `API .one in ${apiNewPrimary}` : 'lokal (bewusste Ausnahme)';

    // ODR-Link verboten seit 20.07.2025 (VO (EU) 2024/3228 — Plattform abgeschaltet, UWG-Irreführung)
    const hasOldOdrLink = grepRepo(project.path_local, /ec\.europa\.eu\/consumers\/odr/, 1).length > 0;
    if (hasOldOdrLink) return FAIL(`${location} — veralteter ODR-Link im Quellcode (ec.europa.eu/consumers/odr) — abmahnfähig seit 20.07.2025`);

    // §36 VSBG — Teilnahme-Erklärung muss vorhanden sein (kein Link, nur Text)
    const hasVsbg36 = grepRepo(project.path_local, /Verbraucherschlichtung|Streitbeilegungsverfahren/i, 1).length > 0;
    if (!hasVsbg36) return WARN(`${location} — §36-VSBG-Erklärung fehlt (Verbraucherschlichtung/Streitbeilegungsverfahren)`);

    // Live-Check: gerendertes HTML auf alten ODR-Link und §36-VSBG prüfen
    if (!OFFLINE && project.domain) {
      const impUrls = [`https://${project.domain}/impressum`, `https://${project.domain}/imprint`];
      for (const impUrl of impUrls) {
        try {
          const res = await fetch(impUrl, { signal: AbortSignal.timeout(8000) });
          if (!res.ok) continue;
          const html = await res.text();
          if (html.includes('ec.europa.eu/consumers/odr')) {
            return FAIL(`${location} — LIVE ${impUrl}: veralteter ODR-Link im HTML — abmahnfähig seit 20.07.2025`);
          }
          if (!/Verbraucherschlichtung|Streitbeilegungsverfahren/i.test(html)) {
            return WARN(`${location} — LIVE ${impUrl}: §36-VSBG-Erklärung nicht im HTML`);
          }
          break;
        } catch { continue; }
      }
    }

    // Pflichtfelder-Check via Live-API (§ 5 DDG, rechtsformabhängig)
    const apiData = await fetchImpressumApi();
    if (!apiData) return PASS(`${location} — §36 VSBG ✓ (API nicht erreichbar, Pflichtfeld-Check übersprungen)`);

    const isKapitalgesellschaft = !!(apiData.register_court && apiData.register_number);
    const legalForm = isKapitalgesellschaft ? 'Kapitalgesellschaft' : 'Einzelunternehmen';

    const impressumFiles = findImpressumFiles(project.path_local);
    const tpl = impressumFiles.map(f => {
      try { return readFileSync(f.abs, 'utf8'); } catch { return ''; }
    }).join('\n');

    const missing = [];
    // §5 Abs. 1 Nr. 1 DDG — Name + Anschrift
    if (!tpl.includes('legal_name')) missing.push('legal_name');
    if (!tpl.includes('street')) missing.push('street');
    if (!tpl.includes('zip') && !tpl.includes('city')) missing.push('zip/city');
    // §5 Abs. 1 Nr. 2 DDG — schnelle elektronische Kommunikation
    if (!tpl.includes('email') && !tpl.includes('phone')) missing.push('email/phone');
    // §5 Abs. 1 Nr. 6 DDG — Steuer-ID / USt-IdNr. / W-IdNr., nur wenn API-Daten vorhanden
    if (apiData.vat_id && !tpl.includes('vat_id')) missing.push('vat_id');
    else if (apiData.w_id_nr && !apiData.vat_id && !tpl.includes('w_id_nr')) missing.push('w_id_nr');
    else if (apiData.tax_id && !apiData.vat_id && !apiData.w_id_nr && !tpl.includes('tax_id')) missing.push('tax_id');
    // §5 Abs. 1 Nr. 4 DDG — Handelsregister (nur Kapitalgesellschaft)
    if (isKapitalgesellschaft) {
      if (!tpl.includes('register_court')) missing.push('register_court');
      if (!tpl.includes('register_number')) missing.push('register_number');
    }

    if (missing.length > 0) {
      return WARN(`${location} — Pflichtfelder fehlen im Template [${legalForm}]: ${missing.join(', ')}`);
    }
    return PASS(`${location} — alle §5-TMG-Pflichtfelder + §36 VSBG ✓ [${legalForm}]`);
  },
  '010-credits-api': (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    if (project.name === 'maxone.one') return SKIP('hostet die API selbst');
    if (project.tags === 'infra') return SKIP('Infra-Projekt');
    if (project.tags === 'internal') return SKIP('Internes Tool');
    // Echter API-Call: maxone.one/api/credits/<slug> mit fetch oder axios oder als Konstante
    const api = grepRepo(project.path_local, /(['"`])https?:\/\/maxone\.one\/api\/credits\//, 1);
    if (api.length) return PASS(`API in ${api[0]}`);
    const localCredits = grepRepo(project.path_local, /\bCredits(Overlay|Page|Section)\b|\/credits\b/, 1);
    if (localCredits.length) return WARN(`Credits lokal? siehe ${localCredits[0]} (auf API umstellen)`);
    return WARN('keine Credits-Route gefunden (sollte hinzugefügt werden)');
  },
  '011-vector-chat': (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    if (project.name === 'vector') return SKIP('hostet Widget selbst');
    if (project.name === 'maxone.one') return PASS('hostet Widget mit, Einbau geprüft separat');
    if (project.tags === 'infra') return SKIP('Infra-Projekt');
    if (project.tags === 'internal') return SKIP('Internes Tool');
    const widgetNew = grepRepo(project.path_local, /agent\.maxone\.one\/widget\/vector-chat\.js/, 1);
    const widgetOld = grepRepo(project.path_local, /agent\.maxone\.studio\/widget/, 1);
    if (widgetNew.length) return PASS(`eingebunden in ${widgetNew[0]}`);
    if (widgetOld.length) return WARN(`alte URL agent.maxone.studio in ${widgetOld[0]}`);
    // Some projects (z.B. SLF) beziehen die Widget-URL aus einer env-Variable, um
    // Infrastruktur-Kopplung zu vermeiden. Akzeptiere Web-Component-Tag oder
    // NEXT_PUBLIC_VECTOR_WIDGET_URL als gleichwertige Einbindung.
    const widgetEnv = grepRepo(project.path_local, /<vector-chat\s|NEXT_PUBLIC_VECTOR_WIDGET_URL/, 1);
    if (widgetEnv.length) return PASS(`eingebunden via env in ${widgetEnv[0]}`);
    return FAIL('Widget nicht eingebunden');
  },
  '022-secret-scan': (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    if (!existsSync(project.path_local)) return SKIP('Pfad fehlt');
    try {
      execFileSync('gitleaks',
        ['detect', '--source', project.path_local, '--no-banner', '--redact', '--no-git'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
      );
      return PASS('keine Findings');
    } catch (err) {
      if (err.code === 'ENOENT') return SKIP('gitleaks nicht installiert (make install-tools)');
      if (err.signal === 'SIGTERM') return WARN('gitleaks Timeout (>60s)');
      if (err.status === 1) return FAIL('Findings — `gitleaks detect --source <pfad> --no-git` lokal ausführen');
      return WARN(`gitleaks Fehler: ${(err.message || '').slice(0, 80)}`);
    }
  },
  '023-static-analysis': (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    if (!existsSync(project.path_local)) return SKIP('Pfad fehlt');
    try {
      execFileSync('semgrep',
        ['--config=p/owasp-top-ten', '--severity=ERROR', '--error', '--quiet', project.path_local],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000, maxBuffer: 10 * 1024 * 1024 }
      );
      return PASS('keine ERROR-Findings');
    } catch (err) {
      if (err.code === 'ENOENT') return SKIP('semgrep nicht installiert (make install-tools)');
      if (err.signal === 'SIGTERM') return WARN('semgrep Timeout (>120s)');
      if (err.status === 1) return FAIL('ERROR-Findings — `semgrep --config=p/owasp-top-ten --severity=ERROR <pfad>` lokal ausführen');
      return WARN(`semgrep Fehler: ${(err.message || '').slice(0, 80)}`);
    }
  },
  '015-concept-gate': (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    if (!existsSync(project.path_local)) return SKIP('Pfad fehlt');
    const conceptPath = join(project.path_local, 'CONCEPT.md');
    const isInternal = project.tags === 'internal' || project.tags === 'infra';
    const isLive = project.status === 'live';
    if (!existsSync(conceptPath)) {
      // Bei laufenden Projekten ist CONCEPT.md retroaktiv (WARN), nur dev verlangt FAIL
      if (isLive) return WARN('CONCEPT.md fehlt — retroaktiv nachreichen (Standard 015)');
      if (isInternal) return WARN('CONCEPT.md fehlt (internes/Infra-Tool, Empfehlung)');
      return FAIL('CONCEPT.md fehlt — Pflicht vor erster Code-Zeile (Standard 015)');
    }
    const text = readFileSync(conceptPath, 'utf8');
    const requiredSections = [
      { name: 'Problem',         re: /^##\s+Problem/m },
      { name: 'Datenmodell',     re: /^##\s+Datenmodell/m },
      { name: 'Auth-Modell',     re: /^##\s+Auth-Modell/m },
      { name: 'Externe Dienste', re: /^##\s+Externe\s+Dienste/m },
      { name: 'Threat-Model',    re: /^##\s+Threat[- ]Model/m },
      { name: 'Stack',           re: /^##\s+Stack/m },
    ];
    const missing = requiredSections.filter(s => !s.re.test(text)).map(s => s.name);
    if (missing.length) return WARN(`Pflicht-Sektionen fehlen: ${missing.join(', ')}`);
    const hasGate1 = /^##\s+Gate\s*1\b/m.test(text);
    if (!hasGate1) return WARN('Gate-1-Sign-Off-Block fehlt (## Gate 1 — Konzept-Sign-Off)');
    const hasReviewed = /Reviewed\s+von:\s*\S/i.test(text);
    if (!hasReviewed) return WARN('Sign-Off ohne Reviewer-Eintrag');
    return PASS('Konzept + Gate 1 vorhanden');
  },
  '016-stack-whitelist': (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    if (!existsSync(project.path_local)) return SKIP('Pfad fehlt');
    const isLive = project.status === 'live';
    const isInternal = project.tags === 'internal' || project.tags === 'infra';
    const findings = [];

    // 1. Plattform-Marker-Files im Repo-Root
    const blacklistMarkers = [
      '.lovable', 'lovable.config.js', 'lovable.config.ts', 'lovable.config.json',
      '.bolt', '.stackblitz',
      '.replit', 'replit.nix',
    ];
    for (const marker of blacklistMarkers) {
      if (existsSync(join(project.path_local, marker))) {
        findings.push(`Plattform-Marker ${marker}`);
      }
    }

    // 2. Lockfile-Scan auf Blacklist-Pakete
    const lockfiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'];
    const blacklistPkgRe = /(@lovable\/|@stackblitz\/sdk|@base44\/|@replit\/agent|"v0":)/i;
    for (const lf of lockfiles) {
      const lfPath = join(project.path_local, lf);
      if (!existsSync(lfPath)) continue;
      try {
        const lfText = readFileSync(lfPath, 'utf8');
        if (blacklistPkgRe.test(lfText)) {
          const match = lfText.match(blacklistPkgRe);
          findings.push(`Blacklist-Paket in ${lf}: ${match[1]}`);
        }
      } catch {
        // unlesbar — überspringen
      }
    }

    // 3. Cloud-Konfig (warning, nicht fail) — Vercel/Cloudflare bei customer-facing
    const cloudConfigs = ['vercel.json', 'wrangler.toml'];
    const cloudFindings = [];
    for (const cc of cloudConfigs) {
      if (existsSync(join(project.path_local, cc))) cloudFindings.push(cc);
    }

    if (findings.length) {
      const msg = findings.join(', ');
      if (isLive && !isInternal) return FAIL(`Blacklist-Treffer: ${msg}`);
      return WARN(`Blacklist-Treffer: ${msg}`);
    }
    if (cloudFindings.length && project.tags === 'customer') {
      return WARN(`Cloud-Konfig (${cloudFindings.join(', ')}) bei Customer-Projekt — DSFA-Pflicht prüfen`);
    }
    return PASS('keine Blacklist-Marker / -Pakete gefunden');
  },
  '017-dsgvo-tracker': async (project) => {
    if (project.status !== 'live') return SKIP(`status=${project.status ?? 'null'}`);
    if (!project.domain) return SKIP('keine Domain');
    if (project.tags === 'internal' || project.tags === 'infra') return SKIP('internes/Infra-Projekt');
    if (OFFLINE) return SKIP('--local-only (HTTP-Fetch übersprungen)');

    const url = `https://${project.domain}/`;
    let html;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 10000);
      const res = await fetch(url, {
        signal: ctrl.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'maxone-standards-audit/017 (+DSGVO-Tracker-Scan)' },
      });
      clearTimeout(timer);
      if (!res.ok) return WARN(`HTTP ${res.status} — manueller Webbkoll-Check empfohlen`);
      html = await res.text();
    } catch (err) {
      const reason = err.name === 'AbortError' ? 'Timeout (>10s)' : (err.cause?.code || err.message || '').toString().slice(0, 60);
      return WARN(`Domain nicht erreichbar (${reason}) — manueller Webbkoll-Check empfohlen`);
    }

    const trackerPatterns = [
      { name: 'Google Fonts (LG München I)', re: /\b(fonts\.googleapis\.com|fonts\.gstatic\.com)\b/i },
      { name: 'Google Analytics / GTM',      re: /\b(google-analytics\.com|googletagmanager\.com|analytics\.google\.com)\b/i },
      { name: 'Facebook Pixel',              re: /\b(connect\.facebook\.net|facebook\.com\/tr)\b/i },
      { name: 'LinkedIn Insight',            re: /\bsnap\.licdn\.com\b/i },
      { name: 'TikTok Pixel',                re: /\banalytics\.tiktok\.com\b/i },
      { name: 'Hotjar',                      re: /\bstatic\.hotjar\.com\b/i },
      { name: 'Mixpanel',                    re: /\bcdn\.mxpnl\.com\b/i },
      { name: 'Segment',                     re: /\bcdn\.segment\.com\b/i },
      { name: 'Amplitude',                   re: /\bcdn\.amplitude\.com\b/i },
      { name: 'Intercom',                    re: /\b(widget\.intercom\.io|js\.intercomcdn\.com)\b/i },
      { name: 'Crazy Egg',                   re: /\bscript\.crazyegg\.com\b/i },
      { name: 'YouTube-Embed',               re: /\b(www\.youtube\.com\/embed|youtube\.com\/iframe_api)\b/i },
      { name: 'Vimeo-Embed',                 re: /\bplayer\.vimeo\.com\/video\b/i },
      { name: 'Google Maps-Embed',           re: /\b(maps\.googleapis\.com|maps\.google\.com\/maps\?)\b/i },
    ];

    const hits = trackerPatterns.filter(p => p.re.test(html)).map(p => p.name);
    if (hits.length) {
      return WARN(`Tracker im Initial-HTML: ${hits.join(', ')} — vor Consent rechtswidrig (DSGVO Art. 6 + TTDSG § 25)`);
    }
    return PASS('keine bekannten Tracker im Initial-HTML');
  },
  '018-bundle-drift': async (project) => {
    if (project.status !== 'live') return SKIP(`status=${project.status ?? 'null'}`);
    if (!project.domain) return SKIP('keine Domain');
    if (project.tags === 'internal' || project.tags === 'infra') return SKIP('internes/Infra-Projekt');
    if (OFFLINE) return SKIP('--local-only (HTTP-Fetch übersprungen)');

    const fetchWithTimeout = async (url, timeoutMs) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          signal: ctrl.signal,
          redirect: 'follow',
          headers: { 'User-Agent': 'maxone-standards-audit/018 (+Bundle-Drift-Scan)' },
        });
        const text = res.ok ? await res.text() : null;
        return { ok: res.ok, status: res.status, text };
      } finally {
        clearTimeout(timer);
      }
    };

    const baseUrl = `https://${project.domain}/`;
    let html;
    try {
      const r = await fetchWithTimeout(baseUrl, 10000);
      if (!r.ok) return WARN(`HTTP ${r.status} — Bundle-Audit nicht möglich`);
      html = r.text;
    } catch (err) {
      const reason = err.name === 'AbortError' ? 'Timeout (>10s)' : (err.cause?.code || err.message || '').toString().slice(0, 60);
      return WARN(`Domain nicht erreichbar (${reason})`);
    }

    // Asset-URLs aus <script src="..."> + <link href="...">
    const assetRe = /<(?:script\s+[^>]*src|link\s+[^>]*href)\s*=\s*["']([^"']+)["']/gi;
    const seen = new Set();
    const assets = [];
    let m;
    while ((m = assetRe.exec(html)) !== null && assets.length < 8) {
      let url;
      try {
        url = new URL(m[1], baseUrl);
      } catch { continue; }
      if (url.host !== project.domain) continue; // nur eigene Origin
      if (!/\.(js|mjs|cjs|css)$/i.test(url.pathname)) continue;
      const key = url.toString();
      if (seen.has(key)) continue;
      seen.add(key);
      assets.push(url);
    }

    if (!assets.length) return PASS('keine eigenen JS/CSS-Assets im HTML (SSR / inline)');

    const driftPatterns = [
      { name: '*.maxone.studio',        re: /\b([\w-]+)\.maxone\.studio\b/gi, severity: 'warn',
        filter: (host) => !['mail', 'autoconfig'].includes(host.toLowerCase()) },
      { name: 'Source-Map-Direktive',   re: /\/\/#\s*sourceMappingURL\s*=/i, severity: 'warn' },
      { name: 'Lovable-Watermark',      re: /\blovable\.(dev|app)\b|@lovable\//i, severity: 'fail' },
      { name: 'Bolt-Watermark',         re: /\bbolt\.new\b|stackblitz\.com/i, severity: 'fail' },
      { name: 'Base44-Watermark',       re: /\bbase44\.com\b|@base44\//i, severity: 'fail' },
      { name: 'v0-Watermark',           re: /\bbuilt with v0\b|v0\.dev\/team/i, severity: 'fail' },
      { name: 'Replit-Watermark',       re: /\breplit-agent\b|replit\.com\/@/i, severity: 'fail' },
      { name: 'Dev-Host (localhost)',   re: /\blocalhost:\d+\b/i, severity: 'warn' },
      { name: 'Dev-Host (loopback)',    re: /\b(127\.0\.0\.1|0\.0\.0\.0|host\.docker\.internal)\b/i, severity: 'warn' },
      { name: 'Service-Role-Key (JWT)', re: /eyJ[\w-]+\.eyJ[\w-]*c2VydmljZV9yb2xl[\w-]*\.[\w-]+/i, severity: 'fail' },
    ];

    const warnings = [];
    const fails = [];
    for (const url of assets) {
      let body;
      try {
        const r = await fetchWithTimeout(url.toString(), 5000);
        if (!r.ok || !r.text) continue;
        body = r.text;
      } catch { continue; }

      const assetLabel = url.pathname.split('/').pop();
      for (const p of driftPatterns) {
        if (p.filter) {
          // regex mit Capture-Group, mindestens ein Treffer der den Filter besteht
          const matches = [...body.matchAll(p.re)];
          const real = matches.filter(mm => p.filter(mm[1]));
          if (!real.length) continue;
        } else {
          if (!p.re.test(body)) continue;
        }
        const entry = `${p.name} in ${assetLabel}`;
        if (p.severity === 'fail') fails.push(entry);
        else warnings.push(entry);
      }
    }

    if (fails.length) return FAIL(`Drift kritisch: ${fails.join('; ')}`);
    if (warnings.length) return WARN(`Drift: ${warnings.join('; ')}`);
    return PASS(`${assets.length} Asset(s) geprüft, kein Drift`);
  },
  '014-sunset': (project) => {
    const sunsetStates = new Set(['sunset', 'sunset-pending']);
    if (!sunsetStates.has(project.status)) return SKIP(`status=${project.status ?? 'null'}`);
    if (!project.path_local) return SKIP('kein path_local');
    if (!existsSync(project.path_local)) return SKIP('Pfad fehlt');

    const sunsetPath = join(project.path_local, 'SUNSET.md');
    if (!existsSync(sunsetPath)) {
      return FAIL('SUNSET.md fehlt — Pflicht bei sunset / sunset-pending (Standard 014)');
    }
    const text = readFileSync(sunsetPath, 'utf8');
    const required = [
      { name: 'Sunset-Datum', re: /^\*\*Sunset-Datum:\*\*\s*\d{4}-\d{2}-\d{2}/m },
      { name: 'Verantwortlich', re: /^\*\*Verantwortlich:\*\*\s*\S/m },
      { name: 'Section A (Entscheidung)', re: /^##\s+A\.\s+Entscheidung/m },
      { name: 'Section B (Datenexport)', re: /^##\s+B\.\s+Datenexport/m },
      { name: 'Sign-Off', re: /^##\s+Sunset\s+Sign-Off/m },
    ];
    const missing = required.filter(r => !r.re.test(text)).map(r => r.name);
    if (missing.length) return WARN(`SUNSET.md unvollständig: ${missing.join(', ')}`);

    // sunset-pending: Datum < 30 Tage her, sonst WARN
    if (project.status === 'sunset-pending') {
      const dateMatch = text.match(/^\*\*Sunset-Datum:\*\*\s*(\d{4}-\d{2}-\d{2})/m);
      if (dateMatch) {
        const ageDays = Math.floor((Date.now() - new Date(dateMatch[1]).getTime()) / 86400000);
        if (ageDays > 30) return WARN(`sunset-pending seit ${ageDays}d (>30d) — entweder live machen oder zu sunset migrieren`);
      }
    }
    return PASS(`SUNSET.md vorhanden (${project.status})`);
  },
  '020-pentest-light': async (project) => {
    if (project.status !== 'live') return SKIP(`status=${project.status ?? 'null'}`);
    if (!project.domain) return SKIP('keine Domain');
    if (project.tags === 'internal' || project.tags === 'infra') return SKIP('internes/Infra-Projekt');
    if (OFFLINE) return SKIP('--local-only (Netzwerk übersprungen)');

    const baseUrl = `https://${project.domain}`;
    const probe = async (path, method = 'GET') => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3000);
      try {
        const res = await fetch(baseUrl + path, {
          method,
          signal: ctrl.signal,
          redirect: 'follow',
          headers: { 'User-Agent': 'maxone-standards-audit/020 (+Pentest-Light)' },
        });
        const ct = res.headers.get('content-type') || '';
        // Bei text/html: kurzen Body lesen (max 4 KB) für Inhalts-Heuristik (SPA-Fallback erkennen)
        let body = null;
        if (method === 'GET' && res.ok && /text\/(html|plain)/i.test(ct)) {
          const reader = res.body?.getReader();
          if (reader) {
            const chunks = [];
            let total = 0;
            while (total < 4096) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
              total += value.length;
            }
            try { reader.cancel(); } catch {}
            body = Buffer.concat(chunks).toString('utf8').slice(0, 4096);
          }
        }
        return { status: res.status, headers: res.headers, contentType: ct, body };
      } catch {
        return { status: 0, headers: null, contentType: '', body: null };
      } finally {
        clearTimeout(timer);
      }
    };

    // Baseline: zufälliger Pfad — wenn der schon 200/HTML zurückgibt, ist es ein SPA-Catch-All-Routing.
    // Dann müssen Probes per Inhalt unterschieden werden, nicht per Status-Code.
    const baseline = await probe('/__maxone-audit-nonexistent-' + Math.random().toString(36).slice(2, 10) + '__', 'GET');
    const isSpaCatchAll = baseline.status === 200 && /text\/html/i.test(baseline.contentType);

    const exposedPaths = [
      { path: '/.env',              severity: 'fail', name: '.env',
        contentRe: /^[A-Z_][A-Z0-9_]*\s*=/m },
      { path: '/.env.local',        severity: 'fail', name: '.env.local',
        contentRe: /^[A-Z_][A-Z0-9_]*\s*=/m },
      { path: '/.env.production',   severity: 'fail', name: '.env.production',
        contentRe: /^[A-Z_][A-Z0-9_]*\s*=/m },
      { path: '/.git/HEAD',         severity: 'fail', name: '.git/HEAD',
        contentRe: /^ref:\s+refs\//m },
      { path: '/.git/config',       severity: 'fail', name: '.git/config',
        contentRe: /\[core\]|\[remote\s/i },
      { path: '/backup.sql',        severity: 'fail', name: 'backup.sql',
        contentRe: /(CREATE TABLE|INSERT INTO|PostgreSQL database dump)/i },
      { path: '/dump.sql',          severity: 'fail', name: 'dump.sql',
        contentRe: /(CREATE TABLE|INSERT INTO|PostgreSQL database dump)/i },
      { path: '/server-status',     severity: 'warn', name: 'server-status',
        contentRe: /Apache Server Status|Server Version:/i },
      { path: '/nginx_status',      severity: 'warn', name: 'nginx_status',
        contentRe: /Active connections:/i },
      { path: '/phpmyadmin/',       severity: 'warn', name: 'phpmyadmin',
        contentRe: /phpMyAdmin/i },
    ];

    const fails = [];
    const warnings = [];

    // 1. Pfad-Probes — auf SPA-Sites brauchen wir Inhalts-Match, sonst genügt Status 200 + non-HTML
    for (const p of exposedPaths) {
      const r = await probe(p.path, 'GET');
      if (r.status !== 200) continue;
      let realHit = false;
      if (isSpaCatchAll) {
        // Auf SPA: nur dann FAIL, wenn der Body wirklich nach erwartetem Inhalt aussieht
        if (r.body && p.contentRe.test(r.body)) realHit = true;
      } else {
        // Kein Catch-All: 200 mit non-HTML reicht
        if (!/text\/html/i.test(r.contentType)) realHit = true;
        else if (r.body && p.contentRe.test(r.body)) realHit = true;
      }
      if (realHit) {
        const entry = `${p.name} exposed`;
        if (p.severity === 'fail') fails.push(entry); else warnings.push(entry);
      }
    }

    // 2. Admin-Route — nur prüfen wenn KEIN SPA-Catch-All (sonst False-Positive garantiert)
    if (!isSpaCatchAll) {
      const adminProbe = await probe('/admin', 'GET');
      if (adminProbe.status === 200 && adminProbe.body) {
        const looksLikeLogin = /<input[^>]*type=["']password["']|<form[^>]*login|sign.?in|anmelden/i.test(adminProbe.body);
        if (!looksLikeLogin) warnings.push('/admin antwortet 200 ohne erkennbare Login-Form');
      }
    }

    // 3. Header-Hygiene auf "/" (1 GET)
    const root = await probe('/', 'GET');
    if (root.status === 0) {
      return WARN(`Hauptpfad nicht erreichbar — keine Header-Prüfung möglich (Probes: ${fails.length} fail, ${warnings.length} warn)`);
    }
    if (root.headers) {
      if (!root.headers.get('strict-transport-security')) warnings.push('HSTS-Header fehlt');
      if (!root.headers.get('x-content-type-options')) warnings.push('X-Content-Type-Options fehlt');
      const xfo = root.headers.get('x-frame-options');
      const csp = root.headers.get('content-security-policy') || '';
      if (!xfo && !/frame-ancestors/i.test(csp)) warnings.push('X-Frame-Options + frame-ancestors fehlen beide');
      const server = root.headers.get('server') || '';
      if (/\d/.test(server)) warnings.push(`Server-Header verrät Version: "${server}"`);
      if (root.headers.get('x-powered-by')) warnings.push(`X-Powered-By gesetzt: "${root.headers.get('x-powered-by')}"`);
    }

    const spaNote = isSpaCatchAll ? ' [SPA-Catch-All erkannt — Probes via Inhalts-Match]' : '';
    if (fails.length) return FAIL(`Critical exposed: ${fails.join('; ')}` + (warnings.length ? ` (+${warnings.length} warn)` : '') + spaNote);
    if (warnings.length) return WARN(warnings.join('; ') + spaNote);
    return PASS('keine Treffer in Probe + Header-Set vollständig' + spaNote);
  },
  '019-cert-dns': async (project) => {
    if (project.status !== 'live') return SKIP(`status=${project.status ?? 'null'}`);
    if (!project.domain) return SKIP('keine Domain');
    if (project.tags === 'internal' || project.tags === 'infra') return SKIP('internes/Infra-Projekt');
    if (OFFLINE) return SKIP('--local-only (Netzwerk übersprungen)');

    const issues = [];

    // 1. DNS A-Record
    let dnsIPs = [];
    try {
      dnsIPs = await Promise.race([
        dns.resolve4(project.domain),
        new Promise((_, rej) => setTimeout(() => rej(new Error('DNS-Timeout')), 5000)),
      ]);
    } catch (err) {
      return WARN(`DNS-Lookup fehlgeschlagen: ${(err.message || '').slice(0, 60)}`);
    }
    const ownIPs = dnsIPs.filter(ip => KNOWN_SERVER_IPS.has(ip));
    const foreignIPs = dnsIPs.filter(ip => !KNOWN_SERVER_IPS.has(ip));
    if (!ownIPs.length) {
      issues.push({ severity: 'warn', msg: `DNS zeigt nicht auf eigene Server: ${dnsIPs.join(', ')}` });
    } else if (foreignIPs.length) {
      issues.push({ severity: 'warn', msg: `DNS gemischt (eigene + fremd: ${foreignIPs.join(', ')})` });
    }

    // 2. TLS-Cert via tls.connect
    const cert = await new Promise((resolve) => {
      let settled = false;
      const finish = (v) => { if (!settled) { settled = true; resolve(v); } };
      const timer = setTimeout(() => finish({ error: 'TLS-Timeout (>5s)' }), 5000);
      let socket;
      try {
        socket = tls.connect({
          host: project.domain,
          port: 443,
          servername: project.domain,
          rejectUnauthorized: false, // Cert auch dann inspizieren wenn ungültig
          timeout: 5000,
        }, () => {
          const c = socket.getPeerCertificate(false);
          clearTimeout(timer);
          socket.end();
          finish({ cert: c, authorized: socket.authorized, authError: socket.authorizationError });
        });
        socket.on('error', (err) => {
          clearTimeout(timer);
          finish({ error: (err.code || err.message || '').toString().slice(0, 60) });
        });
      } catch (err) {
        clearTimeout(timer);
        finish({ error: (err.message || '').slice(0, 60) });
      }
    });

    if (cert.error) {
      return FAIL(`TLS-Handshake fehlgeschlagen: ${cert.error}`);
    }
    const c = cert.cert;
    if (!c || !c.valid_to) {
      return FAIL('TLS-Cert nicht lesbar');
    }

    // Restlaufzeit
    const expiresAt = new Date(c.valid_to).getTime();
    const daysLeft = Math.floor((expiresAt - Date.now()) / 86400000);
    if (daysLeft < 0) issues.push({ severity: 'fail', msg: `Cert abgelaufen vor ${Math.abs(daysLeft)}d (${c.valid_to})` });
    else if (daysLeft < 7) issues.push({ severity: 'fail', msg: `Cert läuft in ${daysLeft}d ab` });
    else if (daysLeft < 14) issues.push({ severity: 'warn', msg: `Cert läuft in ${daysLeft}d ab` });

    // Issuer
    const issuerOrg = c.issuer?.O || c.issuer?.CN || '(unbekannt)';
    if (!/let'?s encrypt/i.test(issuerOrg)) {
      issues.push({ severity: 'warn', msg: `Issuer "${issuerOrg}" — Standard 004 verlangt Let's Encrypt` });
    }

    // Subject / SAN
    const cn = c.subject?.CN || '';
    const san = (c.subjectaltname || '').toLowerCase();
    const matchesCN = cn === project.domain || (cn.startsWith('*.') && project.domain.endsWith(cn.slice(1)));
    const matchesSAN = san.split(',').map(s => s.trim().replace(/^dns:/, '')).some(d =>
      d === project.domain || (d.startsWith('*.') && project.domain.endsWith(d.slice(1))));
    if (!matchesCN && !matchesSAN) {
      issues.push({ severity: 'fail', msg: `Cert deckt ${project.domain} nicht ab (CN=${cn || '–'}, SAN=${san.slice(0, 60) || '–'})` });
    }

    if (issues.some(i => i.severity === 'fail')) {
      return FAIL(issues.filter(i => i.severity === 'fail').map(i => i.msg).join('; '));
    }
    if (issues.length) {
      return WARN(issues.map(i => i.msg).join('; '));
    }
    return PASS(`DNS=${dnsIPs.join(',')}, Cert ${daysLeft}d, ${issuerOrg}`);
  },
  '013-launch-gate': (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    if (project.status !== 'live') return SKIP(`status=${project.status ?? 'null'}`);
    const reviewPath = join(project.path_local, 'LAUNCH-REVIEW.md');
    const isInternal = project.tags === 'internal' || project.tags === 'infra';
    if (!existsSync(reviewPath)) {
      return isInternal ? WARN('LAUNCH-REVIEW.md fehlt (internes/Infra-Tool, Empfehlung)')
                        : FAIL('LAUNCH-REVIEW.md fehlt');
    }
    const text = readFileSync(reviewPath, 'utf8');
    const hasSignOff = /^##\s+Sign-Off/m.test(text);
    const hasResp = /Verantwortlich:\s*\S/i.test(text);
    if (!hasSignOff || !hasResp) {
      return isInternal ? WARN('LAUNCH-REVIEW.md ohne Sign-Off (internes Tool)')
                        : FAIL('LAUNCH-REVIEW.md ohne Sign-Off-Block + Verantwortlichen');
    }
    // Section J (Vibe-Coding-Lückenklassen) ist seit 2026-04-27 Pflicht
    const hasSectionJ = /^##\s+J\./m.test(text);
    if (!hasSectionJ) {
      return isInternal ? WARN('Section J (Vibe-Coding-Lückenklassen) fehlt — siehe checklists/013-launch-gate.md')
                        : FAIL('Section J (Vibe-Coding-Lückenklassen) fehlt — Pflicht seit 2026-04-27');
    }
    // Datum aus dem letzten Sign-Off-Header ziehen ("## Sign-Off — YYYY-MM-DD")
    const dateMatches = [...text.matchAll(/^##\s+Sign-Off[^\n]*?(\d{4}-\d{2}-\d{2})/gm)];
    if (!dateMatches.length) return WARN('Sign-Off ohne Datum (Format "## Sign-Off — YYYY-MM-DD")');
    const lastDate = dateMatches[dateMatches.length - 1][1];
    const ageDays = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000);
    if (ageDays > 365) return WARN(`Sign-Off älter als 12 Monate (${lastDate}, ${ageDays}d) — Re-Review fällig`);
    return PASS(`Sign-Off ${lastDate}`);
  },
  '012-footer': (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    if (project.tags === 'infra') return SKIP('Infra-Projekt');
    if (project.tags === 'internal') return SKIP('Internes Tool');
    // Footer-Komponente finden
    const footerFiles = [];
    for (const file of walkSource(project.path_local)) {
      const base = file.split(/[\\/]/).pop().toLowerCase();
      if (/^footer\.(tsx|jsx|svelte|astro|vue)$/.test(base) || /^globalfooter\./.test(base)) {
        footerFiles.push(file);
        if (footerFiles.length >= 3) break;
      }
    }
    if (!footerFiles.length) return WARN('keine Footer-Komponente gefunden');
    const text = footerFiles.map(f => { try { return readFileSync(f, 'utf8'); } catch { return ''; } }).join('\n');
    const checks = {
      impressum: /\/impressum\b/.test(text) || /\/imprint\b/.test(text),
      datenschutz: /\/datenschutz\b/.test(text) || /\/privacy\b/.test(text),
      year: /getFullYear\(\)|new Date\(\)/.test(text),
      attribution: /maxone\b/i.test(text),
    };
    const fails = Object.entries(checks).filter(([_, ok]) => !ok).map(([k]) => k);
    if (!fails.length) return PASS(`${footerFiles.length} Footer-Datei(en), alle Pflichten erfüllt`);
    return WARN(`Footer fehlt: ${fails.join(', ')}`);
  },
  '026-self-hosted-first': (project) => {
    if (!project.path_local) return SKIP('kein path_local');

    // 1. registry-Feld external_subscriptions:
    const allowedReasons = new Set(['payment-processor', 'domain-registrar', 'tls-ca', 'vps-hosting']);
    const subs = project.external_subscriptions;
    const subWarnings = [];
    if (subs === undefined) {
      subWarnings.push('external_subscriptions in registry fehlt');
    } else if (Array.isArray(subs)) {
      for (const s of subs) {
        if (!s.service || !s.reason) {
          subWarnings.push(`Eintrag ohne service/reason: ${JSON.stringify(s).slice(0, 60)}`);
        } else if (!allowedReasons.has(s.reason)) {
          subWarnings.push(`${s.service}: reason=${s.reason} (nicht im Whitelist-Set)`);
        }
      }
    }

    // 2. docker-compose-Scan
    const composeFile = project.compose_file ?? 'docker-compose.yml';
    const composePath = join(project.path_local, composeFile);
    const saasImageMarkers = [
      /image:\s*\S*docker\.elastic\.co/i,
      /image:\s*\S*datadoghq\.com/i,
      /image:\s*\S*\bcloud-only\b/i,
    ];
    const composeHits = [];
    if (existsSync(composePath)) {
      const text = readFileSync(composePath, 'utf8');
      for (const re of saasImageMarkers) {
        const m = text.match(re);
        if (m) composeHits.push(m[0].slice(0, 60));
      }
    }

    // 3. package.json-Scan
    const pkgPath = join(project.path_local, 'package.json');
    const cloudOnlySdks = [
      '@datadog/',
      'newrelic',
      '@sentry/cloud-only',
      'firebase-admin',
      '@vercel/analytics',
      '@netlify/functions',
    ];
    const pkgHits = [];
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
        for (const name of Object.keys(deps)) {
          for (const m of cloudOnlySdks) {
            if (name === m || name.startsWith(m)) pkgHits.push(name);
          }
        }
      } catch { /* malformed package.json — ignorieren */ }
    }

    if (composeHits.length) return FAIL(`SaaS-Image in compose: ${composeHits.join('; ')}`);
    const allWarnings = [...subWarnings];
    if (pkgHits.length) allWarnings.push(`Cloud-only SDK(s): ${pkgHits.join(', ')}`);
    if (allWarnings.length) return WARN(allWarnings.join('; '));
    return PASS('keine Abo-/SaaS-Marker, external_subscriptions sauber');
  },
  '041-avv-dpa-registry': (project) => {
    if (!['live', 'dev'].includes(project.status)) return SKIP(`status=${project.status ?? 'null'}`);
    const tags = Array.isArray(project.tags) ? project.tags : [project.tags].filter(Boolean);
    const lowRisk = tags.includes('internal') || tags.includes('infra');
    const customerFacing = Boolean(project.domain) && !lowRisk;
    const processors = project.data_processors;

    if (processors === undefined) {
      return WARN('data_processors fehlt in registry/projects.yml (Standard 041)');
    }
    if (!Array.isArray(processors)) {
      return WARN('data_processors ist kein Array');
    }
    if (processors.length === 0) {
      if (customerFacing) return WARN('data_processors leer bei Domain-Projekt — explizit pruefen, ob wirklich kein Auftragsverarbeiter existiert');
      return PASS('data_processors leer dokumentiert');
    }

    const allowedStatus = new Set(['signed', 'account-enabled', 'standard-terms', 'not-required', 'missing', 'unknown']);
    const requiredFields = ['service', 'purpose', 'personal_data', 'region', 'avv_status', 'evidence', 'reviewed_at'];
    const warnings = [];
    const failures = [];
    const now = Date.now();

    for (const [idx, p] of processors.entries()) {
      const label = p?.service || `Eintrag #${idx + 1}`;
      for (const field of requiredFields) {
        if (!p || p[field] === undefined || p[field] === null || String(p[field]).trim() === '') {
          warnings.push(`${label}: ${field} fehlt`);
        }
      }
      if (!p?.avv_status) continue;
      if (!allowedStatus.has(p.avv_status)) {
        warnings.push(`${label}: unbekannter avv_status=${p.avv_status}`);
      }
      if (['missing', 'unknown'].includes(p.avv_status) && project.status === 'live') {
        failures.push(`${label}: avv_status=${p.avv_status}`);
      }
      if (p.reviewed_at) {
        const reviewedAt = new Date(p.reviewed_at).getTime();
        if (Number.isNaN(reviewedAt)) {
          warnings.push(`${label}: reviewed_at unlesbar (${p.reviewed_at})`);
        } else {
          const ageDays = Math.floor((now - reviewedAt) / 86400000);
          if (ageDays > 365) warnings.push(`${label}: AVV-Pruefung aelter als 12 Monate (${p.reviewed_at})`);
        }
      }
    }

    if (failures.length) return FAIL(failures.join('; '));
    if (warnings.length) return WARN(warnings.slice(0, 8).join('; '));
    return PASS(`${processors.length} Auftragsverarbeiter dokumentiert`);
  },
  '038-cross-project-broadcast': (project) => {
    const broadcastsDir = join(ROOT, 'broadcasts');
    if (!existsSync(broadcastsDir)) return WARN('broadcasts/-Verzeichnis fehlt in maxone-standards');

    let files;
    try { files = readdirSync(broadcastsDir).filter(f => /^BCAST-.*\.md$/i.test(f)); }
    catch { return WARN('broadcasts/-Verzeichnis nicht lesbar'); }

    if (files.length === 0) return PASS('keine Broadcasts vorhanden');

    const today = new Date();
    const failures = [];
    const warnings = [];

    for (const file of files) {
      const filePath = join(broadcastsDir, file);
      let content;
      try { content = readFileSync(filePath, 'utf8'); } catch { continue; }

      // Status: nur open-Broadcasts prüfen
      const statusMatch = content.match(/\*\*Status:\*\*\s*(open|closed)/i);
      if (!statusMatch || statusMatch[1].toLowerCase() !== 'open') continue;

      // Datum aus Dateiname: BCAST-YYYY-MM-DD-...
      const dateMatch = file.match(/BCAST-(\d{4}-\d{2}-\d{2})/i);
      const broadcastDate = dateMatch ? new Date(dateMatch[1]) : null;
      const ageDays = broadcastDate ? Math.floor((today - broadcastDate) / 86400000) : null;

      // Betroffene-Projekte-Tabelle parsen: Zeilen mit | projektname | status |
      const tableSection = content.match(/## Betroffene Projekte([\s\S]*?)##/i);
      if (!tableSection) continue;
      const tableText = tableSection[1];

      // Tabellenzeilen: | name | status | ... |
      const rowRegex = /\|\s*([^|]+?)\s*\|\s*(open|resolved)\s*\|/gi;
      let rowMatch;
      let projectFound = false;
      let projectStatus = null;

      while ((rowMatch = rowRegex.exec(tableText)) !== null) {
        const rowName = rowMatch[1].trim().toLowerCase();
        const rowStatus = rowMatch[2].trim().toLowerCase();
        if (rowName === project.name.toLowerCase()) {
          projectFound = true;
          projectStatus = rowStatus;
          break;
        }
      }

      if (!projectFound) continue;
      if (projectStatus === 'resolved') continue;

      // Projekt ist open in diesem Broadcast
      const label = file.replace('.md', '');
      if (ageDays !== null && ageDays > 30) {
        failures.push(`${label}: überfällig (${ageDays} Tage) — Fix fehlt`);
        continue;
      }

      // Audit-Grep-Pattern prüfen
      const failGrepMatch = content.match(/\*\*Fail-Grep:\*\*\s*`([^`]+)`/i);
      const filePatternMatch = content.match(/\*\*Datei-Pattern:\*\*\s*`([^`]+)`/i);

      if (failGrepMatch && filePatternMatch && project.path_local && existsSync(project.path_local)) {
        const failPattern = failGrepMatch[1];
        const fileGlob = filePatternMatch[1].replace(/\*\*/g, '').replace(/\//g, '/');
        try {
          const grepResult = execFileSync('grep', ['-rl', '--include=*.ts', '--include=*.tsx', '--include=*.js',
            failPattern, project.path_local], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
          if (grepResult) {
            failures.push(`${label}: Fail-Grep-Pattern trifft (${failPattern})`);
            continue;
          }
        } catch { /* keine Treffer oder grep nicht verfügbar */ }
      }

      failures.push(`${label}: offener Broadcast — Fix für ${project.name} fehlt`);
    }

    if (failures.length) return FAIL(failures.join('; '));
    if (warnings.length) return WARN(warnings.join('; '));
    return PASS(`${files.length} Broadcast(s) geprüft — kein offener Eintrag für ${project.name}`);
  },
  '025-llm-app-spezial': (project) => {
    if (!project.path_local || !existsSync(project.path_local)) return SKIP('kein path_local');

    // Detect: ist das eine LLM-App?
    const tags = project.tags ?? '';
    const tagStr = Array.isArray(tags) ? tags.join(' ') : String(tags);
    const isTagged = /llm-app|llm|agent/i.test(tagStr);

    const llmMarkers = [
      /@anthropic-ai\/sdk/,
      /openai/i,
      /langchain/i,
      /llamaindex/i,
      /ollama/i,
      /messages\.create\s*\(/,
      /claude\s+-p\s/,
      /CLAUDE_CODE_OAUTH_TOKEN/,
    ];
    const codeFiles = [];
    function scan(dir, depth) {
      if (depth > 4) return;
      let entries;
      try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const full = join(dir, e.name);
        if (e.isDirectory()) {
          if (/(node_modules|\.next|\.svelte-kit|dist|build|\.git|\.claude|coverage|audits|\.venv)/.test(e.name)) continue;
          scan(full, depth + 1);
        } else if (/\.(js|ts|tsx|jsx|mjs|py)$/i.test(e.name)) {
          codeFiles.push(full);
          if (codeFiles.length > 700) return;
        } else if (/package\.json$/.test(e.name) || /requirements.*\.txt$/.test(e.name)) {
          codeFiles.push(full);
        }
      }
    }
    scan(project.path_local, 0);
    const sample = codeFiles.slice(0, 700).map(f => {
      try { return readFileSync(f, 'utf8'); } catch { return ''; }
    }).join('\n');
    const hasLlmMarker = llmMarkers.some(re => re.test(sample));

    if (!isTagged && !hasLlmMarker) return SKIP('keine LLM-App (weder Tag noch Code-Marker)');

    const findings = [];
    let critical = false;

    // System-Prompt-Härtung
    const promptHardening = {
      dataNotInstructions: /(daten,?\s+nicht\s+(als\s+)?instruktionen|data,?\s+not\s+instructions|treat\s+.*\s+as\s+data)/i.test(sample),
      noPromptLeak: /(niemals\s+(diesen?\s+)?system[- ]prompt|never\s+(reveal|disclose|share)\s+.*system\s+prompt|don'?t\s+(reveal|leak)\s+.*prompt)/i.test(sample),
      suspiciousAbort: /(verdächtig(e|er)?\s+instruktion|suspicious\s+instruction|abort\s+and\s+(report|notify))/i.test(sample),
    };
    const missingHardening = Object.entries(promptHardening).filter(([_, ok]) => !ok).map(([k]) => k);
    if (missingHardening.length === 3) { findings.push('System-Prompt-Härtung komplett fehlt'); critical = true; }
    else if (missingHardening.length) findings.push(`Härtung fehlt: ${missingHardening.join(', ')}`);

    // Approval-Queue-Marker bei Schreib-Tools
    const writeToolMarkers = /(db_write|send_email|delete_\w+|payment_\w+|drop_table|truncate_)/i.test(sample);
    const queueMarkers = /(ops_tasks|approval_queue|pending_approval|approval_required)/i.test(sample);
    if (writeToolMarkers && !queueMarkers) { findings.push('Schreib-Tool ohne Approval-Queue-Pattern'); critical = true; }

    // Tool-Use-Schema (best-effort)
    const hasToolDef = /tools\s*[=:]\s*\[/.test(sample);
    const hasInputSchema = /input_schema|inputSchema|parameters\s*:\s*\{/.test(sample);
    if (hasToolDef && !hasInputSchema) findings.push('Tool-Use ohne JSON-Schema');

    // Test-Suite-Existenz
    const hasInjectionTests = codeFiles.some(f => /llm[-_]?injection|prompt[-_]?injection/i.test(f));
    if (!hasInjectionTests) findings.push('keine LLM-Injection-Test-Suite');

    // Logging-Marker (INFO, kein WARN)
    const hasLogging = /(llm_calls|llm_log|prompt_hash)/i.test(sample);
    const infoNotes = [];
    if (!hasLogging) infoNotes.push('LLM-Logging-Tabelle nicht erkannt');

    if (critical) return FAIL(findings.join('; '));
    if (findings.length) return WARN(findings.join('; ') + (infoNotes.length ? ` (info: ${infoNotes.join(', ')})` : ''));
    if (infoNotes.length) return PASS('Härtung + Tests vorhanden ' + `(info: ${infoNotes.join(', ')})`);
    return PASS('Härtung + Tools-Schema + Tests + Logging vollständig');
  },
  // Standard 029 — Indirect-Prompt-Injection-Test: gilt für LLM-Apps,
  // die externe Inhalte ingestieren (Telegram, Email-Inbound, RAG,
  // Web-Scraping, File-Upload + LLM). Pflicht: Test-Suite mit ≥10
  // Indirect-Injection-Payloads, mind. 1 Quelle dokumentiert.
  '029-indirect-prompt-injection-test': (project) => {
    if (!project.path_local || !existsSync(project.path_local)) return SKIP('kein path_local');

    const tags = project.tags ?? '';
    const tagStr = Array.isArray(tags) ? tags.join(' ') : String(tags);
    const isTagged = /llm-app|llm|agent/i.test(tagStr);

    const llmMarkers = [
      /@anthropic-ai\/sdk/, /openai/i, /langchain/i, /llamaindex/i, /ollama/i,
      /messages\.create\s*\(/, /claude\s+-p\s/, /CLAUDE_CODE_OAUTH_TOKEN/,
    ];
    const ingestionMarkers = [
      // Telegram
      /telegraf|grammy|node-telegram-bot-api/i,
      /bot\.on\s*\(\s*['"`]\s*(message|text)/i,
      // Email-Inbound
      /\bimap\b|jmap-client|mail-listener|brevo.*inbound/i,
      // RAG / Vector-Search
      /pgvector|@supabase\/vector|vector\s+similarity|embeddings?\.create|cosine_similarity/i,
      // Web-Scraping (nur wenn LLM-Marker im selben Repo)
      /\bcheerio\b|puppeteer|playwright/i,
      // File-Upload + LLM-Vision
      /multer|formidable|formData.*\.append.*image|vision.*\.create/i,
    ];

    const codeFiles = [];
    const testFiles = [];
    function scan(dir, depth) {
      if (depth > 5) return;
      let entries;
      try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const full = join(dir, e.name);
        if (e.isDirectory()) {
          if (/(node_modules|\.next|\.svelte-kit|dist|build|\.git|coverage|audits|\.venv|__pycache__)/.test(e.name)) continue;
          scan(full, depth + 1);
        } else if (/\.(js|ts|tsx|jsx|mjs|cjs|py)$/i.test(e.name)) {
          codeFiles.push(full);
          if (/indirect[-_]?injection|prompt[-_]?injection/i.test(e.name)) testFiles.push(full);
          if (codeFiles.length > 700) return;
        } else if (/package\.json$/.test(e.name) || /requirements.*\.txt$/.test(e.name) || /promptfooconfig\.ya?ml$/i.test(e.name)) {
          codeFiles.push(full);
          if (/promptfooconfig\.ya?ml$/i.test(e.name)) testFiles.push(full);
        }
      }
    }
    scan(project.path_local, 0);
    const sample = codeFiles.slice(0, 700).map(f => {
      try { return readFileSync(f, 'utf8'); } catch { return ''; }
    }).join('\n');

    const hasLlmMarker = llmMarkers.some(re => re.test(sample));
    if (!isTagged && !hasLlmMarker) return SKIP('keine LLM-App (weder Tag noch Code-Marker)');

    const hasIngestion = ingestionMarkers.some(re => re.test(sample));
    if (!hasIngestion) return SKIP('LLM-App ohne externe Content-Ingestion (kein Telegram/Email/RAG/Web/Upload-Marker)');

    // Promptfoo-Äquivalent
    const promptfooFile = testFiles.find(f => /promptfooconfig\.ya?ml$/i.test(f));
    if (promptfooFile) {
      let pf;
      try { pf = readFileSync(promptfooFile, 'utf8'); } catch { pf = ''; }
      if (/strategies\s*:[\s\S]*indirect[-_]?prompt[-_]?injection/i.test(pf)) {
        return PASS(`promptfooconfig.yaml mit indirect-prompt-injection-Strategie`);
      }
    }

    // Test-Datei suchen (Pfad-Filter, kein promptfoo)
    const injectionTestFiles = testFiles.filter(f => !/promptfooconfig/i.test(f));

    // Opt-Out-Marker
    for (const f of injectionTestFiles.length ? injectionTestFiles : codeFiles.slice(0, 200)) {
      let txt;
      try { txt = readFileSync(f, 'utf8'); } catch { continue; }
      if (/\/\/\s*audit:\s*no-external-content|#\s*audit:\s*no-external-content/i.test(txt)) {
        return SKIP(`# audit: no-external-content in ${f.slice(project.path_local.length + 1).replace(/\\/g, '/')}`);
      }
    }

    if (injectionTestFiles.length === 0) {
      return FAIL('LLM-App mit External-Ingestion, aber keine Indirect-Injection-Test-Datei (tests/indirect-injection.* oder promptfoo)');
    }

    // Payload-Count + Quellen-Check
    let totalPayloads = 0;
    const sources = new Set();
    for (const f of injectionTestFiles) {
      let txt;
      try { txt = readFileSync(f, 'utf8'); } catch { continue; }
      // Test-Cases zählen
      const testCases = (txt.match(/\b(test|it)\s*\(/g) ?? []).length
                      + (txt.match(/\bdef\s+test_/g) ?? []).length;
      // Payload-Array-Einträge zählen (Heuristik: Objekte mit content/payload-Property)
      const payloadObjs = (txt.match(/\{\s*[^{}]*?(content|payload|input|prompt)\s*:/g) ?? []).length;
      totalPayloads += Math.max(testCases, payloadObjs);
      // Quellen-Marker
      for (const src of ['greshake', 'giskard', 'garak', 'owasp', 'promptfoo']) {
        if (new RegExp(src, 'i').test(txt)) sources.add(src);
      }
    }

    if (totalPayloads === 0) return FAIL(`Test-Datei vorhanden, aber 0 Payloads erkannt (${injectionTestFiles.length} Datei(en))`);
    const sourcesList = sources.size ? `Quellen: ${[...sources].join(', ')}` : 'KEINE Quelle dokumentiert';

    if (totalPayloads < 10) {
      return WARN(`nur ${totalPayloads} Payloads (< 10 Pflicht), ${sourcesList}`);
    }
    if (sources.size === 0) {
      return WARN(`${totalPayloads} Payloads, aber keine Quellen-Marker (greshake/giskard/garak/owasp/promptfoo)`);
    }
    return PASS(`${totalPayloads} Payloads, ${sourcesList}`);
  },
  // Standard 030 — Mail-Architektur (Outbound=Brevo, Inbound+Sent=Stalwart).
  // Destillat der ZENTINEL-STALWART-BIBEL (20 Regeln aus 4 Vorfällen).
  // Greift nur Projekte mit Mail-Markern; alle anderen SKIP.
  '030-mail-architecture': (project) => {
    if (!project.path_local || !existsSync(project.path_local)) return SKIP('kein path_local');

    // 1. Mail-Marker einsammeln
    const mailFiles = [];
    const edgeFunctionFiles = [];
    function scan(dir, depth) {
      if (depth > 6) return;
      let entries;
      try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const full = join(dir, e.name);
        if (e.isDirectory()) {
          if (/(node_modules|\.next|\.svelte-kit|dist|build|\.git|coverage|audits|\.venv|__pycache__)/.test(e.name)) continue;
          scan(full, depth + 1);
        } else if (/\.(js|ts|tsx|jsx|mjs|cjs|py|sql)$/i.test(e.name)) {
          mailFiles.push(full);
          // Edge-Function-Heuristik: liegt unter supabase/functions/ oder functions/
          if (/[\\/](supabase[\\/])?functions[\\/].+\.(ts|js|mjs)$/i.test(full)) {
            edgeFunctionFiles.push(full);
          }
          if (mailFiles.length > 800) return;
        }
      }
    }
    scan(project.path_local, 0);

    const mailMarkerRe = /api\.brevo\.com|\/jmap\/(session|upload)|stalwart-mail:8080|email-client[\\/]|smtp-relay\.brevo\.com|nodemailer.*createTransport/i;

    const sample = mailFiles.slice(0, 800).map(f => {
      try { return { path: f, txt: readFileSync(f, 'utf8') }; } catch { return { path: f, txt: '' }; }
    });
    const matched = sample.filter(s => mailMarkerRe.test(s.txt));
    if (matched.length === 0) return SKIP('kein Mail-Code (kein Brevo/JMAP/Stalwart-Marker)');

    const findings = [];
    let critical = false;

    // Aggregierter Code-Text (für nachfolgende Patterns)
    const allTxt = matched.map(s => s.txt).join('\n');
    const edgeTxt = edgeFunctionFiles
      .map(f => sample.find(s => s.path === f)?.txt ?? '')
      .join('\n');

    // 2. Regel 20 — Pre-Flight Brevo-Domain-Auth Pflicht wenn Brevo-Send vorhanden
    const hasBrevoSend = /api\.brevo\.com\/v3\/smtp\/email/i.test(allTxt);
    if (hasBrevoSend) {
      const hasPreFlight = /ensureBrevoDomainAuthenticated|\[regel20\]|\/v3\/senders\/domains/i.test(allTxt);
      if (!hasPreFlight) {
        findings.push('Regel 20 verletzt — Brevo-Send ohne Domain-Pre-Flight (Vorfall 2026-04-10: 1 Mail still verloren)');
        critical = true;
      }
    }

    // 3. Regel 19 — uploadUrl darf {accountId}-Template nicht weg-strippen
    if (/uploadUrl\s*\.\s*split\s*\(\s*['"`]\{/.test(allTxt)) {
      findings.push('Regel 19 verletzt — uploadUrl.split("{") strippt {accountId}-Template (Sent-Blackhole-Risiko)');
      critical = true;
    }

    // 4. Regel 4 — Health-Check ohne Fake-Auth gegen Stalwart
    if (/Basic[\s'"`+]+.{0,30}healthcheck/i.test(allTxt)
        || /btoa\s*\(\s*['"`]healthcheck:[^'"`]+['"`]\s*\)/i.test(allTxt)) {
      findings.push('Regel 4 verletzt — Health-Check mit Fake-Auth-Header (Self-Ban nach 2 Calls, Vorfall 2026-04-05)');
      critical = true;
    }

    // Helper: testet Pattern nur in Code-Zeilen (ignoriert // …, /* … */, # …,
    // und Strings, die nach Kommentar-Markern stehen). Vermeidet False-Positives
    // wenn die Bibel-Lehren oder Hint-Strings die Anti-Patterns *erwähnen*.
    function matchInCode(text, regex) {
      const lines = text.split('\n');
      let inBlockComment = false;
      for (const lineRaw of lines) {
        let line = lineRaw;
        if (inBlockComment) {
          const end = line.indexOf('*/');
          if (end === -1) continue;
          line = line.slice(end + 2);
          inBlockComment = false;
        }
        // Block-Kommentar Start
        const blockStart = line.indexOf('/*');
        if (blockStart !== -1) {
          const blockEnd = line.indexOf('*/', blockStart + 2);
          if (blockEnd === -1) {
            line = line.slice(0, blockStart);
            inBlockComment = true;
          } else {
            line = line.slice(0, blockStart) + line.slice(blockEnd + 2);
          }
        }
        // Line-Kommentare (// und #) — alles ab Marker abschneiden
        const lineCommentIdx = line.search(/(^|\s)\/\//);
        if (lineCommentIdx !== -1) line = line.slice(0, lineCommentIdx);
        const hashIdx = line.search(/(^|\s)#(?!!)/);
        if (hashIdx !== -1) line = line.slice(0, hashIdx);
        if (regex.test(line)) return true;
      }
      return false;
    }

    // 5. Regel 14 — /.well-known/jmap statt /jmap/session — nur flaggen wenn
    //    die URL als HTTP-Request-Ziel benutzt wird (fetch/axios/got/URL),
    //    nicht wenn sie nur als Hint-String/Doc-Kommentar erwähnt wird.
    const wellKnownAsRequest =
      /\b(fetch|axios\.[a-z]+|got\.[a-z]+|new\s+URL|new\s+Request)\s*\([^)]*\.well-known\/jmap/i;
    if (matchInCode(edgeTxt || allTxt, wellKnownAsRequest)) {
      findings.push('Regel 14 verletzt — /.well-known/jmap (307-Redirect) als Request-Ziel, /jmap/session direkt nutzen');
    }

    // 6. Regel 15 — Edge-Functions sollten internen Hostname nutzen — gleiche
    //    Logik: nur wenn Public-URL als Request-Ziel auftaucht
    const publicHostAsRequest =
      /\b(fetch|axios\.[a-z]+|got\.[a-z]+|new\s+URL|new\s+Request)\s*\([^)]*https?:\/\/mail\.maxone\.(one|studio)/i;
    if (edgeTxt && matchInCode(edgeTxt, publicHostAsRequest)) {
      findings.push('Regel 15 verletzt — Edge-Function fetcht Public-URL mail.maxone.* statt stalwart-mail:8080');
    }

    // 7. DB-Status — wenn sent_emails-Schema existiert, muss rejected_unauthenticated_domain
    //    als möglicher Status vorkommen (Brevo-Bounce-Watchdog-Hook)
    const schemaSamples = sample.filter(s => /sent_emails|email_accounts/i.test(s.txt));
    if (hasBrevoSend && schemaSamples.length) {
      const allSchema = schemaSamples.map(s => s.txt).join('\n');
      if (!/rejected_unauthenticated_domain/i.test(allSchema)) {
        findings.push('DB-Status `rejected_unauthenticated_domain` fehlt im sent_emails-Schema (Brevo-Bounce-Watchdog-Hook)');
      }
    }

    if (critical) return FAIL(findings.join('; '));
    if (findings.length) return WARN(findings.join('; '));
    return PASS(`Mail-Architektur konform (${matched.length} Mail-Datei(en) geprüft, Pre-Flight+Regel-19+4+14+15 OK)`);
  },
  // Standard 031 — Routine-Platform: keine wiederkehrenden Routinen auf
  // User-NUC / IDE / Claude-Sitzung. Pflicht-Plattformen: GH-Actions
  // schedule, systemd-Timer, pg_cron, VECTOR. Verboten: Register-
  // ScheduledTask, schtasks, WSL-crontab als Setup-Schritt.
  '031-routine-platform': (project) => {
    if (!project.path_local || !existsSync(project.path_local)) return SKIP('kein path_local');

    // Heartbeat-Marker (positiv)
    const heartbeats = [];
    // 1. .github/workflows/*.yml mit schedule:
    const ghWorkflowDir = join(project.path_local, '.github', 'workflows');
    if (existsSync(ghWorkflowDir)) {
      try {
        for (const f of readdirSync(ghWorkflowDir)) {
          if (!/\.ya?ml$/i.test(f)) continue;
          let txt;
          try { txt = readFileSync(join(ghWorkflowDir, f), 'utf8'); } catch { continue; }
          if (/^\s*schedule\s*:/m.test(txt) || /\bcron\s*:\s*['"]/.test(txt)) {
            heartbeats.push(`gh-actions:${f}`);
          }
        }
      } catch { /* skip */ }
    }

    // 2. systemd-Timer / -Service oder pg_cron / VECTOR-Marker im Repo
    const routineCodeMarkers = [
      { label: 'systemd-timer',     re: /\.timer\b/ },
      { label: 'systemd-service',   re: /systemd[\\/].*\.service/i },
      { label: 'pg_cron',           re: /\bpg_cron\b|cron\.schedule\s*\(/ },
      { label: 'vector-agent',      re: /vector-blue|vector-green|\/opt\/vector|ops_tasks/i },
      { label: 'maxone-watchdog',   re: /brevo-bounce-watchdog|zentinel-watchdog|zync-healthcheck/i },
    ];

    const codeFiles = [];
    function scan(dir, depth) {
      if (depth > 4) return;
      let entries;
      try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const full = join(dir, e.name);
        if (e.isDirectory()) {
          if (/(node_modules|\.next|\.svelte-kit|dist|build|\.git|coverage|\.venv|__pycache__)/.test(e.name)) continue;
          scan(full, depth + 1);
        } else if (/\.(md|ya?ml|sh|sql|service|timer|js|ts|mjs|py)$/i.test(e.name)
                   && !/[\\/]audits[\\/]issues-/.test(full)) {
          codeFiles.push(full);
          if (codeFiles.length > 800) return;
        } else if (/\.(cmd|bat|ps1)$/i.test(e.name)) {
          codeFiles.push(full);
        }
      }
    }
    scan(project.path_local, 0);

    const sample = codeFiles.slice(0, 800).map(f => {
      try { return { path: f, txt: readFileSync(f, 'utf8') }; } catch { return { path: f, txt: '' }; }
    });
    const aggregated = sample.map(s => s.txt).join('\n');

    for (const m of routineCodeMarkers) {
      if (m.re.test(aggregated)) heartbeats.push(m.label);
    }

    // IDE-/User-Trigger-Marker (negativ)
    const ideFails = [];
    const ideWarns = [];

    // FAIL-Marker: Register-ScheduledTask / schtasks /create / wsl crontab
    if (/Register-ScheduledTask\b/i.test(aggregated)) {
      ideFails.push('Register-ScheduledTask in Doku/Skript (User-NUC-Trigger)');
    }
    if (/\bschtasks\s+\/create\b/i.test(aggregated)) {
      ideFails.push('schtasks /create (User-NUC-Trigger)');
    }
    if (/\bwsl\s+crontab\b/i.test(aggregated)) {
      ideFails.push('wsl crontab als Setup-Schritt (NUC-/WSL-abhängig)');
    }

    // WARN-Marker: *.cmd/*.bat/*.ps1 mit cron-/audit-/backup-Pattern
    const ideTriggerFiles = sample.filter(s =>
      /\.(cmd|bat|ps1)$/i.test(s.path)
      && /(audit|scheduled|cron|backup)/i.test(s.path),
    );
    for (const f of ideTriggerFiles) {
      const rel = f.path.slice(project.path_local.length + 1).replace(/\\/g, '/');
      ideWarns.push(`${rel} (Manueller Doppelklick statt Heartbeat)`);
    }

    // WARN-Marker: /schedule … alle X Tage / wöchentlich in Doku
    if (/\/schedule\b[^\n]*?\b(alle|every)\s+\d+\s*(tage|days|wochen|weeks|monate|months)/i.test(aggregated)
        || /\/schedule\b[^\n]*?\b(daily|weekly|monthly|wöchentlich|täglich|monatlich)\b/i.test(aggregated)) {
      ideWarns.push('Claude /schedule mit wiederkehrender Cadence als alleinige Trigger-Quelle (Doku-Hinweis)');
    }

    // Klassifikation
    const hasRoutine = heartbeats.length > 0 || ideFails.length > 0 || ideWarns.length > 0;
    if (!hasRoutine) return SKIP('keine wiederkehrende Routine erkannt');

    if (ideFails.length && !heartbeats.length) {
      return FAIL(`Routine läuft auf User-Maschine: ${ideFails.join('; ')} — auf GH Actions / systemd / VECTOR migrieren`);
    }
    if ((ideFails.length || ideWarns.length) && heartbeats.length) {
      return WARN(`IDE-Trigger-Reste neben Heartbeat (${heartbeats.length} HB): ${[...ideFails, ...ideWarns].join('; ')} — alten Pfad entfernen`);
    }
    if (ideWarns.length && !heartbeats.length) {
      return WARN(`Wahrscheinlich IDE-/User-getriggert (${ideWarns.join('; ')}) — Heartbeat-Plattform fehlt`);
    }
    // heartbeats.length > 0 && keine ide-Marker
    return PASS(`Heartbeat-Plattform vorhanden: ${heartbeats.slice(0, 3).join(', ')}${heartbeats.length > 3 ? ` (+${heartbeats.length - 3})` : ''}`);
  },
  // Standard 032 — Supabase SSR Auth Middleware-Matcher umfasst alle Routes.
  // Selektive Matcher (z.B. nur /dashboard, /admin) lassen Sessions nach
  // ~1h Idle oder bei Deploys still sterben, weil die Middleware der einzige
  // Ort ist, an dem refreshte Auth-Cookies geschrieben werden.
  '032-ssr-auth': (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    if (!existsSync(project.path_local)) return SKIP('Pfad fehlt lokal');
    const pkgPath = join(project.path_local, 'package.json');
    if (!existsSync(pkgPath)) return SKIP('keine package.json');
    let pkg;
    try { pkg = JSON.parse(readFileSync(pkgPath, 'utf8')); }
    catch { return WARN('package.json nicht parsebar'); }
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    if (!deps['@supabase/ssr']) return SKIP('kein @supabase/ssr');
    if (!deps['next']) return SKIP('kein Next.js (Regel gilt nur für Next App Router)');
    // Next.js 16 renamed middleware.ts → proxy.ts; both work depending on the
    // installed Next version. Either is acceptable for Standard 032.
    const candidates = [
      join(project.path_local, 'proxy.ts'),
      join(project.path_local, 'src', 'proxy.ts'),
      join(project.path_local, 'src', 'middleware.ts'),
      join(project.path_local, 'middleware.ts'),
      join(project.path_local, 'src', 'middleware.js'),
      join(project.path_local, 'middleware.js'),
    ];
    const file = candidates.find(p => existsSync(p));
    if (!file) return FAIL('keine middleware.ts/proxy.ts — Refresh-Cookies werden nirgends geschrieben');
    let text = readFileSync(file, 'utf8');
    // Many projects extract the cookie/getUser logic into lib/supabase/middleware.ts
    // and just call updateSession(request) from the entry middleware. Concatenate
    // those helper files so the auth.getUser() check sees them too.
    for (const helper of [
      join(project.path_local, 'lib', 'supabase', 'middleware.ts'),
      join(project.path_local, 'src', 'lib', 'supabase', 'middleware.ts'),
      join(project.path_local, 'utils', 'supabase', 'middleware.ts'),
      join(project.path_local, 'src', 'utils', 'supabase', 'middleware.ts'),
    ]) {
      if (existsSync(helper)) text += '\n' + readFileSync(helper, 'utf8');
    }
    const broadMatcher = /\(\?\!_next\/static/.test(text);
    const hasGetUser = /auth\.getUser\(\)/.test(text);
    const rel = file.slice(project.path_local.length + 1).replace(/\\/g, '/');
    if (!broadMatcher) return FAIL(`${rel}: Matcher nicht broad (Negative-Lookahead fehlt) — Sessions verlieren bei Deploys`);
    if (!hasGetUser) return WARN(`${rel}: kein auth.getUser()-Call gefunden (Token wird nicht refreshed)`);
    return PASS(`${rel}: broad matcher + auth.getUser()`);
  },
  '024-code-health-budget': (project) => {
    if (project.status !== 'live') return SKIP(`status=${project.status ?? 'null'}`);
    if (project.code_health === 'exempt') return SKIP('code_health=exempt');
    if (!project.path_local || !existsSync(project.path_local)) return SKIP('kein path_local');

    const findings = [];
    let critical = false;

    // 1. Refactoring-Anteil letztes Quartal
    try {
      const since = '3 months ago';
      const total = execFileSync('git', ['log', `--since=${since}`, '--pretty=format:%s'], {
        cwd: project.path_local, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
      }).trim().split('\n').filter(Boolean);
      const refactor = total.filter(s => /^(refactor|test|chore.*rename)(\(|:)/i.test(s));
      if (total.length >= 5) {
        const pct = Math.round((refactor.length / total.length) * 100);
        if (pct < 8) { findings.push(`Refactor-Anteil ${pct}% (< 8%)`); critical = true; }
        else if (pct < 15) findings.push(`Refactor-Anteil ${pct}% (< 15%)`);
      }
    } catch { /* nicht-Git oder leer — überspringen */ }

    // 2. Datei-Längen-Scan
    const scanDirs = ['src', 'lib', 'app', 'pages', 'routes'].map(d => join(project.path_local, d)).filter(existsSync);
    const roots = scanDirs.length ? scanDirs : [project.path_local];
    const ignoreDir = /(^|[\\/])(node_modules|\.next|\.svelte-kit|dist|build|\.git|coverage|audits|\.venv|__pycache__|vendor|third[-_]party|generated)([\\/]|$)/;
    const codeExt = /\.(js|jsx|ts|tsx|mjs|cjs|svelte|vue|py)$/i;
    const ignoreFile = /(^|[\\/])(supabase[\\/]types\.ts|database\.types\.ts|generated\.ts|handlebars(\.min)?\.js|typeahead.*\.js|jquery.*\.js|bootstrap.*\.js)$/i;
    const longFiles = [];
    const veryLongFiles = [];
    function walk(dir) {
      let entries;
      try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const full = join(dir, e.name);
        if (e.isDirectory()) {
          if (ignoreDir.test(full)) continue;
          walk(full);
        } else if (codeExt.test(e.name)) {
          if (ignoreFile.test(full)) continue;
          let text;
          try { text = readFileSync(full, 'utf8'); } catch { continue; }
          if (/@generated|This file is auto-generated/i.test(text.slice(0, 500))) continue;
          if (/\/\/\s*HEALTH-EXEMPT:/i.test(text.slice(0, 400))) continue;
          const eff = text.split('\n').filter(l => l.trim() && !/^\s*(\/\/|#|\/\*|\*)/.test(l)).length;
          if (eff > 1000) veryLongFiles.push(`${full.replace(project.path_local, '').replace(/^[\\/]/, '')}:${eff}`);
          else if (eff > 500) longFiles.push(`${full.replace(project.path_local, '').replace(/^[\\/]/, '')}:${eff}`);
        }
      }
    }
    for (const r of roots) walk(r);
    if (veryLongFiles.length) { findings.push(`> 1000-Zeilen-Datei(en): ${veryLongFiles.slice(0, 3).join(', ')}${veryLongFiles.length > 3 ? ` (+${veryLongFiles.length - 3})` : ''}`); critical = true; }
    if (longFiles.length) findings.push(`> 500-Zeilen-Datei(en): ${longFiles.slice(0, 3).join(', ')}${longFiles.length > 3 ? ` (+${longFiles.length - 3})` : ''}`);

    if (critical) return FAIL(findings.join('; '));
    if (findings.length) return WARN(findings.join('; '));
    return PASS('Refactor-Anteil + Datei-Längen im Budget');
  },
  '021-re-review-reminder': (project) => {
    if (project.status !== 'live') return SKIP(`status=${project.status ?? 'null'}`);
    const last = project.last_review_date;
    if (!last) return FAIL('last_review_date in registry fehlt — initialer Gate-3 nicht dokumentiert');
    const lastDate = new Date(last + 'T00:00:00Z');
    if (isNaN(lastDate.getTime())) return FAIL(`last_review_date ungültig: ${last}`);
    const today = new Date();
    const ageDays = Math.floor((today - lastDate) / 86400000);
    const postponed = project.review_postponed_to;
    if (postponed) {
      const postDate = new Date(postponed + 'T00:00:00Z');
      if (!isNaN(postDate.getTime()) && postDate > today) {
        const daysUntil = Math.ceil((postDate - today) / 86400000);
        return WARN(`Re-Review verschoben auf ${postponed} (${daysUntil} Tage), letzter Review vor ${ageDays} Tagen`);
      }
    }
    if (ageDays >= 270) return FAIL(`Re-Review kritisch überfällig: ${ageDays} Tage seit ${last} (Limit 270)`);
    if (ageDays >= 180) return WARN(`Re-Review fällig: ${ageDays} Tage seit ${last} (Schwelle 180)`);
    if (ageDays >= 166) return WARN(`Re-Review fällig in ${180 - ageDays} Tagen (letzter: ${last})`);
    return PASS(`letzter Review vor ${ageDays} Tagen (${last})`);
  },
  '027-deploy-pipeline': (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    if (project.deploy_pipeline === 'manual') return SKIP('deploy_pipeline=manual (Ausnahme)');
    if (project.status !== 'live') return SKIP(`status=${project.status ?? 'null'}`);

    const wfDir = join(project.path_local, '.github', 'workflows');
    if (!existsSync(wfDir)) return FAIL('.github/workflows/ fehlt komplett');

    // Workflow-Dateien finden (alle deploy-*.yml bevorzugt, sonst alle .yml/.yaml)
    let wfFiles = [];
    try {
      const entries = readdirSync(wfDir).filter(f => /\.(ya?ml)$/i.test(f));
      const preferred = entries.filter(f => /deploy/i.test(f));
      wfFiles = preferred.length ? preferred : entries;
    } catch {
      return FAIL('.github/workflows/ nicht lesbar');
    }
    if (!wfFiles.length) return FAIL('keine Workflow-Datei in .github/workflows/');

    const wfText = wfFiles.map(f => {
      try { return readFileSync(join(wfDir, f), 'utf8'); } catch { return ''; }
    }).join('\n');

    // Antipattern: ein einzelner Job läuft auf self-hosted UND führt
    // docker build aus — das bedeutet Build auf maxone-prod (OOM-Risiko,
    // verletzt 002 + 027). Geprüft per Job, nicht per Datei, damit
    // Multi-Job-Workflows (build=ubuntu-latest, deploy=self-hosted) kein
    // False-Positive erzeugen (vector, snapflow: 2026-05-11).
    let buildOnProdAntipattern = false;
    let antipatternFile = '';
    for (const f of wfFiles) {
      let text = '';
      try { text = readFileSync(join(wfDir, f), 'utf8'); } catch { continue; }
      let wfParsed;
      try { wfParsed = yaml.load(text); } catch { continue; }
      const jobs = (wfParsed && wfParsed.jobs) ? Object.values(wfParsed.jobs) : [];
      for (const job of jobs) {
        if (!job || !job.steps) continue;
        const runsOn = JSON.stringify(job['runs-on'] ?? '');
        const isSelfHosted = /self-hosted/i.test(runsOn);
        if (!isSelfHosted) continue;
        // Use raw run-text (not JSON.stringify) — JSON encodes \n as backslash+n,
        // making "ndocker" run together and breaking \b word-boundary detection.
        const stepsText = job.steps.map(s => `${s.name ?? ''}\n${s.run ?? ''}`).join('\n');
        // matched: `docker build`, `docker compose build`, `docker-compose build`
        const hasDockerBuild = /\bdocker\s+(compose\s+|-compose\s+)?build\b/i.test(stepsText);
        if (hasDockerBuild) { buildOnProdAntipattern = true; antipatternFile = f; break; }
      }
      if (buildOnProdAntipattern) break;
    }
    if (buildOnProdAntipattern) {
      return FAIL(`Antipattern in ${antipatternFile}: runs-on: self-hosted + docker build → Build auf maxone-prod (Runner lebt dort, verletzt 002 + 027)`);
    }

    // Klassisches Antipattern: ssh maxone-prod "...docker build..." vom
    // Workflow aus. Bleibt FAIL.
    const explicitSshBuildOnProd = /(ssh\s+(?:-i\s+\S+\s+)?root@(?:maxone-prod|128\.140\.40\.235)|ssh\s+\$\{[^}]*PROD[^}]*\})[^"]*docker\s+(compose\s+)?build/i.test(wfText);
    if (explicitSshBuildOnProd) {
      return FAIL('Workflow baut explizit auf Prod-Server via ssh ... docker build (verbotenes Pattern in 002)');
    }

    // Pflichtkomponenten der Premium-Pipeline
    const checks = {
      ubuntuLatest: /runs-on:\s*\[?\s*ubuntu-(latest|22\.04|24\.04)/i.test(wfText),
      // docker save (tarball) OR docker push to registry (GHCR/other) — both are off-prod image transfer
      dockerSave: /docker\s+save\b/i.test(wfText) || /docker\s+push\s+ghcr\.io/i.test(wfText) || /docker\/build-push-action/i.test(wfText),
      // SSH-pipe OR GitHub-Artifact OR GHCR push+pull pattern
      sshImageTransfer: /docker\s+save[^\n]*\|[^\n]*ssh[^\n]*docker\s+load|ssh[^\n]*"\s*gunzip\s*\|\s*docker\s+load/i.test(wfText)
        || (/upload-artifact/i.test(wfText) && /download-artifact/i.test(wfText) && /docker\s+load/i.test(wfText))
        || ((/docker\s+push\s+ghcr\.io/i.test(wfText) || /docker\/build-push-action/i.test(wfText)) && /docker\s+pull\s+ghcr\.io/i.test(wfText)),
    };
    const failed = Object.entries(checks).filter(([_, ok]) => !ok).map(([k]) => k);

    // docker-compose.yml-Inhalts-Pflichten
    const composeFile = project.compose_file ?? 'docker-compose.yml';
    const composePath = join(project.path_local, composeFile);
    const composeWarn = [];
    if (existsSync(composePath)) {
      const text = readFileSync(composePath, 'utf8');
      if (!/^\s*image:\s/m.test(text)) composeWarn.push('image: fehlt in compose');
      if (!/^\s*healthcheck:/m.test(text)) composeWarn.push('healthcheck: fehlt');
      if (!/^\s*env_file:/m.test(text)) composeWarn.push('env_file: fehlt');
    } else {
      composeWarn.push(`${composeFile} nicht im Repo-Root`);
    }

    if (failed.length) return WARN(`Workflow unvollständig: ${failed.join(', ')}` + (composeWarn.length ? ` (+ compose: ${composeWarn.join(', ')})` : ''));
    if (composeWarn.length) return WARN(`compose: ${composeWarn.join(', ')}`);
    return PASS(`${wfFiles[0]} + compose erfüllt Pipeline-Pflichten (ubuntu-latest + Image-Transfer)`);
  },
  // Standard 028 — Local-Fallback: nur prüfen, wenn Compose im Repo liegt.
  // Echte Wahrheit liefert sshChecks['028-container-misconfig'].
  '028-container-misconfig-local': (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    const composeFile = project.compose_file ?? 'docker-compose.yml';
    const candidates = [composeFile, 'compose.yml', 'compose.yaml'];
    let found = null;
    for (const c of candidates) {
      const p = join(project.path_local, c);
      if (existsSync(p)) { found = p; break; }
    }
    if (!found) return SKIP(`kein Compose lokal (Server-Pfad authoritativ)`);
    const text = readFileSync(found, 'utf8');
    const secretsDir = project.secrets_dir ?? project.name;
    const { fails, warns } = analyzeCompose(text, secretsDir, found.split(/[\\/]/).pop());
    if (fails.length) return FAIL(fails.join('; ') + (warns.length ? ` (+ ${warns.length} WARN)` : ''));
    if (warns.length) return WARN(warns.join('; '));
    return PASS(`${found.split(/[\\/]/).pop()}: 7 Pflicht-Klassen sauber`);
  },
  '037-tech-stack-currency': (project) => {
    if (!project.path_local || !existsSync(project.path_local)) return SKIP('kein path_local');
    if (project.status === 'sunset') return SKIP('status=sunset');

    const pkgPath = join(project.path_local, 'package.json');
    if (!existsSync(pkgPath)) return SKIP('kein package.json');

    const today = new Date();
    const findings = [];

    // Last dep-sweep via git log
    try {
      const since180 = new Date(today - 180 * 86400000).toISOString().slice(0, 10);
      const since90  = new Date(today - 90  * 86400000).toISOString().slice(0, 10);
      const log180 = execFileSync('git', ['log', '--oneline', `--since=${since180}`, '--grep=chore(deps)'],
        { cwd: project.path_local, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      const log90  = execFileSync('git', ['log', '--oneline', `--since=${since90}`,  '--grep=chore(deps)'],
        { cwd: project.path_local, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

      if (!log180) {
        findings.push({ level: 'fail', msg: 'kein chore(deps)-Commit in 180+ Tagen — Sweep dringend überfällig' });
      } else if (!log90) {
        findings.push({ level: 'warn', msg: 'kein chore(deps)-Commit in 90+ Tagen — Sweep Kadenz verletzt' });
      }
    } catch {
      // git nicht verfügbar oder kein git-Repo — sweep check überspringen
    }

    // npm audit high/critical (nur wenn node_modules existiert)
    const nmPath = join(project.path_local, 'node_modules');
    if (existsSync(nmPath)) {
      try {
        execFileSync('npm', ['audit', '--json', '--audit-level=high'],
          { cwd: project.path_local, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      } catch (e) {
        try {
          const auditJson = JSON.parse(e.stdout ?? '{}');
          const vulns = auditJson?.metadata?.vulnerabilities ?? {};
          const criticalHigh = (vulns.critical ?? 0) + (vulns.high ?? 0);
          if (criticalHigh > 0) {
            findings.push({ level: 'warn', msg: `npm audit: ${criticalHigh} high/critical Vuln(s)` });
          }
        } catch { /* JSON parse fehlgeschlagen */ }
      }
    }

    const fails = findings.filter(f => f.level === 'fail');
    const warns = findings.filter(f => f.level === 'warn');
    if (fails.length) return FAIL(fails.map(f => f.msg).join('; '));
    if (warns.length) return WARN(warns.map(f => f.msg).join('; '));
    return PASS('Dep-Kadenz ok (chore(deps) in den letzten 90 Tagen)');
  },

  // Standard 042 — Version-Marker: BUILD_ID ENV + /api/version Endpoint + Footer-Banner.
  // Drei Konsumenten: SSH-Drift-Check (ENV), externer Probe via Watchdog (Endpoint),
  // Bug-Report-Begleiter (Banner). Alle drei muessen denselben SHA tragen.
  // Local-Teile: Workflow-grep + Dockerfile-grep (immer).
  // Live-Teile: HTTP-Checks + SSH-Drift (nur wenn !OFFLINE).
  '042-version-marker': async (project) => {
    if (project.status === 'paused' || project.status === 'sunset')
      return SKIP(`status=${project.status}`);
    if (project.status !== 'live') return SKIP(`status=${project.status ?? 'null'}`);
    if (!project.server) return SKIP('kein Container-Deploy');

    const tags = Array.isArray(project.tags) ? project.tags : [project.tags].filter(Boolean);
    const isInfra = tags.includes('infra');
    const isInternal = tags.includes('internal');

    const warns = [];
    const fails = [];

    // 1. Workflow setzt BUILD_ID=
    const workflowDir = join(project.path_local, '.github', 'workflows');
    let workflowHasBuildId = false;
    if (existsSync(workflowDir)) {
      let wfFiles;
      try { wfFiles = readdirSync(workflowDir); } catch { wfFiles = []; }
      for (const f of wfFiles) {
        if (!f.endsWith('.yml') && !f.endsWith('.yaml')) continue;
        try {
          const txt = readFileSync(join(workflowDir, f), 'utf8');
          if (/BUILD_ID=/i.test(txt)) { workflowHasBuildId = true; break; }
        } catch { /* ignore */ }
      }
    }
    if (!workflowHasBuildId) warns.push('Workflow: kein BUILD_ID= build-arg');

    // 2. Dockerfile hat ARG + ENV BUILD_ID
    // Prüft erst project.dockerfile_path (Registry-Override), dann Standard-Kandidaten im Root.
    const dockerfileCandidates = project.dockerfile_path
      ? [project.dockerfile_path]
      : ['Dockerfile', 'dockerfile', 'Dockerfile.prod'];
    let dockerfileHasBuildId = false;
    for (const df of dockerfileCandidates) {
      const dp = join(project.path_local, df);
      if (!existsSync(dp)) continue;
      try {
        const txt = readFileSync(dp, 'utf8');
        if (/ARG\s+BUILD_ID/i.test(txt) && /ENV\s+BUILD_ID/i.test(txt)) {
          dockerfileHasBuildId = true; break;
        }
      } catch { /* ignore */ }
    }
    if (!dockerfileHasBuildId) warns.push('Dockerfile: kein ARG+ENV BUILD_ID');

    // 3+4+5. Live-Checks (nur wenn online und Domain vorhanden)
    if (!OFFLINE && project.domain) {
      const versionPath = project.version_endpoint ?? '/api/version';
      const versionUrl = `https://${project.domain}${versionPath}`;

      let endpointBuildId = null;
      try {
        const res = await fetch(versionUrl, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) {
          fails.push(`${versionPath} HTTP ${res.status}`);
        } else {
          let json;
          try { json = await res.json(); } catch { json = null; }
          if (!json || typeof json !== 'object') {
            warns.push(`${versionPath}: kein JSON`);
          } else if (!json.build_id) {
            warns.push(`${versionPath}: Feld build_id fehlt`);
          } else {
            endpointBuildId = json.build_id;
          }
        }
      } catch (e) {
        const msg = e.name === 'TimeoutError' ? 'Timeout' : e.message.slice(0, 60);
        fails.push(`${versionPath}: ${msg}`);
      }

      // 4. Banner im Homepage-HTML (entfaellt bei infra/internal)
      if (!isInfra && !isInternal) {
        try {
          const res = await fetch(`https://${project.domain}/`, { signal: AbortSignal.timeout(8000) });
          if (res.ok) {
            const html = await res.text();
            const hasBanner = /v:\s*[a-f0-9]{6,8}/i.test(html)
              || /build:\s*[a-f0-9]{6,8}/i.test(html)
              || /version:\s*[a-f0-9]{6,8}/i.test(html);
            if (!hasBanner) warns.push('Footer: kein Version-Banner (v:/Build:/version: + hex-SHA)');
          }
        } catch { /* Homepage-Erreichbarkeit pruefen andere Checks */ }
      }

      // 5. SSH-Drift: Container-ENV vs Endpoint
      if (endpointBuildId && project.container) {
        try {
          const slot = project.deploy === 'blue-green' ? '-blue' : '';
          const cname = `${project.container}${slot}`;
          const envOut = ssh(project.server,
            `docker inspect ${cname} --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep '^BUILD_ID=' || echo 'BUILD_ID=__notfound__'`
          );
          const envBuildId = envOut.trim().replace(/^BUILD_ID=/, '');
          if (envBuildId === '__notfound__') {
            warns.push('Container-ENV: BUILD_ID nicht gesetzt');
          } else if (envBuildId && envBuildId !== endpointBuildId) {
            fails.push(`Drift: Container BUILD_ID=${envBuildId} ≠ Endpoint build_id=${endpointBuildId}`);
          }
        } catch (e) {
          warns.push(`SSH-Drift-Check: ${e.message.slice(0, 60)}`);
        }
      }
    }

    if (fails.length) return FAIL(fails.join('; ') + (warns.length ? ` (+${warns.length} WARN)` : ''));
    if (warns.length) return WARN(warns.join('; '));
    return PASS('BUILD_ID ENV + version-Endpoint + Footer-Banner');
  },

  // Standard 043 — Cron-E-Mail-Dedup-Schutz.
  // Jeder Cron-Job der E-Mails sendet und einen Dedup-Marker schreibt,
  // muss den Counter ERST nach erfolgreichem DB-Write inkrementieren.
  // Anti-Muster: if (insertErr) { log; } totals.sent++  ← kein continue
  // Korrekt:     if (insertErr) { log; continue; } totals.sent++
  '043-cron-email-dedup': (project) => {
    if (!project.path_local || !existsSync(project.path_local)) return SKIP('kein path_local');

    const cronDir = join(project.path_local, 'app', 'api', 'cron');
    if (!existsSync(cronDir)) return SKIP('kein app/api/cron');

    function findRouteFiles(dir) {
      const files = [];
      try {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const p = join(dir, entry.name);
          if (entry.isDirectory()) files.push(...findRouteFiles(p));
          else if (entry.isFile() && /^route\.tsx?$/.test(entry.name)) files.push(p);
        }
      } catch {}
      return files;
    }

    const violations = [];

    for (const file of findRouteFiles(cronDir)) {
      let content;
      try { content = readFileSync(file, 'utf8'); } catch { continue; }

      // Nur Dateien mit sendEmail-Aufruf sind relevant
      if (!content.includes('sendEmail')) continue;

      // Nur Dateien mit Dedup-Write und Counter-Increment
      const hasDedupWrite = /email_sequences|retention_emails_sent|reminder_sent_\d+d/.test(content);
      if (!hasDedupWrite) continue;

      const hasCounter = /totals\.sent\+\+|results\.\w+\+\+/.test(content);
      if (!hasCounter) continue;

      // Zeile-für-Zeile: Error-Blöcke um Dedup-Writes prüfen
      const lines = content.split('\n');
      const rel = file.slice(project.path_local.length + 1).replace(/\\/g, '/');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Erkenne Fehler-Check nach einem Dedup-Write
        // Vorausschau: die letzten 6 Zeilen enthalten einen Dedup-Write-Marker
        if (!/if\s*\(.*([Ee]rr|\.error)/.test(line)) continue;
        const context = lines.slice(Math.max(0, i - 6), i).join('\n');
        if (!/email_sequences|retention_emails_sent|reminder_sent_\d+d/.test(context)) continue;

        // Block-Inhalt sammeln (einfache Klammer-Zählung)
        if (!line.includes('{')) continue;
        let depth = 0;
        let blockLines = [];
        for (let j = i; j < lines.length && (depth > 0 || j === i); j++) {
          for (const ch of lines[j]) {
            if (ch === '{') depth++;
            else if (ch === '}') depth--;
          }
          blockLines.push(lines[j]);
          if (depth === 0 && j > i) break;
        }
        const blockContent = blockLines.join('\n');
        const blockEnd = i + blockLines.length;

        if (blockContent.includes('continue')) continue; // korrekt bewacht

        // Prüfe ob in den nächsten 5 Zeilen nach dem Block ein Counter steht
        const after = lines.slice(blockEnd, Math.min(blockEnd + 5, lines.length)).join('\n');
        if (/totals\.sent\+\+|results\.\w+\+\+/.test(after)) {
          violations.push(`${rel}:${i + 1} — Dedup-Error-Block ohne \`continue\` vor Counter-Increment`);
        }
      }
    }

    if (violations.length) return FAIL(violations.join('; '));
    return PASS('alle Cron-Dedup-Error-Blöcke korrekt mit continue bewacht');
  },

  '048-plan-tracker': (project) => {
    if (project.status !== 'live' && project.status !== 'dev') return SKIP(`status=${project.status ?? 'null'}`);
    if (!project.path_local) return SKIP('kein path_local');
    const planPath = join(project.path_local, 'PLAN.md');
    if (!existsSync(planPath)) return FAIL('PLAN.md fehlt im Repo-Root');
    const text = readFileSync(planPath, 'utf8');
    const hasOffen = /^##\s+Noch offen/m.test(text);
    const hasErledigt = /^##\s+Erledigt/m.test(text);
    if (!hasOffen && !hasErledigt) return FAIL('PLAN.md: "## Noch offen" und "## Erledigt" fehlen');
    if (!hasOffen) return FAIL('PLAN.md: "## Noch offen" fehlt');
    if (!hasErledigt) return FAIL('PLAN.md: "## Erledigt" fehlt');
    return PASS('PLAN.md ✓');
  },

  // Standard 049 — Admin App Launcher
  '049-admin-app-launcher': (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    // Nur Projekte mit Admin-Bereich prüfen
    const projectDir = project.path_local;
    const hasAdminDir =
      existsSync(join(projectDir, 'src/routes/(admin)')) ||
      existsSync(join(projectDir, 'app/(admin)')) ||
      existsSync(join(projectDir, 'app/(dashboard)/admin'));
    if (!hasAdminDir) return SKIP('kein Admin-Bereich erkannt');

    // AppLauncher-Komponente suchen
    const launcherPatterns = [
      'src/lib/components/admin/AppLauncher.svelte',
      'src/components/admin/AppLauncher.tsx',
      'src/components/AppLauncher.tsx',
      'components/admin/AppLauncher.tsx',
    ];
    const hasLauncher = launcherPatterns.some(p => existsSync(join(projectDir, p)));
    if (!hasLauncher) return WARN('AppLauncher-Komponente fehlt (049-admin-app-launcher)');

    // Sicherstellen dass match()-Pattern verwendet wird
    const launcherFile = launcherPatterns.find(p => existsSync(join(projectDir, p)));
    const src = readFileSync(join(projectDir, launcherFile), 'utf8');
    if (!src.includes('match')) return WARN('AppLauncher: kein match()-Pattern für Active-State');

    return PASS('AppLauncher ✓');
  },

  // Standard 050 — Bug Registry
  '050-bug-registry': (project) => {
    if (project.status !== 'live' && project.status !== 'dev') return SKIP(`status=${project.status ?? 'null'}`);
    if (!project.path_local) return SKIP('kein path_local');
    const bugsPath = join(project.path_local, 'BUGS.md');
    if (!existsSync(bugsPath)) return WARN('BUGS.md fehlt im Repo-Root');
    const text = readFileSync(bugsPath, 'utf8');
    if (!/^##\s+Aktive Bugs/m.test(text)) return WARN('BUGS.md: "## Aktive Bugs"-Sektion fehlt');
    if (!/^##\s+Geschlossene Bugs/m.test(text)) return WARN('BUGS.md: "## Geschlossene Bugs"-Sektion fehlt');
    return PASS('BUGS.md ✓');
  },
};

// Standard 028 — Container-Misconfig: gemeinsame Compose-Analyse.
// Wird sowohl von SSH-Check (Server-Compose) als auch Local-Fallback
// (path_local-Compose) genutzt.
//
// Regeln:
//   FAIL: privileged ohne audit-comment, inline-secrets, :latest oder kein Tag
//   WARN: kein mem_limit, kein restart, docker.sock ohne audit-comment,
//         env_file zeigt nicht auf /opt/secrets/<dir>/keys.env
const INLINE_SECRET_KEY = /(PASSWORD|SECRET|TOKEN|API[_-]?KEY|PRIVATE[_-]?KEY)/i;
const VAR_REF = /^\$\{?[A-Z_][A-Z0-9_]*(:-[^}]*)?\}?$/i;

function analyzeCompose(rawText, secretsDir, sourceLabel) {
  let doc;
  try { doc = yaml.load(rawText); }
  catch (e) { return { fails: [`Parse-Fehler in ${sourceLabel}: ${e.message.slice(0, 60)}`], warns: [] }; }
  const services = doc?.services;
  if (!services || typeof services !== 'object') {
    return { fails: [`${sourceLabel}: keine services:-Sektion`], warns: [] };
  }
  const fails = [];
  const warns = [];
  // Linien-Index für # audit:-Kommentar-Lookup
  const lines = rawText.split('\n');
  const expectedSecretsPath = `/opt/secrets/${secretsDir}/keys.env`;

  for (const [name, svc] of Object.entries(services)) {
    if (!svc || typeof svc !== 'object') continue;

    // image: :latest oder kein Tag
    // maxone-Pattern (CLAUDE.md): image: <name>:latest + build: ist OK,
    // weil das Image via CI gebaut + via `docker save | docker load`
    // transferiert wird (Standard 027), kein Registry-Pull. FAIL nur,
    // wenn das Image gepulled würde (Registry-Pfad mit Slash, kein build).
    if (svc.image && typeof svc.image === 'string') {
      const img = svc.image;
      const lastSlash = img.lastIndexOf('/');
      const tagPart = img.slice(lastSlash + 1);
      const colonIdx = tagPart.indexOf(':');
      const hasRegistry = lastSlash !== -1;
      const hasBuild = !!svc.build;
      const isUntagged = colonIdx === -1;
      const isLatest = !isUntagged && tagPart.slice(colonIdx + 1) === 'latest';
      if (isUntagged || isLatest) {
        if (hasRegistry && !hasBuild) {
          fails.push(`${name}: image: ${img} — Registry-Pull mit ${isUntagged ? 'fehlendem Tag' : ':latest'} → silent drift`);
        } else if (!hasBuild) {
          if (isUntagged) {
            fails.push(`${name}: image: ${img} ohne :tag und ohne build: → keine Quelle definiert`);
          } else {
            fails.push(`${name}: image: ${img} (lokales :latest) ohne build: → keine Quelle definiert (Pattern verlangt build: oder Registry-Pin)`);
          }
        }
        // else: maxone-CI-Build-Pattern (image:<name>:latest + build:), OK
      }
    }

    // privileged: true ohne audit-comment
    if (svc.privileged === true) {
      const ok = lines.some(l => /#\s*audit:\s*privileged-required/i.test(l));
      if (!ok) fails.push(`${name}: privileged: true ohne # audit: privileged-required`);
    }

    // inline secrets in environment:
    const env = svc.environment;
    if (env) {
      const entries = Array.isArray(env)
        ? env.map(e => { const i = String(e).indexOf('='); return i === -1 ? [e, ''] : [String(e).slice(0, i), String(e).slice(i + 1)]; })
        : Object.entries(env);
      for (const [k, v] of entries) {
        if (!INLINE_SECRET_KEY.test(k)) continue;
        const val = String(v ?? '');
        if (!val) continue;
        if (VAR_REF.test(val.trim())) continue;
        if (val.length >= 12 && /[A-Za-z0-9+/_-]{12,}/.test(val)) {
          fails.push(`${name}: inline secret in environment: ${k} (Klartext)`);
        }
      }
    }

    // mem_limit
    if (svc.mem_limit === undefined && svc.deploy?.resources?.limits?.memory === undefined) {
      warns.push(`${name}: kein mem_limit:`);
    }
    // restart
    if (!svc.restart) warns.push(`${name}: kein restart:`);

    // docker.sock bind-mount
    const vols = svc.volumes;
    if (vols && Array.isArray(vols)) {
      const sockHit = vols.some(v => typeof v === 'string' && v.includes('/var/run/docker.sock'));
      if (sockHit) {
        const ok = lines.some(l => /#\s*audit:\s*docker-socket-required/i.test(l));
        if (!ok) warns.push(`${name}: docker.sock-Mount ohne # audit: docker-socket-required`);
      }
    }

    // env_file: muss auf /opt/secrets/<dir>/keys.env zeigen
    if (svc.env_file !== undefined) {
      const refs = Array.isArray(svc.env_file) ? svc.env_file : [svc.env_file];
      const hasStoreRef = refs.some(r => typeof r === 'string' && r.includes(`/opt/secrets/${secretsDir}/`));
      if (!hasStoreRef) {
        warns.push(`${name}: env_file: zeigt nicht auf ${expectedSecretsPath}`);
      }
    }
  }
  return { fails, warns };
}

// --- SSH Checks ---

const sshChecks = {
  '006-handoff-md': (project) => {
    if (!project.server || !project.path_server) return SKIP('kein Server');
    try {
      ssh(project.server, `test -f ${project.path_server}/HANDOFF.md`);
      return PASS();
    } catch {
      return FAIL(`HANDOFF.md fehlt auf ${project.server}:${project.path_server}/`);
    }
  },
  '003-secrets-store': (project) => {
    if (project.server !== 'maxone-prod') return SKIP('Store nur auf maxone-prod');
    const dir = project.secrets_dir ?? project.name;
    try {
      ssh('maxone-prod', `test -f /opt/secrets/${dir}/keys.env`);
      return PASS(`/opt/secrets/${dir}/keys.env`);
    } catch {
      return FAIL(`/opt/secrets/${dir}/keys.env fehlt`);
    }
  },
  '007-paths-server': (project) => {
    if (!project.server || !project.path_server) return SKIP('kein Server');
    try {
      ssh(project.server, `test -d ${project.path_server}`);
      return PASS();
    } catch {
      return FAIL(`Server-Pfad fehlt: ${project.server}:${project.path_server}`);
    }
  },
  '014-sunset-teardown': (project) => {
    if (project.status !== 'sunset') return SKIP(`status=${project.status ?? 'null'}`);
    if (!project.server || !project.container) return SKIP('kein Container in Registry');
    try {
      const out = ssh(project.server, `docker ps --format '{{.Names}}' | grep -E '^${project.container}(-blue|-green)?$' || true`);
      const names = out.trim().split('\n').filter(Boolean);
      if (names.length === 0) return PASS('Container-Tear-Down vollständig');
      return FAIL(`Container läuft noch: ${names.join(', ')} — sunset verlangt Tear-Down`);
    } catch (e) {
      return WARN(`SSH-Fehler: ${e.message.slice(0, 80)}`);
    }
  },
  // Standard 028 — Container-Misconfig: zieht /opt/<projekt>/docker-compose.yml
  // vom Server und prüft die 7 Pflicht-Klassen. Authoritativ; localChecks-
  // Variante ist nur Fallback wenn Compose im Repo-Root liegt.
  '028-container-misconfig': (project) => {
    if (!project.server || !project.path_server) return SKIP('kein Server');
    if (project.status === 'sunset') return SKIP(`status=sunset`);
    const composeFile = project.compose_file ?? 'docker-compose.yml';
    const remote = `${project.path_server}/${composeFile}`;
    let text;
    try {
      // -f: Pfad existieren UND lesbar; sonst probieren wir die Alternativ-Namen
      text = ssh(project.server, `cat ${remote} 2>/dev/null || cat ${project.path_server}/compose.yml 2>/dev/null || cat ${project.path_server}/compose.yaml 2>/dev/null`);
    } catch (e) {
      return WARN(`SSH-Fehler: ${e.message.slice(0, 80)}`);
    }
    if (!text || !text.trim()) return WARN(`Keine Compose-Datei unter ${project.path_server}/`);
    const secretsDir = project.secrets_dir ?? project.name;
    const { fails, warns } = analyzeCompose(text, secretsDir, `${project.server}:${remote}`);
    if (fails.length) return FAIL(fails.join('; ') + (warns.length ? ` (+ ${warns.length} WARN)` : ''));
    if (warns.length) return WARN(warns.join('; '));
    return PASS(`${composeFile}@${project.server}: 7 Pflicht-Klassen sauber`);
  },
  // Standard 033 — Post-Deploy Warm-Up: Pre-Hit aller Public-Routes auf
  // dem neuen Slot bevor Traefik swappt. Verhindert Cold-Start-Spike beim
  // ersten echten User-Request. Heuristik:
  //   1. <path_server>/deploy.sh existiert (sonst kein orchestrierter Swap)
  //   2. Inhalt enthaelt prewarm/warm-up/warmup ODER docker exec ... fetch
  //      http://localhost in einer Schleife
  //   3. Warm-Up-Zeile liegt VOR dem Traefik-Swap (traefik.enable, swap.sh,
  //      .active-slot)
  '033-post-deploy-warmup': (project) => {
    if (project.deploy !== 'blue-green') return SKIP(`deploy=${project.deploy ?? 'null'} (Standard 033 nur fuer blue-green)`);
    if (project.warmup_required === false) return SKIP('warmup_required=false (Static-Site, registry)');
    if (!project.server || !project.path_server) return SKIP('kein Server');
    if (project.status !== 'live') return SKIP(`status=${project.status ?? 'null'}`);

    const isInfra = Array.isArray(project.tags) && project.tags.includes('infra');

    let text;
    try {
      text = ssh(project.server, `test -f ${project.path_server}/deploy.sh && cat ${project.path_server}/deploy.sh || echo __NO_DEPLOY_SH__`);
    } catch (e) {
      return WARN(`SSH-Fehler: ${e.message.slice(0, 80)}`);
    }
    if (!text || /__NO_DEPLOY_SH__/.test(text)) {
      return isInfra
        ? WARN(`kein deploy.sh auf ${project.server}:${project.path_server}/ (infra: WARN statt FAIL)`)
        : FAIL(`kein deploy.sh auf ${project.server}:${project.path_server}/ — Blue/Green ohne Skript = kein orchestrierter Warm-Up`);
    }

    const lines = text.split('\n');
    const warmupLineIdx = lines.findIndex(l => /(?:^|[^a-z])(prewarm|warm-?up)(?:[^a-z]|$)/i.test(l));
    const fetchLoopIdx = lines.findIndex(l => /docker\s+exec[^\n]+(fetch|curl|wget)[^\n]+http:\/\/localhost/i.test(l));
    const hasPattern = warmupLineIdx !== -1 || fetchLoopIdx !== -1;
    if (!hasPattern) {
      return isInfra
        ? WARN(`deploy.sh hat keinen Warm-Up-Block (infra: WARN statt FAIL)`)
        : WARN(`deploy.sh hat keinen Warm-Up-Block (kein prewarm/warmup/docker-exec-fetch erkennbar)`);
    }

    // Reihenfolge: Warm-Up vor Traefik-Swap? Nur echte Swap-Aktionen
    // zaehlen — Variable-Zuweisungen wie SLOT_FILE=".active-slot" nicht.
    // Echte Swap-Indikatoren: Label-Update, swap.sh-Aufruf, Schreiben in
    // .active-slot, Stop/Kill des alten Slots.
    const warmupAt = warmupLineIdx !== -1 ? warmupLineIdx : fetchLoopIdx;
    const swapIdx = lines.findIndex(l =>
      /traefik\.enable\s*=\s*true/i.test(l) ||
      /\.\/swap\.sh\b/.test(l) ||
      /(echo|printf)\s+\S+\s+>+\s*\S*\.active-slot/i.test(l) ||
      /docker\s+(stop|kill|rm)\s+[^\n#]*-\$?\{?ACTIVE/i.test(l) ||
      /\$COMPOSE\s+(stop|rm)\s+[^\n#]*\$\{?ACTIVE/i.test(l) ||
      /docker\s+label\s+update/i.test(l)
    );
    if (swapIdx !== -1 && warmupAt > swapIdx) {
      return WARN(`Warm-Up steht NACH dem Traefik-Swap (Zeile ${warmupAt + 1} vs Swap Zeile ${swapIdx + 1}) — User sieht Cold-Start`);
    }

    return PASS(`deploy.sh hat Warm-Up vor Traefik-Swap`);
  },
  '007-container-running': (project) => {
    if (!project.server || !project.container) return SKIP('kein Container');
    if (project.deploy === 'blue-green') {
      try {
        // docker ps -a zeigt auch gestoppte Slots (inaktiver Blue/Green-Slot)
        const out = ssh(project.server, `docker ps -a --format '{{.Names}}' | grep -E '^${project.container}-(blue|green)$' || true`);
        const names = out.trim().split('\n').filter(Boolean);
        if (names.length === 2) return PASS('beide Slots vorhanden');
        if (names.length === 1) return PASS(`1 Slot aktiv: ${names[0]} (Blue/Green normal)`);
        return FAIL(`keine ${project.container}-{blue,green} Container gefunden`);
      } catch (e) {
        return WARN(`SSH-Fehler: ${e.message.slice(0, 80)}`);
      }
    } else {
      try {
        const out = ssh(project.server, `docker ps --format '{{.Names}}' | grep -E '^${project.container}$' || true`);
        if (out.trim()) return PASS();
        return FAIL(`Container ${project.container} nicht running`);
      } catch (e) {
        return WARN(`SSH-Fehler: ${e.message.slice(0, 80)}`);
      }
    }
  },

  // Standard 047 — Disk-Guard: drei Pflichten auf allen Docker-Servern.
  // Sentinel-Projekte pro Server (einmalig, nicht für jedes Projekt):
  //   maxone-prod  → vector
  //   voltfair-cli → voltfair
  //   maxone-staging + maxone-watchdog: nicht in Registry, kein Audit-Check.
  '047-disk-guard': (project) => {
    const SENTINEL = { 'maxone-prod': 'vector', 'voltfair-cli': 'voltfair' };
    const sentinel = SENTINEL[project.server];
    if (!sentinel) return SKIP(`Server ${project.server ?? 'null'} nicht in 047-Scope`);
    if (project.name !== sentinel) return SKIP(`Infra-Check läuft einmal via ${sentinel}`);

    const srv = project.server;
    try {
      // 1. docker-cleanup.sh: vollständiger Prune ohne --until= Filter
      const cleanupSh = ssh(srv, 'cat /opt/_ops/docker-cleanup.sh 2>/dev/null || echo __MISSING__');
      if (cleanupSh.includes('__MISSING__')) return FAIL('/opt/_ops/docker-cleanup.sh fehlt');
      if (!cleanupSh.includes('builder prune -af')) return FAIL('docker-cleanup.sh: kein "builder prune -af"');
      // Nur non-comment Zeilen prüfen (Kommentar "no --until=" ist erlaubt)
      const cleanupCode = cleanupSh.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
      if (cleanupCode.includes('--until=')) return FAIL('docker-cleanup.sh: --until= Filter noch aktiv (Vorfall-Ursache 2026-05-18)');

      // 2. Cron alle 4 Stunden (nicht täglich)
      const cronD = ssh(srv, 'cat /etc/cron.d/docker-cleanup 2>/dev/null || echo __MISSING__');
      if (cronD.includes('__MISSING__')) return FAIL('/etc/cron.d/docker-cleanup fehlt');
      if (!/\*\/4/.test(cronD) && !/0 \*\/4/.test(cronD)) return FAIL('docker-cleanup cron.d: kein 4h-Schedule (täglich zu selten)');

      // 3. disk-guard.sh: 80%-Schwellwert
      const guardSh = ssh(srv, 'cat /opt/disk-guard.sh 2>/dev/null || echo __MISSING__');
      if (guardSh.includes('__MISSING__')) return FAIL('/opt/disk-guard.sh fehlt');
      if (!guardSh.includes('THRESHOLD=80') && !/gt\s+80/.test(guardSh)) return FAIL('disk-guard.sh: kein 80%-Schwellwert');

      // 4. Crontab: disk-guard alle 10 Min
      const crontab = ssh(srv, 'crontab -l 2>/dev/null');
      if (!crontab.includes('disk-guard.sh')) return FAIL('root-crontab: disk-guard.sh fehlt');
      if (!/\*\/10.*disk-guard/.test(crontab)) return WARN('root-crontab: disk-guard.sh nicht alle 10 Min');

      return PASS(`${srv}: cleanup 4h ohne --until + disk-guard 10min@80%`);
    } catch (e) {
      return WARN(`SSH-Fehler: ${e.message.slice(0, 80)}`);
    }
  },

};

// --- Runner ---

async function runChecks(checks, projects, filterStandard, kind, exceptions = [], today = new Date()) {
  const results = { pass: 0, fail: 0, warn: 0, skip: 0 };
  const failures = [];
  const warnings = [];
  const exceptionsApplied = [];
  const removalCandidates = [];
  const perStandard = new Map(); // id -> { pass, warn, fail, skip }
  function bump(id, key) {
    if (!perStandard.has(id)) perStandard.set(id, { pass: 0, warn: 0, fail: 0, skip: 0 });
    perStandard.get(id)[key]++;
  }
  for (const project of projects) {
    let printedHeader = false;
    for (const [id, fn] of Object.entries(checks)) {
      if (filterStandard && !id.startsWith(filterStandard)) continue;
      let r;
      try { r = await fn(project); }
      catch (err) { r = FAIL(`Check-Fehler: ${err.message.slice(0, 100)}`); }

      // Aktive Ausnahme? → reklassifiziere FAIL/WARN nach SKIP. PASS bleibt
      // PASS, wird aber als Removal-Kandidat markiert (Ausnahme nicht mehr nötig).
      const exc = findActiveException(exceptions, project.name, id, today);
      if (exc) {
        const expSuffix = `(expires ${exc.expires_until}, granted ${exc.granted_at ?? '?'} by ${exc.granted_by ?? '?'})`;
        if (!r.ok) {
          // Originally FAIL or WARN
          r = SKIP(`exception: ${exc.reason} ${expSuffix}`);
          exceptionsApplied.push({ project: project.name, id, exc });
        } else if (r.warn) {
          r = SKIP(`exception: ${exc.reason} ${expSuffix}`);
          exceptionsApplied.push({ project: project.name, id, exc });
        } else if (r.ok && !r.skip) {
          // Originally PASS — Ausnahme wäre nicht mehr nötig
          removalCandidates.push({ project: project.name, id, exc });
        }
      }

      if (!printedHeader) { console.log(`\n=== ${project.name} (${kind}) ===`); printedHeader = true; }
      if (r.skip) { results.skip++; bump(id, 'skip'); console.log(`  [skip] ${id} — ${r.msg}`); }
      else if (r.warn) { results.warn++; bump(id, 'warn'); warnings.push({ project: project.name, id, msg: r.msg }); console.log(`  [WARN] ${id} — ${r.msg}`); }
      else if (r.ok) { results.pass++; bump(id, 'pass'); console.log(`  [OK]   ${id}${r.msg ? ' — ' + r.msg : ''}`); }
      else { results.fail++; bump(id, 'fail'); failures.push({ project: project.name, id, msg: r.msg }); console.log(`  [FAIL] ${id} — ${r.msg}`); }
    }
  }
  return { results, failures, warnings, exceptionsApplied, removalCandidates, perStandard };
}

// Score 0-10 pro Standard. PASS = 10, WARN = 5, FAIL = 0; SKIP zählt nicht.
// Bei N=0 (nur Skips) → null = N/A.
function computeScore(stats) {
  const n = stats.pass + stats.warn + stats.fail;
  if (n === 0) return null;
  return (10 * stats.pass + 5 * stats.warn) / n;
}

function formatScore(score) {
  if (score === null) return ' N/A';
  return score.toFixed(1).padStart(4, ' ');
}

async function main() {
  const args = parseArgs();
  OFFLINE = !!args['local-only'];
  let registry = loadRegistry();

  // Standard 031: --root=/opt erlaubt dem GH-Action-Runner, gegen die
  // server-residenten Projekt-Verzeichnisse zu prüfen statt gegen die
  // Windows-`path_local`-Pfade des User-NUC. Bevorzugt path_server (siehe
  // registry/projects.yml), fällt auf <root>/<name> zurück. Projekte ohne
  // path_server *und* ohne Match unter <root>/<name> bleiben SKIPpen-fähig
  // (existsSync-Checks in den localChecks tun das automatisch).
  if (args.root) {
    const root = String(args.root);
    registry = registry.map(p => ({
      ...p,
      path_local: p.path_server || join(root, p.name),
    }));
  }

  if (args.project) {
    registry = registry.filter(p => p.name === args.project);
    if (!registry.length) { console.error(`Projekt nicht in Registry: ${args.project}`); process.exit(2); }
  }

  const exceptions = loadExceptions();
  const today = new Date();

  console.log(`maxone-standards audit — ${registry.length} Projekt(e)`);
  if (exceptions.length) console.log(`(${exceptions.length} Ausnahme(n) aus registry/exceptions.yml geladen)`);

  const local = await runChecks(localChecks, registry, args.standard, 'local', exceptions, today);

  let ssh = { results: { pass: 0, fail: 0, warn: 0, skip: 0 }, failures: [], warnings: [], exceptionsApplied: [], removalCandidates: [] };
  if (!args['local-only']) {
    console.log('\n--- SSH-Checks (--local-only zum Überspringen) ---');
    ssh = await runChecks(sshChecks, registry, args.standard, 'ssh', exceptions, today);
  }

  const total = local.results.pass + local.results.fail + local.results.warn + local.results.skip
              + ssh.results.pass + ssh.results.fail + ssh.results.warn + ssh.results.skip;

  console.log('\n--- Summary ---');
  console.log(`  Total:   ${total}`);
  console.log(`  Passed:  ${local.results.pass + ssh.results.pass}`);
  console.log(`  Warning: ${local.results.warn + ssh.results.warn}`);
  console.log(`  Failed:  ${local.results.fail + ssh.results.fail}`);
  console.log(`  Skipped: ${local.results.skip + ssh.results.skip}`);

  const allFails = [...local.failures, ...ssh.failures];
  if (allFails.length) {
    console.log('\n--- Failures ---');
    for (const f of allFails) console.log(`  ${f.project.padEnd(20)} ${f.id.padEnd(28)} ${f.msg}`);
  }

  // Ausnahmen-Berichte
  const allExceptionsApplied = [...local.exceptionsApplied, ...ssh.exceptionsApplied];
  if (allExceptionsApplied.length) {
    console.log('\n--- Ausnahmen aktiv (FAIL/WARN unterdrückt) ---');
    for (const e of allExceptionsApplied) {
      console.log(`  ${e.project.padEnd(20)} ${e.id.padEnd(36)} bis ${e.exc.expires_until} — ${e.exc.reason}`);
    }
  }

  const allRemovalCandidates = [...local.removalCandidates, ...ssh.removalCandidates];
  if (allRemovalCandidates.length) {
    console.log('\n--- Ausnahmen REMOVAL-KANDIDAT (Check liefert PASS — Ausnahme nicht mehr nötig) ---');
    for (const e of allRemovalCandidates) {
      console.log(`  ${e.project.padEnd(20)} ${e.id.padEnd(36)} — Eintrag aus exceptions.yml entfernen`);
    }
  }

  // Bald ablaufende Ausnahmen
  const exp30 = new Date(today.getTime() + 30 * 86400000);
  const expiringSoon = exceptions.filter(e => {
    if (!e.expires_until) return false;
    const d = new Date(e.expires_until);
    return d >= today && d < exp30;
  });
  if (expiringSoon.length) {
    console.log('\n--- Ausnahmen laufen in <30 Tagen ab ---');
    for (const e of expiringSoon) {
      console.log(`  ${e.project.padEnd(20)} ${String(e.standard).padEnd(36)} läuft am ${e.expires_until} ab`);
    }
  }

  // --emit=issues — schreibt audits/issues-<date>.{json,md} mit
  // GitHub-Issue-Format pro FAIL/WARN. Allstar-Pattern: Findings als
  // strukturierte Issue-Bodies, die per `gh issue create` aufgelöst werden
  // können. Nicht selbst posten — User triggert das.
  if (args.emit === 'issues') {
    const allWarns = [...local.warnings, ...ssh.warnings];
    const issues = [];
    const seen = new Set();
    // Standard-Prefix → Datei-Lookup (audit-IDs sind Prefixe wie "013-launch-gate",
    // echte Files können "013-launch-gate-review.md" heißen — also nach Prefix mappen)
    const stdFiles = readdirSync(join(ROOT, 'standards'))
      .filter(f => /^\d{3}-.+\.md$/.test(f));
    function findStandardFile(id) {
      const prefix = id.slice(0, 3);
      return stdFiles.find(f => f.startsWith(prefix + '-')) ?? null;
    }
    function pushIssue(item, severity) {
      const key = `${item.project}::${item.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      const title = `[${item.id}] ${item.project} — ${item.msg.slice(0, 80)}${item.msg.length > 80 ? '…' : ''}`;
      const stdFile = findStandardFile(item.id);
      const stdLink = stdFile
        ? `siehe [\`standards/${stdFile}\`](../standards/${stdFile})`
        : `siehe [\`standards/\`](../standards/)`;
      const body = [
        `**Projekt:** \`${item.project}\``,
        `**Standard:** \`${item.id}\` — ${stdLink}`,
        `**Severity:** ${severity.toUpperCase()}`,
        '',
        '## Audit-Befund',
        '',
        '```',
        item.msg,
        '```',
        '',
        '## Kontext',
        '',
        `Gefunden vom Audit-Lauf am ${today.toISOString().slice(0, 10)} ` +
          `(\`scripts/audit.mjs\`).`,
        '',
        '## Akzeptanzkriterium',
        '',
        `Re-Run \`node scripts/audit.mjs --project=${item.project} --standard=${item.id.slice(0, 3)}\` ` +
          `liefert PASS (oder explizite Ausnahme in \`registry/exceptions.yml\`).`,
      ].join('\n');
      issues.push({
        title,
        body,
        labels: ['standards-audit', `standard:${item.id.slice(0, 3)}`, `project:${item.project}`, `severity:${severity}`],
      });
    }
    for (const f of allFails) pushIssue(f, 'fail');
    for (const w of allWarns) pushIssue(w, 'warn');

    const auditsDir = join(ROOT, 'audits');
    if (!existsSync(auditsDir)) mkdirSync(auditsDir, { recursive: true });
    const stamp = today.toISOString().slice(0, 10);
    const jsonPath = join(auditsDir, `issues-${stamp}.json`);
    const mdPath = join(auditsDir, `issues-${stamp}.md`);
    writeFileSync(jsonPath, JSON.stringify(issues, null, 2), 'utf8');

    const mdLines = [
      `# Audit-Issues — ${stamp}`,
      '',
      `${issues.length} Befund(e) (${allFails.length} FAIL, ${allWarns.length} WARN, dedupliziert per Projekt+Standard)`,
      '',
      'Anwendbar via:',
      '```bash',
      'jq -c \'.[]\' audits/issues-' + stamp + '.json | while read -r i; do',
      '  gh issue create \\',
      '    --title "$(echo "$i" | jq -r .title)" \\',
      '    --body  "$(echo "$i" | jq -r .body)" \\',
      '    --label "$(echo "$i" | jq -r \'.labels | join(",")\')"',
      'done',
      '```',
      '',
      '---',
      '',
    ];
    for (const i of issues) {
      mdLines.push(`## ${i.title}`);
      mdLines.push('');
      mdLines.push(`**Labels:** ${i.labels.map(l => `\`${l}\``).join(', ')}`);
      mdLines.push('');
      mdLines.push(i.body);
      mdLines.push('');
      mdLines.push('---');
      mdLines.push('');
    }
    writeFileSync(mdPath, mdLines.join('\n'), 'utf8');
    console.log(`\n--- --emit=issues ---`);
    console.log(`  ${issues.length} Issue(s) geschrieben:`);
    console.log(`    ${jsonPath} (gh CLI Input)`);
    console.log(`    ${mdPath}   (human-readable)`);
  }

  // Score 0-10 pro Standard (Scorecard-Pattern; SKIP zählt nicht im Nenner)
  const merged = new Map();
  for (const m of [local.perStandard ?? new Map(), ssh.perStandard ?? new Map()]) {
    for (const [id, s] of m) {
      if (!merged.has(id)) merged.set(id, { pass: 0, warn: 0, fail: 0, skip: 0 });
      const t = merged.get(id);
      t.pass += s.pass; t.warn += s.warn; t.fail += s.fail; t.skip += s.skip;
    }
  }
  if (merged.size) {
    console.log('\n--- Score 0-10 pro Standard (PASS=10, WARN=5, FAIL=0; SKIP excluded) ---');
    const sortedIds = [...merged.keys()].sort();
    let totalNum = 0, totalDen = 0;
    for (const id of sortedIds) {
      const s = merged.get(id);
      const score = computeScore(s);
      const breakdown = `(${s.pass} PASS, ${s.warn} WARN, ${s.fail} FAIL, ${s.skip} SKIP)`;
      console.log(`  ${id.padEnd(38)} ${formatScore(score)}   ${breakdown}`);
      if (score !== null) {
        const n = s.pass + s.warn + s.fail;
        totalNum += score * n;
        totalDen += n;
      }
    }
    if (totalDen > 0) {
      const overall = totalNum / totalDen;
      console.log(`  ${'OVERALL'.padEnd(38)} ${formatScore(overall)}   (gewichtet, ohne SKIPs)`);
    }
  }

  process.exit(allFails.length > 0 ? 1 : 0);
}

main();
