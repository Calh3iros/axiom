const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_SCAN = [
  path.join(__dirname, '../src/app'),
  path.join(__dirname, '../src/components'),
];

// Regex to find things that look like visible text in JSX/TSX
// E.g. >Some Text< or ="Some Text"
const rawTextRegex = />([^<>{}\n]+)</g;
const quotesRegex = /(?:placeholder|title|label|alt)="([^"]+)"/g;

function scanDirectory(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(scanDirectory(fullPath));
    } else if (fullPath.endsWith('.tsx')) {
      results = results.concat(scanFile(fullPath));
    }
  }
  return results;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const untranslated = [];

  // Match raw text between tags
  let match;
  while ((match = rawTextRegex.exec(content)) !== null) {
    const text = match[1].trim();
    // Ignore empty strings, pure numbers, common symbols, or next-intl keys (if someone used >t('key')< by accident)
    if (text && !/^[\d\W]+$/.test(text) && !text.startsWith('t(') && text.length > 2) {
      untranslated.push({ type: 'text', text, file: filePath.split('src/')[1] });
    }
  }

  // Match common hardcoded props
  while ((match = quotesRegex.exec(content)) !== null) {
    const text = match[1].trim();
    if (text && !/^[\d\W]+$/.test(text) && text.length > 2) {
      untranslated.push({ type: 'prop', text, file: filePath.split('src/')[1] });
    }
  }

  return untranslated;
}

const allUntranslated = DIRECTORIES_TO_SCAN.flatMap(scanDirectory);

console.log(`\n=== 🔎 i18n AUDIT REPORT ===\n`);

if (allUntranslated.length === 0) {
  console.log("✅ Perfect! No hardcoded English strings found in JSX/TSX.");
} else {
  console.log(`❌ Found ${allUntranslated.length} potentially untranslated strings:\n`);
  
  // Group by file
  const byFile = allUntranslated.reduce((acc, curr) => {
    if (!acc[curr.file]) acc[curr.file] = [];
    acc[curr.file].push(curr.text);
    return acc;
  }, {});

  for (const [file, strings] of Object.entries(byFile)) {
    console.log(`\n📁 ${file}`);
    strings.forEach(s => console.log(`   - "${s}"`));
  }
}
