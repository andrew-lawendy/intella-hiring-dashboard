import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAllComments } from '@/hooks/useAllComments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface CommentsProps {
  candidateId: string
}

export function Comments({ candidateId }: CommentsProps) {
  const { user } = useAuth()
  const { myCommentFor, allCommentsFor, setMyComment } = useAllComments(user?.id)

  const myComment = myCommentFor(candidateId)
  const [draft, setDraft] = useState(myComment)
  const [saved, setSaved] = useState(false)

  // Sync draft when candidateId changes
  useEffect(() => {
    setDraft(myCommentFor(candidateId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId])

  const allComments = allCommentsFor(candidateId)
  const others = allComments.filter((c) => !c.isMe)

  const handleSave = async () => {
    await setMyComment(candidateId, draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="px-4 py-3.5 border-t border-border">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3">
        Notes
      </p>

      {/* Current user's comment */}
      <div className="mb-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Your notes on this candidate..."
          className="min-h-[64px] text-xs resize-y"
        />
        <div className="flex items-center gap-2 mt-1.5">
          <Button size="xs" onClick={handleSave} disabled={draft === myComment}>
            Save
          </Button>
          {saved && <span className="text-[11px] text-[var(--green)] font-medium">Saved</span>}
        </div>
      </div>

      {/* Other users' comments — always visible */}
      {others.map((c) => (
        <div key={c.userId} className="mb-2 last:mb-0">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">{c.name}</p>
          <p className="text-[12px] text-foreground bg-muted/40 rounded-md px-3 py-2 leading-relaxed">
            {c.body}
          </p>
        </div>
      ))}
    </div>
  )
}
