import OpenAI from "openai";
import "dotenv/config";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL =
  process.env.OPENAI_MODEL;

export async function askLlm(question, context) {
  const response = await client.responses.create({
    model: MODEL,

    input: [
      {
        role: "system",
        content: `
You answer questions about the DICE Research website.

Use only the supplied context.

Rules:
- Do not invent facts.
- If the context does not contain enough information, say so.
- Prefer concise answers.
- Mention relevant project, person, paper, group, demo, or award names.
- When relevant, include the website path from the context as a source.
        `.trim(),
      },

      {
        role: "user",
        content: `
QUESTION:
${question}

CONTEXT:
${context}
        `.trim(),
      },
    ],
  });

  return response.output_text;
}