import 'dotenv/config';
import { runRag } from './run-rag.mjs';

const question = process.argv.slice(2).join(' ').trim();

if (!question) {
  console.error('Usage: node rag/ask.mjs "your question"');
  process.exit(1);
}

const result = await runRag(question);

console.log(JSON.stringify(result, null, 2));
