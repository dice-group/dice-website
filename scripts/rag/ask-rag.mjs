import 'dotenv/config';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.DICE_LLM_API_KEY || process.env.LLM_API_KEY,
  baseURL:
    process.env.DICE_LLM_BASE_URL ||
    process.env.LLM_BASE_URL ||
    'https://dice-llm-api.cs.uni-paderborn.de/v1',
});

const MODEL = process.env.LLM_MODEL || 'general-purpose';

export async function askLlm(question, context) {
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
- If the sources do not contain enough information, say so.
- Keep answers concise and useful.
- Do not mention sources that are not relevant to the answer.
- sourceNumbers must contain only source numbers that actually support the answer.
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
    throw new Error('LLM response was incomplete. Please try again.');
  }
  const content = choice?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('LLM returned an empty answer.');
  }
  // Some compatible models add a JSON fence despite the output instructions.
  const json = content
    .trim()
    .replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1');
  let result;
  try {
    result = JSON.parse(json);
  } catch {
    throw new Error('LLM returned invalid answer JSON. Please try again.');
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
    throw new Error('LLM returned an invalid answer format. Please try again.');
  }
  return {
    answer: result.answer,
    sourceNumbers: [...new Set(result.sourceNumbers)],
  };
}
