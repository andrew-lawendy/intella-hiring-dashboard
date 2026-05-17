import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

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
          <Textarea
            value={scorer.value}
            onChange={(e) => scorer.onChange(e.target.value)}
            placeholder={`${scorer.label}'s notes...`}
            className="min-h-[54px] text-xs resize-y"
          />
          <Button size="xs" onClick={() => handleSave(scorer.key)} className="mt-1.5">
            Save
          </Button>
          {scorer.saved && (
            <span className="text-[10.5px] text-[var(--green)] ml-2 font-medium">Saved</span>
          )}
        </div>
      ))}
    </div>
  )
}
