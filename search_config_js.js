import fs from 'fs';

const content = fs.readFileSync('C:/Users/fanwi/Antigravity proyects/mesbg-app/js/liga_final_v6.js', 'utf8');

console.log("Searching liga_final_v6.js for firestore collections/docs...");
const regex = /doc\(|collection\(/g;
let match;
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('config') || line.includes('league') || line.includes('doc(') || line.includes('collection(')) {
    if (line.includes('db')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
process.exit(0);
