const AI_BASE_URL = process.env.AI_BASE_URL || '';
const AI_MODEL = process.env.AI_MODEL || '';
const AI_API_KEY = process.env.ANTHROPIC_API_KEY || '';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletion {
  choices: { message: { content: string } }[];
}

export function isAIAvailable(): boolean {
  return Boolean(AI_BASE_URL && AI_MODEL);
}

export async function aiChat(messages: ChatMessage[], options?: { temperature?: number; max_tokens?: number }): Promise<string> {
  if (!isAIAvailable()) {
    throw new Error('AI not configured');
  }

  const res = await fetch(`${AI_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.max_tokens ?? 4096,
    }),
  });

  if (!res.ok) {
    throw new Error(`AI API error: ${res.status} ${await res.text()}`);
  }

  const data: ChatCompletion = await res.json();
  return data.choices[0]?.message?.content ?? '';
}

export function extractJSON(text: string): unknown {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = jsonMatch ? jsonMatch[1] : text;
  return JSON.parse(raw.trim());
}
