import { useState, useEffect } from 'react'
import {
  loadApiKey,
  saveApiKey,
  clearApiKey,
  maskApiKey,
  isValidApiKey,
  PROVIDER_LABELS,
  PROVIDER_PLACEHOLDERS,
} from '@/lib/chat'
import type { Provider } from '@/lib/chat'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const PROVIDERS: Provider[] = ['anthropic', 'openai', 'google']

interface ApiKeyBannerProps {
  onKeyChange: (key: string | null, provider: Provider) => void
}

export function ApiKeyBanner({ onKeyChange }: ApiKeyBannerProps) {
  const [provider, setProvider] = useState<Provider>('anthropic')
  const [input, setInput] = useState('')
  const [active, setActive] = useState(false)

  useEffect(() => {
    const key = loadApiKey(provider)
    if (key) {
      setActive(true)
      setInput(maskApiKey(key))
      onKeyChange(key, provider)
    } else {
      setActive(false)
      setInput('')
      onKeyChange(null, provider)
    }
  }, [provider, onKeyChange])

  const handleSave = () => {
    if (input.includes('•')) return
    if (!isValidApiKey(provider, input)) {
      alert(`Enter a valid ${PROVIDER_LABELS[provider]} API key`)
      return
    }
    saveApiKey(provider, input)
    setActive(true)
    onKeyChange(input, provider)
    setInput(maskApiKey(input))
  }

  const handleClear = () => {
    clearApiKey(provider)
    setActive(false)
    setInput('')
    onKeyChange(null, provider)
  }

  return (
    <div
      className="rounded-[var(--radius)] border p-4 mb-5"
      style={{
        background: active ? 'var(--green-bg)' : 'var(--amber-bg)',
        borderColor: active ? 'var(--green-line)' : 'var(--amber-line)',
      }}
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text3 mb-3">
        AI Provider {active && <span className="text-[var(--green)] ml-1">● Active</span>}
      </p>

      <div className="flex gap-1 mb-3">
        {PROVIDERS.map((p) => (
          <Button
            key={p}
            size="xs"
            variant={provider === p ? 'default' : 'outline'}
            onClick={() => setProvider(p)}
          >
            {PROVIDER_LABELS[p].split(' ')[0]}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1">
          <p className="text-[12px] text-text3 mb-1.5">{PROVIDER_LABELS[provider]}</p>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder={PROVIDER_PLACEHOLDERS[provider]}
            className="max-w-xs font-mono text-xs"
          />
        </div>
        <div className="flex gap-1.5">
          <Button size="xs" onClick={handleSave}>
            Save
          </Button>
          {active && (
            <Button size="xs" variant="outline" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
