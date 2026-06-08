import fs from 'fs';

const filePath = 'C:/Users/fanwi/Antigravity proyects/mesbg-app/js/liga_final_v6.js';
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  for (let i = 675; i <= 705; i++) {
    console.log(`Line ${i}: ${lines[i-1]}`);
  }
} else {
  console.log("Not found.");
}
process.exit(0);
