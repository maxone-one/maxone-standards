#!/usr/bin/env node
// check-standard-refs.mjs — flag references to non-existent standard numbers.
//
// Drift-Problem: Docs verweisen auf "Standard 035" oder "036-spec-archive", obwohl
// das Repo bei Cap 33 endet und das Thema laengst in eine bestehende Nummer
// gefaltet wurde. Dieser Guard leitet die GUELTIGE Menge aus den Dateinamen
// standards/NNN-*.md ab (die SSoT) und scannt Markdown-Docs nach Verweisen auf
// Nummern, die es nicht gibt.
//
// Scannt: dieses Repo + (falls vorhanden) Max' Wissensebene unter ~/.claude
// (CLAUDE.md, INDEX.md, ACADEMY.md, memory, maxone-wiki, projects, plans). Die
// Harness-Interna (gsd-core, agents, cache, tmp) werden bewusst NICHT gescannt,
// die enthalten "200-line"/"500-character" o.ae. ohne Standard-Bezug.
// Zusaetzliche Roots als CLI-Argumente moeglich.
//
// Erkennung nur mit eindeutigem Standard-Kontext (kein "200-line"-Rauschen):
//   "Standard NNN"  ODER  "standards/NNN-", "standard: NNN-", "[NNN-" (Pfad/Frontmatter/Link).
// Grenze: eine in-range falsch benannte Referenz (z.B. "008-domain-policy", real
// 006) wird nicht erkannt, das braeuchte Namens-Abgleich.
//
// Usage: node scripts/check-standard-refs.mjs [extra-root ...]
// Exit 1, wenn stale Referenzen gefunden werden.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, '..');
const STANDARDS_DIR = join(REPO, 'standards');

// Gueltige Standard-Nummern = NNN-Praefix jeder existierenden standards/NNN-*.md
const VALID = new Set(
  readdirSync(STANDARDS_DIR)
    .map((f) => /^(\d{3})-/.exec(f)?.[1])
    .filter(Boolean),
);

// Historische Logs (Erstellungs-Chronik mit Alt-Nummern), bewusste Working-Numbers
// und append-only-Archive (per Notiz korrigiert): nicht flaggen.
const IGNORE_BASENAMES = new Set(['PLAN.md', 'BUGS.md']);
const IGNORE_SUBSTR = [
  'project_pioneer_052_convergence_pending',
  'project_standards_artefakte_2026-05-26',
  'archive_completed_sprints',
];

const SKIP_DIRS = new Set(['.git', 'node_modules', '.next', 'dist', 'build', '.turbo']);

function* walkMd(p, depth = 0) {
  if (depth > 12) return;
  let st;
  try { st = statSync(p); } catch { return; }
  if (st.isFile()) { if (extname(p) === '.md') yield p; return; }
  let entries;
  try { entries = readdirSync(p, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    if (e.isDirectory()) yield* walkMd(join(p, e.name), depth + 1);
    else if (e.isFile() && extname(e.name) === '.md') yield join(p, e.name);
  }
}

const RE_STANDARD = /Standard\s+(\d{3})\b/gi; // "Standard 035"
const RE_NAMED = /(?:standards\/|standard:\s*|\[)(\d{3})-[a-z]/gi; // Pfad / Frontmatter / Link

// Roots: dieses Repo + Max' Wissensebene (nicht die Harness-Interna).
const roots = [REPO];
const home = process.env.HOME || process.env.USERPROFILE;
if (home && existsSync(join(home, '.claude'))) {
  for (const sub of ['CLAUDE.md', 'INDEX.md', 'ACADEMY.md', 'memory', 'maxone-wiki', 'projects', 'plans']) {
    const p = join(home, '.claude', sub);
    if (existsSync(p)) roots.push(p);
  }
}
roots.push(...process.argv.slice(2));

const findings = [];
const seen = new Set();
for (const root of roots) {
  for (const file of walkMd(root)) {
    if (IGNORE_BASENAMES.has(basename(file))) continue;
    if (IGNORE_SUBSTR.some((s) => file.includes(s))) continue;
    let text;
    try { text = readFileSync(file, 'utf8'); } catch { continue; }
    text.split('\n').forEach((line, i) => {
      for (const re of [RE_STANDARD, RE_NAMED]) {
        for (const m of line.matchAll(re)) {
          if (VALID.has(m[1])) continue;
          const key = `${file}:${i + 1}:${m[1]}`;
          if (seen.has(key)) continue;
          seen.add(key);
          findings.push({ file, line: i + 1, num: m[1], ctx: line.trim().slice(0, 90) });
        }
      }
    });
  }
}

if (findings.length === 0) {
  console.log(`✓ check-standard-refs: keine Verweise auf nicht existierende Standards (${VALID.size} gueltige Nummern)`);
  process.exit(0);
}
console.error(`✖ check-standard-refs: ${findings.length} Verweis(e) auf nicht existierende Standard-Nummern\n`);
for (const f of findings) console.error(`  ${f.file}:${f.line}  [${f.num}]  ${f.ctx}`);
console.error('\nKorrigiere auf die reale Nummer (standards/README.md Index) oder ergaenze die Ignore-Liste, wenn bewusst.');
process.exit(1);
