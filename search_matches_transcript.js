import fs from 'fs';
import readline from 'readline';

async function search() {
  const fileStream = fs.createReadStream('C:/Users/fanwi/.gemini/antigravity/brain/1d338ac9-6476-4641-bccd-0c3751e25570/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("Searching transcript for 'matches' write patterns...");
  for await (const line of rl) {
    if (line.includes('matches') && (line.includes('setDoc') || line.includes('addDoc') || line.includes('updateDoc') || line.includes('collection(db, "matches")'))) {
      if (line.includes('SUCCESS') || line.includes('success') || line.includes('added') || line.includes('write')) {
        console.log(`Line: ${line.substring(0, 1000)}`);
      }
    }
  }
  process.exit(0);
}

search();
