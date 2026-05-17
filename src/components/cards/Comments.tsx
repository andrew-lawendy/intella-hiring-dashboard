import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface CommentsProps {
  candidateId: string
  myComment: string
  coComment: string
  myLabel: string
  coLabel: string
  onMySave: (comment: string) => void
}

export function Comments({ myComment, coComment, myLabel, coLabel, onMySave }: CommentsProps) {
  const [myDraft, setMyDraft] = useState(myComment)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    onMySave(myDraft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="px-4 py-3.5 border-t border-border">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text3 mb-3">
        Comments
      </p>

      {/* Current user's comment — editable */}
      <div className="mb-3">
        <p className="text-[10.5px] font-medium text-text2 mb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--purple)]" />
          {myLabel}
        </p>
        <Textarea
          value={myDraft}
          onChange={(e) => setMyDraft(e.target.value)}
          placeholder={`${myLabel}'s notes...`}
          className="min-h-[54px] text-xs resize-y"
        />
        <Button size="xs" onClick={handleSave} className="mt-1.5">
          Save
        </Button>
        {saved && <span className="text-[10.5px] text-[var(--green)] ml-2 font-medium">Saved</span>}
      </div>

      {/* Co-scorer's comment — read-only */}
      <div>
        <p className="text-[10.5px] font-medium text-text2 mb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--blue)]" />
          {coLabel}
        </p>
        <Textarea
          value={coComment}
          readOnly
          placeholder={`${coLabel}'s notes...`}
          className="min-h-[54px] text-xs resize-y opacity-60 cursor-default"
        />
      </div>
    </div>
  )
}
