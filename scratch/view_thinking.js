import fs from 'fs';
import readline from 'readline';

async function run() {
  const fileStream = fs.createReadStream('C:/Users/fanwi/.gemini/antigravity/brain/1d338ac9-6476-4641-bccd-0c3751e25570/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const obj = JSON.parse(line);
    if (obj.step_index >= 1500 && obj.step_index <= 1515) {
      if (obj.source === 'MODEL' && obj.type === 'PLANNER_RESPONSE') {
        console.log(`[Step ${obj.step_index}] Thinking:\n${obj.thinking}\n`);
      }
    }
  }
}
run();
