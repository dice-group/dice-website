import 'dotenv/config';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-5.4-mini';

export async function askLlm(question, context) {
  const response = await client.responses.create({
    model: MODEL,

    input: [
      {
        role: 'system',
        content: `
You answer questions about the DICE Research website.

Use only the supplied sources.

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

    text: {
      format: {
        type: 'json_schema',
        name: 'rag_answer',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            answer: {
              type: 'string',
            },
            sourceNumbers: {
              type: 'array',
              items: {
                type: 'integer',
              },
            },
          },
          required: ['answer', 'sourceNumbers'],
          additionalProperties: false,
        },
      },
    },
  });

  return JSON.parse(response.output_text);
}
