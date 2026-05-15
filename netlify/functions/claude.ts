import type { Handler } from '@netlify/functions'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const apiKey = event.headers['x-api-key']
  if (!apiKey) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Missing x-api-key header' }),
    }
  }

  try {
    const response = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: event.body ?? '',
    })

    const data = await response.text()

    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: data,
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Proxy request failed', detail: String(err) }),
    }
  }
}
