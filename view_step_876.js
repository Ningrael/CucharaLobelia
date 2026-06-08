import fs from 'fs';
import readline from 'readline';

async function search() {
  const fileStream = fs.createReadStream('C:/Users/fanwi/.gemini/antigravity/brain/1d338ac9-6476-4641-bccd-0c3751e25570/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('"step_index":876}')) {
      // Sometimes it's near the end of step 876 or formatted differently, so let's check for step_index: 876
    }
    const data = JSON.parse(line);
    if (data.step_index === 876) {
      console.log(JSON.stringify(data, null, 2));
      break;
    }
  }
  process.exit(0);
}

search();
