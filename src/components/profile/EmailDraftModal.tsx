import { useState } from 'react'
import { generateEmailDraft } from '@/lib/emailDraft'
import type { Database } from '@/lib/database.types'

type Candidate = Database['public']['Tables']['candidates']['Row']
type State = Database['public']['Tables']['interview_state']['Row']

interface EmailDraftModalProps {
  candidate: Candidate
  state: State
  domains: string[]
  onClose: () => void
}

export function EmailDraftModal({ candidate, state, domains, onClose }: EmailDraftModalProps) {
  const draft = generateEmailDraft(
    { name: candidate.name, email: candidate.email },
    state.verdict,
    domains,
  )

  const [to, setTo] = useState(draft.to)
  const [subject, setSubject] = useState(draft.subject)
  const [body, setBody] = useState(draft.body)

  const openInMail = () => {
    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(url)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[600] flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-bg rounded-[var(--radius)] w-full max-w-[620px] overflow-hidden shadow-[var(--shadow-lg)]">
        <div className="bg-accent px-5 py-4 flex justify-between items-center">
          <span className="font-semibold text-sm text-bg">Email Draft — {candidate.name}</span>
          <button
            onClick={onClose}
            className="text-bg/70 hover:text-bg text-lg bg-transparent border-none cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="p-5 flex flex-col gap-3">
          {[
            { label: 'To', value: to, onChange: setTo },
            { label: 'Subject', value: subject, onChange: setSubject },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-[11px] font-semibold uppercase text-text3 mb-1">
                {field.label}
              </label>
              <input
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-full px-2.5 py-2 border border-border rounded-[var(--radius-xs)] bg-surface2 text-text font-sans text-xs outline-none focus:border-text"
              />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-text3 mb-1">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full px-2.5 py-2 border border-border rounded-[var(--radius-xs)] bg-surface2 text-text font-sans text-xs outline-none focus:border-text resize-y"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-[var(--radius-xs)] text-text2 text-xs font-medium cursor-pointer hover:bg-surface2"
            >
              Cancel
            </button>
            <button
              onClick={openInMail}
              className="px-4 py-2 bg-accent text-bg rounded-[var(--radius-xs)] text-xs font-semibold cursor-pointer hover:opacity-85"
            >
              Open in Mail App
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
