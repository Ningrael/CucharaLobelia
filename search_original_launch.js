import fs from 'fs';
import readline from 'readline';

async function search() {
  const fileStream = fs.createReadStream('C:/Users/fanwi/.gemini/antigravity/brain/1d338ac9-6476-4641-bccd-0c3751e25570/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("Searching transcript for original handleLaunchLeague definition...");
  for await (const line of rl) {
    if (line.includes('handleLaunchLeague') && line.includes('function') && line.includes('matches')) {
      console.log(`Line: ${line.substring(0, 1000)}`);
    }
  }
  process.exit(0);
}

search();
