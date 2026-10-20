import 'dotenv/config';
import OpenAI from 'openai';
import { RagError, ragStage } from './errors.mjs';

const client = new OpenAI({
  // Return a useful provider timeout before the browser's 45-second deadline.
  timeout: 30000,
  maxRetries: 0,
  apiKey: process.env.DICE_LLM_API_KEY || process.env.LLM_API_KEY,
  baseURL:
    process.env.DICE_LLM_BASE_URL ||
    process.env.LLM_BASE_URL ||
    'https://dice-llm-api.cs.uni-paderborn.de/v1',
});

const MODEL = process.env.LLM_MODEL || 'general-purpose';

export async function askLlm(question, context) {
  return ragStage('llm', () => generateAnswer(question, context));
}

async function generateAnswer(question, context) {
  const response = await client.chat.completions.create({
    model: MODEL,

    messages: [
      {
        role: 'system',
        content: `
You answer questions about the DICE Research website.

Use only the supplied sources.

Return only a JSON object with exactly these fields:
{"answer": "your answer", "sourceNumbers": [1, 2]}
Use an empty sourceNumbers array when no supplied sources support the answer.
Do not wrap the JSON in Markdown.

Rules:
- Do not invent facts.
- Respect extraction limitations attached to PDF excerpts. Do not reconstruct damaged equations or guess dataset, model, row, or metric associations in ambiguous tables; explain the limitation and refer to the cited PDF instead.
- If the sources do not contain enough information, say so.
- Keep answers concise and useful.
- Format the answer field as Markdown. Use $...$ for inline LaTeX math and $$ on separate lines for display math. Do not put formulas in code fences or use other math delimiters.
- Escape every LaTeX backslash for valid JSON (for example, the JSON text must contain ${JSON.stringify(
          '\\frac{a}{b}'
        )} for a fraction). Escape literal dollar signs in Markdown so they are not interpreted as math.
- Use LaTeX only for formulas supported by the supplied evidence; the extraction limitations above still apply.
- Do not mention sources that are not relevant to the answer.
- sourceNumbers must contain only source numbers that actually support the answer.
- Put citations only in sourceNumbers. Do not include inline source labels or numbered citation markers such as [SOURCE 1], [SOURCE 1, SOURCE 4], or [1] in the answer text; the website displays separate source cards.
- Source numbers correspond to SOURCE 1, SOURCE 2, SOURCE 3, etc.
- Preserve names of people, projects, groups, awards, and other entities exactly as they appear in the supplied sources. Never alter or approximate names.
- If the question asks for all items in a category, but only a subset is supplied in the sources, do not imply the list is complete. Say these are examples and direct the user to the relevant category page.
        `.trim(),
      },
      {
        role: 'user',
        content: `
QUESTION:
${question}

SOURCES:
${context}
        `.trim(),
      },
    ],
  });

  const choice = response.choices?.[0];
  if (choice?.finish_reason && choice.finish_reason !== 'stop') {
    throw new RagError(
      'LLM_INCOMPLETE',
      'LLM response was incomplete. Please try again.'
    );
  }
  const content = choice?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new RagError('LLM_EMPTY', 'LLM returned an empty answer.');
  }
  // Some compatible models add a JSON fence despite the output instructions.
  const json = content
    .trim()
    .replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1');
  let result;
  try {
    result = JSON.parse(json);
  } catch {
    throw new RagError(
      'LLM_INVALID_JSON',
      'LLM returned invalid answer JSON. Please try again.'
    );
  }
  if (
    !result ||
    typeof result.answer !== 'string' ||
    !result.answer.trim() ||
    !Array.isArray(result.sourceNumbers) ||
    !result.sourceNumbers.every(
      number => Number.isInteger(number) && number > 0
    )
  ) {
    throw new RagError(
      'LLM_INVALID_FORMAT',
      'LLM returned an invalid answer format. Please try again.'
    );
  }
  return {
    answer: result.answer,
    sourceNumbers: [...new Set(result.sourceNumbers)],
  };
}
