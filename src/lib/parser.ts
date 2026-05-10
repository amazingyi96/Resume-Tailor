export function parseClaudeJSON<T>(raw: string): T {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "");
    cleaned = cleaned.replace(/\n?```\s*$/, "");
  }
  return JSON.parse(cleaned) as T;
}
