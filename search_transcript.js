import fs from 'fs';
import readline from 'readline';

async function search() {
  const fileStream = fs.createReadStream('C:/Users/fanwi/.gemini/antigravity/brain/1d338ac9-6476-4641-bccd-0c3751e25570/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("Searching transcript for 'config' or 'loadLeagueData'...");
  let count = 0;
  for await (const line of rl) {
    if (line.includes('loadLeagueData') && line.includes('function')) {
      console.log(`Line matches: ${line.substring(0, 1000)}`);
      count++;
      if (count > 10) break;
    }
  }
  process.exit(0);
}

search();
