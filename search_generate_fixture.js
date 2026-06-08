import fs from 'fs';

const content = fs.readFileSync('src/views/League.jsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for generateFixture definition in League.jsx...");
lines.forEach((line, idx) => {
  if (line.includes('function generateFixture') || line.includes('const generateFixture') || line.includes('generateFixture =')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
