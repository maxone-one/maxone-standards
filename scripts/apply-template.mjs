#!/usr/bin/env node
// apply-template.mjs — Templates aus templates/ pro Projekt ausrollen
//
// Verwendung:
//   node scripts/apply-template.mjs --template=HANDOFF.md --project=snapflow [--target=server|local] [--dry-run]
//   node scripts/apply-template.mjs --template=HANDOFF.md --all-missing --target=server [--dry-run]
//
// --template     Template-Datei aus templates/ (mit Endung)
// --project      Ein Projekt aus der Registry
// --all-missing  Alle Projekte, deren Audit-Check für diese Datei FAIL ist
// --target       server (via SCP nach path_server/) | local (in path_local/)
//                Default: bei HANDOFF.md → server, sonst local
// --dry-run      Nur anzeigen, was passieren würde
//
// Platzhalter im Template werden ersetzt:
//   <PROJEKT>      → project.name
//   <DOMAIN>       → project.domain
//   <CONTAINER>    → project.container
//   <SERVER>       → project.server
//   <PATH_SERVER>  → project.path_server
//   <DEPLOY>       → project.deploy
//   YYYY-MM-DD     → heute (nur das erste Vorkommen pro Sektion)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SERVERS = {
  'maxone-prod':   { host: '128.140.40.235', user: 'root', key: '~/.ssh/id_ed25519' },
  'voltfair-cli':  { host: '46.225.107.118', user: 'root', key: '~/.ssh/voltfair' },
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
  return yaml.load(readFileSync(join(ROOT, 'registry', 'projects.yml'), 'utf8')).projects;
}

function expandKey(keyPath) {
  return keyPath.replace('~', process.env.HOME || process.env.USERPROFILE);
}

function ssh(server, command) {
  const cfg = SERVERS[server];
  if (!cfg) throw new Error(`unbekannter Server: ${server}`);
  return execFileSync(
    'ssh',
    ['-i', expandKey(cfg.key), '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', '-o', 'StrictHostKeyChecking=no', `${cfg.user}@${cfg.host}`, command],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
}

function scp(server, localPath, remotePath) {
  const cfg = SERVERS[server];
  if (!cfg) throw new Error(`unbekannter Server: ${server}`);
  return execFileSync(
    'scp',
    ['-i', expandKey(cfg.key), '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', '-o', 'StrictHostKeyChecking=no', localPath, `${cfg.user}@${cfg.host}:${remotePath}`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
}

function renderTemplate(text, project) {
  const today = new Date().toISOString().slice(0, 10);
  const replacements = {
    '<PROJEKT>': project.name,
    '<DOMAIN>': project.domain ?? 'n/a',
    '<CONTAINER>': project.container ?? 'n/a',
    '<SERVER>': project.server ?? 'n/a',
    '<PATH_SERVER>': project.path_server ?? 'n/a',
    '<DEPLOY>': project.deploy ?? 'n/a',
  };
  let out = text;
  for (const [k, v] of Object.entries(replacements)) {
    out = out.split(k).join(v);
  }
  // Nur das ERSTE YYYY-MM-DD im "Letzter Stand"-Header ersetzen
  out = out.replace(/(\*\*Letzter Stand:\*\*\s+)YYYY-MM-DD/, `$1${today}`);
  return out;
}

function targetPath(template, project, target) {
  if (target === 'server') {
    if (!project.path_server) throw new Error(`${project.name}: kein path_server`);
    return { server: project.server, path: `${project.path_server}/${template}` };
  } else {
    return { local: join(project.path_local, template) };
  }
}

function alreadyExists(t) {
  if (t.local) return existsSync(t.local);
  try { ssh(t.server, `test -f ${t.path}`); return true; } catch { return false; }
}

function applyOne(template, project, target, dryRun) {
  const tplPath = join(ROOT, 'templates', template);
  if (!existsSync(tplPath)) throw new Error(`Template fehlt: ${tplPath}`);
  const rendered = renderTemplate(readFileSync(tplPath, 'utf8'), project);
  const t = targetPath(template, project, target);
  const dst = t.local ?? `${t.server}:${t.path}`;

  if (alreadyExists(t)) {
    console.log(`  [skip] ${project.name.padEnd(18)} → ${dst} (existiert)`);
    return 'skip';
  }
  if (dryRun) {
    console.log(`  [DRY ] ${project.name.padEnd(18)} → ${dst}`);
    return 'dry';
  }

  if (t.local) {
    if (!existsSync(dirname(t.local))) {
      console.log(`  [skip] ${project.name.padEnd(18)} → ${dst} (Repo-Ordner fehlt)`);
      return 'skip';
    }
    writeFileSync(t.local, rendered);
  } else {
    const tmpFile = join(tmpdir(), `${template}-${project.name}-${Date.now()}`);
    writeFileSync(tmpFile, rendered);
    try { scp(t.server, tmpFile, t.path); }
    catch (e) {
      console.log(`  [FAIL] ${project.name.padEnd(18)} → ${dst}: ${e.message.slice(0, 80)}`);
      return 'fail';
    }
  }
  console.log(`  [OK]   ${project.name.padEnd(18)} → ${dst}`);
  return 'ok';
}

function main() {
  const args = parseArgs();
  if (!args.template) { console.error('--template=<datei> ist Pflicht'); process.exit(2); }

  const registry = loadRegistry();
  let projects;
  if (args.project) {
    projects = registry.filter(p => p.name === args.project);
    if (!projects.length) { console.error(`Projekt nicht in Registry: ${args.project}`); process.exit(2); }
  } else if (args['all-missing']) {
    projects = registry.filter(p => p.status === 'live' && p.path_server);
  } else {
    console.error('Entweder --project=<name> oder --all-missing nötig'); process.exit(2);
  }

  const target = args.target ?? (args.template === 'HANDOFF.md' ? 'server' : 'local');
  const dryRun = !!args['dry-run'];

  console.log(`apply-template: ${args.template} → ${target}${dryRun ? ' (DRY-RUN)' : ''}`);
  console.log(`Projekte: ${projects.map(p => p.name).join(', ')}\n`);

  const stats = { ok: 0, skip: 0, dry: 0, fail: 0 };
  for (const project of projects) {
    try {
      const result = applyOne(args.template, project, target, dryRun);
      stats[result]++;
    } catch (e) {
      console.log(`  [ERR]  ${project.name}: ${e.message}`);
      stats.fail++;
    }
  }

  console.log(`\n--- Summary --- ok:${stats.ok} skip:${stats.skip} fail:${stats.fail}${dryRun ? ` dry:${stats.dry}` : ''}`);
  process.exit(stats.fail > 0 ? 1 : 0);
}

main();
