import type { Handler } from '@netlify/functions'

type Provider = 'anthropic' | 'openai' | 'google'

const ENDPOINTS: Record<Provider, string> = {
  anthropic: 'https://api.anthropic.com/v1/messages',
  openai: 'https://api.openai.com/v1/chat/completions',
  google: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
}

const MODELS: Record<Provider, string> = {
  anthropic: 'claude-sonnet-4-5',
  openai: 'gpt-4o-mini',
  google: 'gemini-2.0-flash',
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const apiKey = event.headers['x-api-key']
  if (!apiKey) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Missing x-api-key header' }) }
  }

  let body: {
    provider?: string
    system?: string
    messages: Array<{ role: string; content: string }>
  }
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) }
  }

  const provider: Provider = (body.provider as Provider) ?? 'anthropic'
  if (!ENDPOINTS[provider]) {
    return { statusCode: 400, body: JSON.stringify({ error: `Unknown provider: ${provider}` }) }
  }

  const model = MODELS[provider]
  let reqBody: unknown
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (provider === 'anthropic') {
    headers['x-api-key'] = apiKey
    headers['anthropic-version'] = '2023-06-01'
    reqBody = { model, max_tokens: 1000, system: body.system, messages: body.messages }
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`
    const msgs = body.system
      ? [{ role: 'system', content: body.system }, ...body.messages]
      : body.messages
    reqBody = { model, max_tokens: 1000, messages: msgs }
  }

  try {
    const response = await fetch(ENDPOINTS[provider], {
      method: 'POST',
      headers,
      body: JSON.stringify(reqBody),
    })

    const raw = await response.json()

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: raw?.error?.message ?? `API error ${response.status}` }),
      }
    }

    const text =
      provider === 'anthropic'
        ? (raw.content?.[0]?.text ?? '')
        : (raw.choices?.[0]?.message?.content ?? '')

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Proxy request failed', detail: String(err) }),
    }
  }
}
