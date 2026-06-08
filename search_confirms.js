import fs from 'fs';

const content = fs.readFileSync('src/views/League.jsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for window.confirm in League.jsx...");
lines.forEach((line, idx) => {
  if (line.includes('window.confirm(')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
process.exit(0);
