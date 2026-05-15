import { useState } from 'react'

interface CommentsProps {
  candidateId: string
  peterComment: string
  ossamaComment: string
  onSavePeter: (comment: string) => void
  onSaveOssama: (comment: string) => void
}

export function Comments({
  peterComment,
  ossamaComment,
  onSavePeter,
  onSaveOssama,
}: CommentsProps) {
  const [peter, setPeter] = useState(peterComment)
  const [ossama, setOssama] = useState(ossamaComment)
  const [peterSaved, setPeterSaved] = useState(false)
  const [ossamaSaved, setOssamaSaved] = useState(false)

  const handleSave = (scorer: 'peter' | 'ossama') => {
    if (scorer === 'peter') {
      onSavePeter(peter)
      setPeterSaved(true)
      setTimeout(() => setPeterSaved(false), 2000)
    } else {
      onSaveOssama(ossama)
      setOssamaSaved(true)
      setTimeout(() => setOssamaSaved(false), 2000)
    }
  }

  return (
    <div className="px-4 py-3.5 border-t border-border">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-3">
        Comments
      </p>
      {[
        {
          key: 'peter' as const,
          label: 'Peter',
          value: peter,
          saved: peterSaved,
          color: 'var(--purple)',
          onChange: setPeter,
        },
        {
          key: 'ossama' as const,
          label: 'Ossama',
          value: ossama,
          saved: ossamaSaved,
          color: 'var(--blue)',
          onChange: setOssama,
        },
      ].map((scorer) => (
        <div key={scorer.key} className="mb-3 last:mb-0">
          <p className="text-[10.5px] font-medium text-text2 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: scorer.color }} />
            {scorer.label}
          </p>
          <textarea
            value={scorer.value}
            onChange={(e) => scorer.onChange(e.target.value)}
            placeholder={`${scorer.label}'s notes...`}
            className="w-full font-sans text-xs text-text bg-surface2 border border-border rounded-[var(--radius-xs)] px-2.5 py-1.5 resize-y min-h-[54px] outline-none focus:border-text focus:bg-surface transition-colors"
          />
          <button
            onClick={() => handleSave(scorer.key)}
            className="mt-1.5 text-[11px] font-medium px-2.5 py-1 rounded-[var(--radius-xs)] bg-text text-bg cursor-pointer hover:opacity-85 transition-opacity border-none font-sans"
          >
            Save
          </button>
          {scorer.saved && (
            <span className="text-[10.5px] text-[var(--green)] ml-2 font-medium">Saved</span>
          )}
        </div>
      ))}
    </div>
  )
}
