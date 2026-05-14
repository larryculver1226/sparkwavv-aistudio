
import { genkit } from 'genkit';
import path from 'path';
import fs from 'fs';

const promptDir = path.resolve(process.cwd(), 'backend/prompts');
console.log('Checking prompt dir:', promptDir);
if (fs.existsSync(promptDir)) {
  console.log('Dir exists. Contents:', fs.readdirSync(promptDir));
} else {
  console.log('Dir does NOT exist');
}

const ai = genkit({
  promptDir: promptDir,
});

try {
  const p = ai.prompt('skylarBase');
  console.log('Prompt found:', p.name);
} catch (e) {
  console.error('Prompt NOT found:', e.message);
}
