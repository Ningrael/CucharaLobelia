import fs from 'fs';
import readline from 'readline';

async function run() {
  const fileStream = fs.createReadStream('src/views/League.jsx');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("Searching for fixture or publish in League.jsx...");
  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (line.includes('publish') || line.includes('fixture') || line.includes('publicar')) {
      console.log(`${lineNum}: ${line.trim()}`);
    }
  }
}
run();
