const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist') res.push(...walk(p));
    } else if (f.endsWith('.css') || f.endsWith('.jsx')) res.push(p);
  }
  return res;
}

const files = walk('src');
const issues = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const isCss = file.endsWith('.css');
  const isJsx = file.endsWith('.jsx');

  lines.forEach((line, i) => {
    // Look for suspicious patterns that cause dark mode contrast failures:
    // 1. color: #111111 or #000000 or #333333 or #444444 in CSS without a dark/night override
    if (isCss && /color\s*:\s*(?:#111111|#000000|#111|#000|#222|#333|#444|#555|#6E6E73|#444444)\b/i.test(line)) {
      if (!content.includes('[data-theme="dark"]') && !content.includes('[data-theme="night"]')) {
        issues.push({ file: path.relative('src', file), line: i + 1, code: line.trim(), reason: 'Hardcoded dark text in component without dark/night theme overrides' });
      }
    }

    // 2. background: #ffffff or #fff or #f7f7f4 or #f5f5f7 or #f0f0f2 without theme override
    if (isCss && /background(?:-color)?\s*:\s*(?:#ffffff|#fff|#f7f7f4|#f5f5f7|#f0f0f2|#faf9f5)\b/i.test(line)) {
      if (!content.includes('[data-theme="dark"]') && !content.includes('[data-theme="night"]') && !file.includes('index.css')) {
        issues.push({ file: path.relative('src', file), line: i + 1, code: line.trim(), reason: 'Hardcoded light background in component without dark/night theme overrides' });
      }
    }

    // 3. inline styles in JSX with hardcoded colors
    if (isJsx && /style\s*=\s*\{\{/.test(line)) {
      if (/#111111|#ffffff|#000000|#333|#6E6E73|rgba\(0,\s*0,\s*0|rgba\(255,\s*255,\s*255/i.test(line)) {
        issues.push({ file: path.relative('src', file), line: i + 1, code: line.trim(), reason: 'Inline style with hardcoded color in JSX' });
      }
    }
  });
}

console.log(`Found ${issues.length} potential contrast issues.`);
issues.forEach(iss => {
  console.log(`[${iss.file}:${iss.line}] ${iss.reason}\n    ${iss.code}`);
});
