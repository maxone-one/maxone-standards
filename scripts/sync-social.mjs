#!/usr/bin/env node
/**
 * Synct config/social.ts in alle bekannten Projekte.
 * Aufruf: node scripts/sync-social.mjs
 *
 * Wenn ein Handle sich ändert: config/social.ts updaten, dann dieses Script laufen lassen.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");
const STANDARDS_ROOT = "c:/Users/max/Projects";

// Ziel-Pfade relativ zu STANDARDS_ROOT
const TARGETS = [
  "vanfree/lib/social.ts",
  "voltfair.de/lib/social.ts",
  "snapflow.one/src/lib/social.ts",
  "repivot.in/frontend/src/lib/social.ts",
  "plansey-2026/lib/social.ts",
  "maxone.one/lib/social.ts",
];

const source = readFileSync(join(ROOT, "config/social.ts"), "utf-8");

const banner = `// GENERATED — nicht manuell bearbeiten.
// Quelle: maxone-standards/config/social.ts
// Aktualisieren: node maxone-standards/scripts/sync-social.mjs
//
`;

let synced = 0;
let skipped = 0;

for (const rel of TARGETS) {
  const dest = join(STANDARDS_ROOT, rel);
  const dir = dirname(dest);
  try {
    mkdirSync(dir, { recursive: true });
    const content = banner + source;
    writeFileSync(dest, content, "utf-8");
    console.log(`✅  ${rel}`);
    synced++;
  } catch (err) {
    console.warn(`⚠️  ${rel} — übersprungen (${err.message})`);
    skipped++;
  }
}

console.log(`\nFertig: ${synced} synced, ${skipped} skipped.`);
