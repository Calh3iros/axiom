#!/usr/bin/env node

/**
 * validate-i18n.js — Structural integrity check for i18n message files.
 * 
 * WHAT IT DOES:
 * 1. Reads en.json as the reference locale
 * 2. Discovers ALL nested sub-objects inside every top-level namespace
 * 3. Verifies that every locale has the same nested structure
 * 4. Exits with code 1 if any nested object is missing → blocks CI
 * 
 * USAGE: node scripts/validate-i18n.js
 * 
 * This runs in CI BEFORE the build step. If any future i18n script
 * destroys nested structure, CI fails before the broken code deploys.
 */

const fs = require('fs');
const path = require('path');

const MESSAGES_DIR = path.join(__dirname, '..', 'src', 'messages');
const LOCALES = ['en', 'pt', 'es', 'fr', 'de', 'zh'];
const REFERENCE_LOCALE = 'en';

// ─── Helper: find all nested objects recursively ────────────────────

function findNestedObjects(obj, prefix = '') {
  const result = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const path = prefix ? `${prefix}.${key}` : key;
      result.push({ path, keyCount: Object.keys(value).length });
      // Recurse one level deeper (for deeply nested structures)
      const deeper = findNestedObjects(value, path);
      result.push(...deeper);
    }
  }
  return result;
}

// ─── Main ───────────────────────────────────────────────────────────

console.log('🔍 Validating i18n structure...\n');

// 1. Read reference locale
const refPath = path.join(MESSAGES_DIR, `${REFERENCE_LOCALE}.json`);
if (!fs.existsSync(refPath)) {
  console.error(`❌ Reference file not found: ${refPath}`);
  process.exit(1);
}

const refData = JSON.parse(fs.readFileSync(refPath, 'utf-8'));

// 2. Discover all nested objects in reference
const refNested = findNestedObjects(refData);
console.log(`📋 Reference (${REFERENCE_LOCALE}.json): ${refNested.length} nested objects found\n`);

for (const { path: p, keyCount } of refNested) {
  console.log(`   ${p} (${keyCount} keys)`);
}

console.log('');

// 3. Validate each locale
let errors = 0;

for (const locale of LOCALES) {
  const localePath = path.join(MESSAGES_DIR, `${locale}.json`);
  
  if (!fs.existsSync(localePath)) {
    console.error(`❌ ${locale}.json: FILE NOT FOUND`);
    errors++;
    continue;
  }

  const localeData = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
  const localeNested = findNestedObjects(localeData);
  const localeNestedPaths = new Set(localeNested.map(n => n.path));

  let localeMissing = 0;

  for (const { path: refPath, keyCount } of refNested) {
    if (!localeNestedPaths.has(refPath)) {
      console.error(`❌ ${locale}.json: MISSING nested object "${refPath}" (${keyCount} keys in reference)`);
      localeMissing++;
      errors++;
    }
  }

  if (localeMissing === 0) {
    console.log(`✅ ${locale}.json: all ${refNested.length} nested objects present`);
  }
}

console.log('');

// 4. Also validate that top-level namespaces exist in all locales
const refTopKeys = Object.keys(refData);
for (const locale of LOCALES) {
  if (locale === REFERENCE_LOCALE) continue;
  const localeData = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), 'utf-8'));
  const missingTop = refTopKeys.filter(k => !(k in localeData));
  if (missingTop.length > 0) {
    console.error(`⚠️  ${locale}.json: Missing top-level namespaces: ${missingTop.join(', ')}`);
    // Warning only, not a hard error (some namespaces may not be translated yet)
  }
}

// 5. Exit
if (errors > 0) {
  console.error(`\n❌ VALIDATION FAILED: ${errors} missing nested object(s).`);
  console.error('   Fix: restore the missing nested objects from git history.');
  console.error('   Run: node /tmp/comprehensive-i18n-restore.js');
  process.exit(1);
} else {
  console.log('✅ All i18n structure checks passed.');
  process.exit(0);
}
