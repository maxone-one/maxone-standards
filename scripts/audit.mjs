#!/usr/bin/env node
// audit.mjs — Compliance-Scan über alle Projekte gegen alle Standards
//
// Verwendung:
//   node scripts/audit.mjs                    # alle Projekte, alle Standards
//   node scripts/audit.mjs --project=snapflow # nur ein Projekt
//   node scripts/audit.mjs --standard=001     # nur eine Regel
//   node scripts/audit.mjs --local-only       # SSH-Checks überspringen
//
// SSH-Checks brauchen ~/.ssh/id_ed25519 für maxone-prod (128.140.40.235) und
// ~/.ssh/voltfair für voltfair-cli (46.225.107.118). Bei Fehler wird der Check
// als WARN (nicht FAIL) gewertet, damit das Audit auch ohne Konnektivität läuft.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
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
  '009-impressum-widget': (project) => {
    if (!project.path_local) return SKIP('kein path_local');
    if (project.tags === 'infra') return SKIP('Infra-Projekt');
    if (project.tags === 'internal') return SKIP('Internes Tool');
    const apiNew = grepRepo(project.path_local, /panel\.maxone\.one\/functions\/v1\/impressum/, 1);
    const apiOld = grepRepo(project.path_local, /panel\.maxone\.studio\/functions\/v1\/impressum/, 1);
    if (apiNew.length) return PASS(`API .one in ${apiNew[0]}`);
    if (apiOld.length) return WARN(`nutzt panel.maxone.studio (auf .one migrieren) — ${apiOld[0]}`);
    const localImpressum = grepRepo(project.path_local, /\b(impressum|imprint)\b/i, 1);
    if (localImpressum.length) return WARN(`Impressum lokal? siehe ${localImpressum[0]}`);
    return SKIP('keine Impressum-Erwähnung gefunden');
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
      impressum: /\/impressum\b/.test(text),
      datenschutz: /\/datenschutz\b/.test(text),
      year: /getFullYear\(\)|new Date\(\)/.test(text),
      attribution: /maxone\b/i.test(text),
    };
    const fails = Object.entries(checks).filter(([_, ok]) => !ok).map(([k]) => k);
    if (!fails.length) return PASS(`${footerFiles.length} Footer-Datei(en), alle Pflichten erfüllt`);
    return WARN(`Footer fehlt: ${fails.join(', ')}`);
  },
};

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
};

// --- Runner ---

async function runChecks(checks, projects, filterStandard, kind) {
  const results = { pass: 0, fail: 0, warn: 0, skip: 0 };
  const failures = [];
  const warnings = [];
  for (const project of projects) {
    let printedHeader = false;
    for (const [id, fn] of Object.entries(checks)) {
      if (filterStandard && !id.startsWith(filterStandard)) continue;
      let r;
      try { r = await fn(project); }
      catch (err) { r = FAIL(`Check-Fehler: ${err.message.slice(0, 100)}`); }

      if (!printedHeader) { console.log(`\n=== ${project.name} (${kind}) ===`); printedHeader = true; }
      if (r.skip) { results.skip++; console.log(`  [skip] ${id} — ${r.msg}`); }
      else if (r.warn) { results.warn++; warnings.push({ project: project.name, id, msg: r.msg }); console.log(`  [WARN] ${id} — ${r.msg}`); }
      else if (r.ok) { results.pass++; console.log(`  [OK]   ${id}${r.msg ? ' — ' + r.msg : ''}`); }
      else { results.fail++; failures.push({ project: project.name, id, msg: r.msg }); console.log(`  [FAIL] ${id} — ${r.msg}`); }
    }
  }
  return { results, failures, warnings };
}

async function main() {
  const args = parseArgs();
  OFFLINE = !!args['local-only'];
  let registry = loadRegistry();
  if (args.project) {
    registry = registry.filter(p => p.name === args.project);
    if (!registry.length) { console.error(`Projekt nicht in Registry: ${args.project}`); process.exit(2); }
  }

  console.log(`maxone-standards audit — ${registry.length} Projekt(e)`);

  const local = await runChecks(localChecks, registry, args.standard, 'local');

  let ssh = { results: { pass: 0, fail: 0, warn: 0, skip: 0 }, failures: [], warnings: [] };
  if (!args['local-only']) {
    console.log('\n--- SSH-Checks (--local-only zum Überspringen) ---');
    ssh = await runChecks(sshChecks, registry, args.standard, 'ssh');
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

  process.exit(allFails.length > 0 ? 1 : 0);
}

main();
