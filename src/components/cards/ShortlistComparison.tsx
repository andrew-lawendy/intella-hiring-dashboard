import { useCandidates } from '@/hooks/useCandidates'
import type { StateMap } from '@/hooks/useCandidateState'
import { totalScore, maxScore } from '@/lib/scoring'
import type { Scores } from '@/lib/scoring'
import { VERDICT_MAP } from '@/lib/verdicts'
import { useInterviewerNames } from '@/hooks/useInterviewerNames'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

interface ShortlistComparisonProps {
  candidateIds: string[]
  stateMap: StateMap
  onClose: () => void
}

export function ShortlistComparison({ candidateIds, stateMap, onClose }: ShortlistComparisonProps) {
  const { data, loading } = useCandidates({ ids: candidateIds })
  const getInterviewerName = useInterviewerNames()
  const max = maxScore()

  if (!candidateIds.length) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>No candidates shortlisted yet.</DialogTitle>
            <DialogDescription>Use the Shortlist button on candidate cards.</DialogDescription>
          </DialogHeader>
          <Button variant="outline" onClick={onClose} className="mx-auto">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[900px] p-0 overflow-hidden gap-0">
        <div className="bg-primary px-5 py-4 flex items-start gap-3">
          <div className="flex-1">
            <DialogTitle className="text-primary-foreground text-[16px]">
              Shortlist Comparison
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/70 text-xs mt-0.5">
              {candidateIds.length} candidates
            </DialogDescription>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="size-6" />
          </div>
        ) : (
          <div className="p-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  {[
                    'Candidate',
                    getInterviewerName('peter'),
                    getInterviewerName('ossama'),
                    'Combined',
                    'Verdict',
                    'Notes',
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="px-3 py-2.5 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map(({ candidate, analysis }) => {
                  const state = stateMap[candidate.id]
                  if (!state) return null
                  const ps = state.peter_scores as Scores
                  const os = state.ossama_scores as Scores
                  const pTotal = Object.values(ps).reduce((a, b) => a + b, 0)
                  const oTotal = Object.values(os).reduce((a, b) => a + b, 0)
                  const combined = totalScore(ps, os)

                  return (
                    <TableRow
                      key={candidate.id}
                      className="border-t border-border hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="px-3 py-2.5">
                        <p className="font-semibold text-[13px] text-foreground">
                          {candidate.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {analysis?.current_role ?? ''}
                        </p>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 font-mono font-semibold text-[13px] text-center text-foreground">
                        {pTotal || '—'}/{max}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 font-mono font-semibold text-[13px] text-center text-foreground">
                        {oTotal || '—'}/{max}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 font-mono font-bold text-[14px] text-center text-foreground">
                        {combined || '—'}/{max}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-center">
                        {state.verdict && (
                          <Badge
                            variant={
                              (state.verdict &&
                                (VERDICT_MAP[state.verdict]?.variant as
                                  | 'outline-success'
                                  | 'outline-warning'
                                  | 'outline-destructive')) ??
                              'secondary'
                            }
                          >
                            {state.verdict && VERDICT_MAP[state.verdict]?.short}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-[10px] text-muted-foreground max-w-[180px]">
                        {state.peter_comment && (
                          <span>
                            {getInterviewerName('peter')}: {state.peter_comment.slice(0, 50)}
                          </span>
                        )}
                        {state.peter_comment && state.ossama_comment && <br />}
                        {state.ossama_comment && (
                          <span>
                            {getInterviewerName('ossama')}: {state.ossama_comment.slice(0, 50)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
