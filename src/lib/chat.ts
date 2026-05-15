export type ChatMessage = { role: 'user' | 'assistant'; content: string }

const API_KEY_STORAGE = 'intella_api_key'
const MAX_HISTORY = 20

export function loadApiKey(): string | null {
  try {
    return localStorage.getItem(API_KEY_STORAGE)
  } catch {
    return null
  }
}

export function saveApiKey(key: string): void {
  try {
    localStorage.setItem(API_KEY_STORAGE, key)
  } catch {
    /* noop */
  }
}

export function clearApiKey(): void {
  try {
    localStorage.removeItem(API_KEY_STORAGE)
  } catch {
    /* noop */
  }
}

export function maskApiKey(key: string | null): string {
  if (!key) return ''
  return key.substring(0, 12) + '••••••'
}

export function isValidApiKey(key: string): boolean {
  return key.startsWith('sk-ant')
}

export function trimChatHistory(history: ChatMessage[]): ChatMessage[] {
  return history.slice(-MAX_HISTORY)
}

export function getApiUrl(): string {
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:8888/.netlify/functions/claude'
  }
  return '/api/claude/v1/messages'
}

export async function sendChatMessage(
  messages: ChatMessage[],
  systemPrompt: string,
  apiKey: string,
): Promise<string> {
  const url = getApiUrl()
  const isLocal = url.includes('localhost')

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (!isLocal) headers['x-api-key'] = apiKey

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text ?? ''
}
