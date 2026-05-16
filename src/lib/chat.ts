export type Provider = 'anthropic' | 'openai' | 'google'
export type ChatMessage = { role: 'user' | 'assistant'; content: string }

const MAX_HISTORY = 20

const STORAGE_KEYS: Record<Provider, string> = {
  anthropic: 'intella_api_key_anthropic',
  openai: 'intella_api_key_openai',
  google: 'intella_api_key_google',
}

export const PROVIDER_LABELS: Record<Provider, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (GPT-4o mini)',
  google: 'Google (Gemini 2.0)',
}

export const PROVIDER_PLACEHOLDERS: Record<Provider, string> = {
  anthropic: 'sk-ant-...',
  openai: 'sk-proj-... or sk-...',
  google: 'AIza...',
}

export function loadApiKey(provider: Provider): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS[provider])
  } catch {
    return null
  }
}

export function saveApiKey(provider: Provider, key: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS[provider], key)
  } catch {
    /* noop */
  }
}

export function clearApiKey(provider: Provider): void {
  try {
    localStorage.removeItem(STORAGE_KEYS[provider])
  } catch {
    /* noop */
  }
}

export function maskApiKey(key: string | null): string {
  if (!key) return ''
  return key.substring(0, 12) + '••••••'
}

export function isValidApiKey(provider: Provider, key: string): boolean {
  if (!key) return false
  switch (provider) {
    case 'anthropic':
      return key.startsWith('sk-ant-')
    case 'openai':
      return key.startsWith('sk-') && !key.startsWith('sk-ant-')
    case 'google':
      return key.startsWith('AIza')
  }
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
  provider: Provider = 'anthropic',
): Promise<string> {
  const url = getApiUrl()

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ provider, system: systemPrompt, messages }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(`API error ${response.status}: ${err.error ?? response.statusText}`)
  }

  const data = await response.json()
  return data.text ?? ''
}
