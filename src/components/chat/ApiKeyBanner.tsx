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
        borderColor: active ? 'var(--green)' : 'var(--amber)',
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text3 mb-3">
        AI Provider {active && <span className="text-[var(--green)] ml-1">● Active</span>}
      </p>

      <div className="flex gap-1 mb-3">
        {PROVIDERS.map((p) => (
          <button
            key={p}
            onClick={() => setProvider(p)}
            className={`text-[11px] px-2.5 py-1 rounded-[var(--radius-xs)] border transition-all cursor-pointer ${
              provider === p
                ? 'bg-text text-bg border-text font-medium'
                : 'bg-surface border-border text-text2 hover:bg-surface2'
            }`}
          >
            {PROVIDER_LABELS[p].split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1">
          <p className="text-[10px] text-text3 mb-1.5">{PROVIDER_LABELS[provider]}</p>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder={PROVIDER_PLACEHOLDERS[provider]}
            className="w-full max-w-xs px-2.5 py-1.5 border border-border rounded-[var(--radius-xs)] bg-surface text-text font-mono text-xs outline-none focus:border-text"
          />
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={handleSave}
            className="text-[11px] font-medium px-2.5 py-1.5 bg-text text-bg rounded-[var(--radius-xs)] border-none cursor-pointer hover:opacity-85"
          >
            Save
          </button>
          {active && (
            <button
              onClick={handleClear}
              className="text-[11px] font-medium px-2.5 py-1.5 bg-surface border border-border text-text2 rounded-[var(--radius-xs)] cursor-pointer hover:bg-[var(--red-bg)] hover:text-[var(--red)] hover:border-[var(--red-line)] transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
