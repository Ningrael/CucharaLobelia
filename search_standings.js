import fs from 'fs';

const content = fs.readFileSync('src/views/League.jsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for ranking or standings calculations in League.jsx...");
lines.forEach((line, idx) => {
  if (line.includes('const sorted') || line.includes('points') || line.includes('standing') || line.includes('wins') || line.includes('p.points')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
