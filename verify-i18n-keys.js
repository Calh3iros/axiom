const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const messagesDir = path.join(__dirname, 'src/messages');
const locales = ['en', 'pt', 'es', 'fr', 'de', 'zh'];

// 1. Load all dictionaries
const dicts = {};
for (const loc of locales) {
  try {
    dicts[loc] = JSON.parse(fs.readFileSync(path.join(messagesDir, `${loc}.json`), 'utf-8'));
  } catch (err) {
    console.error(`Failed to load dictionary for ${loc}:`, err);
    process.exit(1);
  }
}

// Helper to resolve nested keys "A.B.C" in object
function resolveKey(obj, keyPath) {
  return keyPath.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
}

// 2. Scan for used keys in all TSX files
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = getFiles(srcDir);
const usedKeys = new Set();
const fileKeyMap = {}; // store which file uses which keys for better error reporting

// Regex to find useTranslations('Namespace')
const useTranslationsRegex = /useTranslations\(\s*['"]([^'"]+)['"]\s*\)/g;
// Regex to find getTranslations('Namespace')
const getTranslationsRegex = /getTranslations\(\s*['"]([^'"]+)['"]\s*\)/g;

for (const file of allFiles) {
  const code = fs.readFileSync(file, 'utf-8');
  const namespaces = [];
  
  // Find namespaces
  let match;
  while ((match = useTranslationsRegex.exec(code)) !== null) { namespaces.push(match[1]); }
  while ((match = getTranslationsRegex.exec(code)) !== null) { namespaces.push(match[1]); }
  
  if (namespaces.length === 0) continue;

  // Assuming max 1 primary namespace per file for simplicity, 
  // or iterating through all localized t('key') calls.
  // A naive approach: find all t('...') or t("...") calls.
  // Actually, t('something') might map to multiple namespaces if we have multiple t hooks.
  // Let's assume t is used for namespaces[0] and t2/etc for others, but let's just use regex to find t('...'), t.rich('...')
  
  const singleQuoteRegex = /\bt(?:\.rich)?\(\s*'([^']+)'/g;
  const doubleQuoteRegex = /\bt(?:\.rich)?\(\s*"([^"]+)"/g;
  
  let keyMatch;
  while ((keyMatch = singleQuoteRegex.exec(code)) !== null) {
    // If it has a namespace like 'Dashboard.Auth', it will be 'Dashboard.Auth.' + key
    namespaces.forEach(ns => {
      usedKeys.add(`${ns}.${keyMatch[1]}`);
      if (!fileKeyMap[file]) fileKeyMap[file] = [];
      fileKeyMap[file].push(`${ns}.${keyMatch[1]}`);
    });
  }
  while ((keyMatch = doubleQuoteRegex.exec(code)) !== null) {
    namespaces.forEach(ns => {
      usedKeys.add(`${ns}.${keyMatch[1]}`);
      if (!fileKeyMap[file]) fileKeyMap[file] = [];
      fileKeyMap[file].push(`${ns}.${keyMatch[1]}`);
    });
  }
}

// 3. Verify keys in dictionaries
console.log(`\n=== 🌍 i18n DICTIONARY UNIVERSAL AUDIT ===\n`);
let totalErrors = 0;

for (const key of usedKeys) {
  locales.forEach(loc => {
    const val = resolveKey(dicts[loc], key);
    if (!val) {
      console.log(`❌ Missing Key: "${key}" in ${loc}.json`);
      // find which file uses it
      const filesUsingKey = Object.keys(fileKeyMap).filter(f => fileKeyMap[f].includes(key));
      console.log(`   Found in: ${filesUsingKey.map(f => f.split('src/')[1]).join(', ')}`);
      totalErrors++;
    }
  });
}

if (totalErrors === 0) {
  console.log(`✅ PERFECT! All ${usedKeys.size} unique keys are properly resolving across all ${locales.length} languages!`);
} else {
  console.log(`\n⚠️ Audit Failed with ${totalErrors} missing translations.`);
  process.exit(1);
}
