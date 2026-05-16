import { useState, useRef, useEffect } from 'react'
import { sendChatMessage, trimChatHistory } from '@/lib/chat'
import type { ChatMessage, Provider } from '@/lib/chat'

interface ChatInterfaceProps {
  systemPrompt: string
  apiKey: string | null
  provider: Provider
}

export function ChatInterface({ systemPrompt, apiKey, provider }: ChatInterfaceProps) {
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, loading])

  const send = async () => {
    if (!input.trim() || loading) return
    if (!apiKey) {
      setError('Enter your API key above first.')
      return
    }

    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    const newHistory = trimChatHistory([...history, userMsg])
    setHistory(newHistory)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const reply = await sendChatMessage(newHistory, systemPrompt, apiKey, provider)
      setHistory((prev) => trimChatHistory([...prev, { role: 'assistant', content: reply }]))
    } catch (err) {
      setError(String(err))
      setHistory((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-surface border border-border rounded-[var(--radius)] p-4 min-h-[300px] max-h-[500px] overflow-y-auto flex flex-col gap-3">
        {!history.length && (
          <p className="text-text3 text-[13px] text-center my-auto">
            Ask anything about the candidates — compare them, get a ranking summary, or ask for
            debrief talking points.
          </p>
        )}
        {history.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-[14px] px-4 py-3 text-[13.5px] leading-relaxed shadow-[var(--shadow-sm)] ${
              msg.role === 'user'
                ? 'bg-text text-bg self-end rounded-tr-[4px]'
                : 'bg-surface border border-border self-start rounded-tl-[4px] text-text whitespace-pre-wrap'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="bg-surface2 border border-dashed border-border rounded-[14px] px-4 py-3 text-[12.5px] text-text3 italic self-start max-w-[80%]">
            Thinking…
          </div>
        )}
        {error && (
          <div className="bg-[var(--red-bg)] border border-[var(--red-line)] rounded-[var(--radius-xs)] px-3 py-2 text-[var(--red)] text-[12px]">
            Error: {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about candidates..."
          className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-[var(--radius-sm)] text-[13px] font-sans text-text outline-none focus:border-text transition-colors placeholder:text-text3"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-text text-bg rounded-[var(--radius-sm)] text-[12px] font-medium cursor-pointer hover:opacity-85 disabled:opacity-50 transition-opacity border-none"
        >
          Send
        </button>
      </div>
    </div>
  )
}
