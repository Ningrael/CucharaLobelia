import fs from 'fs';
import path from 'path';

const filePath = 'C:/Users/fanwi/Antigravity proyects/mesbg-app/js/liga_final_v6.js';
if (fs.existsSync(filePath)) {
  console.log("Found liga_final_v6.js! Searching...");
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('matches') && (line.includes('addDoc') || line.includes('setDoc') || line.includes('updateDoc') || line.includes('collection(') || line.includes('doc('))) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log("liga_final_v6.js not found.");
}
process.exit(0);
