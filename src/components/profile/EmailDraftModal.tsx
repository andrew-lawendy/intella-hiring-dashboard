import { useState } from 'react'
import { generateEmailDraft } from '@/lib/emailDraft'
import type { Database } from '@/lib/database.types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Email Draft — {candidate.name}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {[
            { label: 'To', value: to, onChange: setTo },
            { label: 'Subject', value: subject, onChange: setSubject },
          ].map((field) => (
            <div key={field.label}>
              <Label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
                {field.label}
              </Label>
              <Input
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="px-2.5 py-2 bg-muted text-foreground font-sans text-xs"
              />
            </div>
          ))}
          <div>
            <Label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1">
              Body
            </Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="px-2.5 py-2 bg-muted text-foreground font-sans text-xs resize-y"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={openInMail}>Open in Mail App</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
