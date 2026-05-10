import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "",
  baseURL: "https://api.deepseek.com",
});

export async function callDeepSeek(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const response = await client.chat.completions.create({
    model: "deepseek-chat",
    max_tokens: options?.maxTokens ?? 4096,
    temperature: options?.temperature ?? 0.3,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek returned no content");
  }
  return content;
}
