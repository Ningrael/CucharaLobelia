import fs from 'fs';
import readline from 'readline';

async function run() {
  const fileStream = fs.createReadStream('C:/Users/fanwi/.gemini/antigravity/brain/1d338ac9-6476-4641-bccd-0c3751e25570/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let printed = 0;
  for await (const line of rl) {
    if (line.toLowerCase().includes('password')) {
      console.log(`[Line] ${line.substring(0, 1000)}`);
      printed++;
      if (printed > 100) break;
    }
  }
}
run();
