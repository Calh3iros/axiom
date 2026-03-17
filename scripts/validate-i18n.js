#!/usr/bin/env node

/**
 * validate-i18n.js — Structural & key integrity check for i18n message files.
 *
 * CHECKS:
 * 1. All nested objects in en.json exist in every locale
 * 2. All LEAF KEYS in en.json exist in every locale (no silent fallback)
 * 3. No orphan leaf keys in any locale (not present in en.json)
 * 4. Top-level namespace parity
 *
 * EXIT 0 = all checks pass
 * EXIT 1 = missing or orphan keys found → blocks CI
 *
 * USAGE: node scripts/validate-i18n.js
 * Runs in CI BEFORE build step.
 */

const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '..', 'src', 'messages');
const LOCALES = ['en', 'pt', 'es', 'fr', 'de', 'zh'];
const REF = 'en';

// ─── Helpers ────────────────────────────────────────────────────────

/** Find all nested objects (recursive), returns [{path, keyCount}] */
function findNestedObjects(obj, prefix = '') {
  const result = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const p = prefix ? `${prefix}.${key}` : key;
      result.push({ path: p, keyCount: Object.keys(value).length });
      result.push(...findNestedObjects(value, p));
    }
  }
  return result;
}

/** Extract all leaf keys with full dotted path */
function getLeafKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getLeafKeys(value, p));
    } else {
      keys.push(p);
    }
  }
  return keys;
}

// ─── Main ───────────────────────────────────────────────────────────

console.log('🔍 Validating i18n structure & keys...\n');

const refPath = path.join(MESSAGES_DIR, `${REF}.json`);
if (!fs.existsSync(refPath)) {
  console.error(`❌ Reference file not found: ${refPath}`);
  process.exit(1);
}

const refData = JSON.parse(fs.readFileSync(refPath, 'utf-8'));
let errors = 0;

// ─── CHECK 1: Nested objects ────────────────────────────────────────

const refNested = findNestedObjects(refData);
console.log(`📋 Nested objects in ${REF}.json: ${refNested.length}\n`);

for (const locale of LOCALES) {
  const lp = path.join(MESSAGES_DIR, `${locale}.json`);
  if (!fs.existsSync(lp)) {
    console.error(`❌ ${locale}.json: FILE NOT FOUND`);
    errors++;
    continue;
  }
  const ld = JSON.parse(fs.readFileSync(lp, 'utf-8'));
  const ln = new Set(findNestedObjects(ld).map(n => n.path));

  const missing = refNested.filter(r => !ln.has(r.path));
  if (missing.length > 0) {
    for (const m of missing) {
      console.error(`❌ ${locale}.json: MISSING nested object "${m.path}" (${m.keyCount} keys)`);
      errors++;
    }
  } else {
    console.log(`✅ ${locale}.json: all ${refNested.length} nested objects present`);
  }
}

// ─── CHECK 2: Leaf key completeness ─────────────────────────────────

console.log('');
const refLeafKeys = getLeafKeys(refData);
const refLeafSet = new Set(refLeafKeys);
console.log(`📋 Leaf keys in ${REF}.json: ${refLeafKeys.length}\n`);

for (const locale of LOCALES) {
  const lp = path.join(MESSAGES_DIR, `${locale}.json`);
  if (!fs.existsSync(lp)) continue;
  const ld = JSON.parse(fs.readFileSync(lp, 'utf-8'));
  const localeLeafKeys = getLeafKeys(ld);
  const localeLeafSet = new Set(localeLeafKeys);

  // Missing in locale (present in en, absent in locale)
  const missing = refLeafKeys.filter(k => !localeLeafSet.has(k));
  // Orphan in locale (present in locale, absent in en)
  const orphan = localeLeafKeys.filter(k => !refLeafSet.has(k));

  if (missing.length === 0 && orphan.length === 0) {
    console.log(`✅ ${locale}.json: ${localeLeafKeys.length} leaf keys, 0 missing, 0 orphans`);
  } else {
    if (missing.length > 0) {
      console.error(`❌ ${locale}.json: MISSING ${missing.length} leaf key(s):`);
      for (const k of missing) console.error(`   - ${k}`);
      errors += missing.length;
    }
    if (orphan.length > 0) {
      console.error(`❌ ${locale}.json: ${orphan.length} ORPHAN key(s) (not in en.json):`);
      for (const k of orphan) console.error(`   - ${k}`);
      errors += orphan.length;
    }
  }
}

// ─── Result ─────────────────────────────────────────────────────────

console.log('');
if (errors > 0) {
  console.error(`❌ VALIDATION FAILED: ${errors} issue(s) found.`);
  process.exit(1);
} else {
  console.log(`✅ All ${LOCALES.length} locales have ${refLeafKeys.length} leaf keys, 0 missing, 0 orphans.`);
  console.log('✅ All i18n checks passed.');
  process.exit(0);
}
