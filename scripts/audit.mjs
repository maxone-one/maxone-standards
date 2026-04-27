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

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

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

function runChecks(checks, projects, filterStandard, kind) {
  const results = { pass: 0, fail: 0, warn: 0, skip: 0 };
  const failures = [];
  const warnings = [];
  for (const project of projects) {
    let printedHeader = false;
    for (const [id, fn] of Object.entries(checks)) {
      if (filterStandard && !id.startsWith(filterStandard)) continue;
      let r;
      try { r = fn(project); }
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

function main() {
  const args = parseArgs();
  let registry = loadRegistry();
  if (args.project) {
    registry = registry.filter(p => p.name === args.project);
    if (!registry.length) { console.error(`Projekt nicht in Registry: ${args.project}`); process.exit(2); }
  }

  console.log(`maxone-standards audit — ${registry.length} Projekt(e)`);

  const local = runChecks(localChecks, registry, args.standard, 'local');

  let ssh = { results: { pass: 0, fail: 0, warn: 0, skip: 0 }, failures: [], warnings: [] };
  if (!args['local-only']) {
    console.log('\n--- SSH-Checks (--local-only zum Überspringen) ---');
    ssh = runChecks(sshChecks, registry, args.standard, 'ssh');
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
