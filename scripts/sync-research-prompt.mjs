import { readFile, writeFile } from 'node:fs/promises';

const source = await readFile(new URL('../prompts/weekly-ai-thesis.md', import.meta.url), 'utf8');
const instructions = source.match(/<instructions>([\s\S]*?)<\/instructions>/)?.[1].trim();
if (!instructions) throw new Error('The weekly research prompt must contain <instructions>.');
await writeFile(new URL('../convex/researchPrompt.ts', import.meta.url),
  `// Generated from prompts/weekly-ai-thesis.md by npm run sync:research-prompt.\n// Edit the Markdown source, then regenerate.\nexport const researchInstructions = ${JSON.stringify(instructions)};\n`);
console.log('Synced the Claude research instructions.');
