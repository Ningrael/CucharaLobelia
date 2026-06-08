import fs from 'fs';
import readline from 'readline';

async function run() {
  const fileStream = fs.createReadStream('C:/Users/fanwi/.gemini/antigravity/brain/1d338ac9-6476-4641-bccd-0c3751e25570/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("Searching transcript for firestore rules...");
  for await (const line of rl) {
    if (line.toLowerCase().includes('rules_version') || line.toLowerCase().includes('service cloud.firestore')) {
      console.log(`[Rules] ${line.substring(0, 1000)}...`);
    }
  }
}
run();
