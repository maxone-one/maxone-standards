#!/usr/bin/env node
// audit-vector-embed.mjs — Standard 011 Live-Probe
//
// Probt alle live-Domains aus registry/projects.yml und klassifiziert das
// Vector-Embed-Pattern. Ergaenzend zur statischen audit.mjs (die nur Repos
// scannt) — dieses Script prueft, was tatsaechlich live ausgeliefert wird.
//
// Verwendung:
//   node scripts/audit-vector-embed.mjs              # alle live-Projekte
//   node scripts/audit-vector-embed.mjs --json       # maschinen-lesbar
//   node scripts/audit-vector-embed.mjs --only=karastelev.de,maxone.one
//
// Status-Klassifikation pro URL:
//   ✅ ONELINER  — embed.js Auto-Loader vorhanden (empfohlen, Standard 011)
//   ✅ MANUAL    — vector-chat.js Script + <vector-chat>-Tag (Fallback-Pattern, OK)
//   ❌ NO-TAG    — vector-chat.js Script gefunden, aber <vector-chat>-Tag fehlt (stiller Fehlschlag)
//   ⚠️  OLD-URL  — Referenz auf agent.maxone.studio (tot)
//   ❌ MISSING   — kein Vector-Embed gefunden
//   ⚠️  HTTP-ERR — Domain nicht erreichbar / HTTP-Fehler
//   – SKIP       — Customer-facing-Tag fehlt (interner Service)

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function parseArgs() {
  const a = {};
  for (const arg of process.argv.slice(2)) {
    const [k, v] = arg.replace(/^--/, '').split('=');
    a[k] = v ?? true;
  }
  return a;
}

function loadRegistry() {
  const text = readFileSync(join(ROOT, 'registry', 'projects.yml'), 'utf8');
  return yaml.load(text).projects;
}

async function probe(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': 'maxone-vector-embed-audit/1.0' }
    });
    clearTimeout(t);
    if (!res.ok) return { ok: false, status: res.status };
    const html = await res.text();
    return { ok: true, html, finalUrl: res.url };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function classify(html) {
  const hasOneLiner = /agent\.maxone\.one\/widget\/embed\.js/.test(html);
  const hasOldUrl = /agent\.maxone\.studio/.test(html);
  const hasWidgetScript = /agent\.maxone\.one\/widget\/vector-chat\.js/.test(html);
  const hasTag = /<vector-chat[\s>]/.test(html);

  if (hasOldUrl) return { code: 'OLD-URL', icon: '⚠️ ', detail: 'agent.maxone.studio referenziert (tot)' };
  if (hasOneLiner) return { code: 'ONELINER', icon: '✅', detail: 'embed.js Auto-Loader' };
  if (hasWidgetScript && hasTag) return { code: 'MANUAL', icon: '✅', detail: 'vector-chat.js + <vector-chat>' };
  if (hasWidgetScript && !hasTag) return { code: 'NO-TAG', icon: '❌', detail: 'Script geladen, <vector-chat>-Tag fehlt (stiller Fehlschlag)' };
  // Component-Frameworks rendern Tag client-seitig — unsicher per static HTML
  if (hasTag && !hasWidgetScript) return { code: 'TAG-ONLY', icon: '⚠️ ', detail: '<vector-chat> ohne Script (laedt der Tag selbst?)' };
  return { code: 'MISSING', icon: '❌', detail: 'kein Vector-Embed gefunden' };
}

async function main() {
  const args = parseArgs();
  const only = args.only ? args.only.split(',') : null;
  const json = args.json;
  const projects = loadRegistry()
    .filter(p => p.status === 'live' && p.domain)
    .filter(p => !only || only.includes(p.domain) || only.includes(p.name));

  const results = [];
  for (const p of projects) {
    const url = `https://${p.domain}/`;
    const r = await probe(url);
    let row;
    if (!r.ok) {
      row = { project: p.name, domain: p.domain, code: 'HTTP-ERR', icon: '⚠️ ', detail: r.error || `HTTP ${r.status}` };
    } else {
      const c = classify(r.html);
      row = { project: p.name, domain: p.domain, ...c };
    }
    results.push(row);
    if (!json) {
      const proj = row.project.padEnd(22);
      const dom = row.domain.padEnd(28);
      console.log(`${row.icon} ${proj} ${dom} ${row.code.padEnd(10)} ${row.detail}`);
    }
  }

  if (json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // Summary
  const counts = results.reduce((acc, r) => { acc[r.code] = (acc[r.code] || 0) + 1; return acc; }, {});
  console.log('');
  console.log('Summary:', Object.entries(counts).map(([k, v]) => `${k}=${v}`).join('  '));

  // Exit-Code: FAIL wenn ein hard-fail (NO-TAG / MISSING / OLD-URL)
  const hardFail = results.some(r => ['NO-TAG', 'MISSING', 'OLD-URL'].includes(r.code));
  process.exit(hardFail ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });
