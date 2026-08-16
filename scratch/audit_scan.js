import fs from 'fs';
import path from 'path';

function scanDir(dir) {
  const collections = new Set();
  const dangerousPatterns = [];
  const files = fs.readdirSync(dir, { recursive: true });

  for (const f of files) {
    if (typeof f === 'string' && (f.endsWith('.js') || f.endsWith('.jsx'))) {
      const full = path.join(dir, f);
      const content = fs.readFileSync(full, 'utf-8');
      
      const colMatches = content.matchAll(/collection\(\s*db\s*,\s*['"`]([^'"`]+)['"`]/g);
      for (const m of colMatches) collections.add(m[1]);
      
      const docMatches = content.matchAll(/doc\(\s*db\s*,\s*['"`]([^'"`]+)['"`]/g);
      for (const m of docMatches) collections.add(m[1]);

      if (content.includes('dangerouslySetInnerHTML')) {
        dangerousPatterns.push({ file: f, issue: 'dangerouslySetInnerHTML found' });
      }
      if (content.includes('eval(')) {
        dangerousPatterns.push({ file: f, issue: 'eval() found' });
      }
      if (content.includes('innerHTML')) {
        dangerousPatterns.push({ file: f, issue: 'innerHTML found' });
      }
    }
  }

  return { collections: Array.from(collections), dangerousPatterns };
}

const res = scanDir('src');
console.log('=== COLLECTIONS USED IN SRC ===');
console.log(res.collections);
console.log('\n=== POTENTIAL DANGEROUS PATTERNS ===');
console.log(res.dangerousPatterns);
