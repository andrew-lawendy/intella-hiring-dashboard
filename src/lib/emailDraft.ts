import type { HiringRound } from '@/hooks/useHiringRound'

type Verdict = 'strong-yes' | 'yes' | 'maybe' | 'no' | null

interface EmailDraft {
  to: string
  subject: string
  body: string
}

export function generateEmailDraft(
  candidate: { name: string; email: string },
  verdict: Verdict,
  domains: string[],
  round: HiringRound | null = null,
): EmailDraft {
  const firstName = candidate.name.split(' ')[0]
  const domainStr = domains.slice(0, 2).join(' and ') || 'product management'
  const role = round?.role ?? 'Senior Product Manager'
  const roleShort = round?.role_short ?? 'Senior PM'

  const subjects: Record<NonNullable<Verdict>, string> = {
    'strong-yes': 'Great news — next steps for your application at Intella',
    yes: `Next steps — ${roleShort} role at Intella`,
    maybe: 'Thank you for interviewing with Intella',
    no: `Re: ${roleShort} application — Intella`,
  }

  const bodies: Record<NonNullable<Verdict>, string> = {
    'strong-yes': `Dear ${firstName},\n\nThank you for taking the time to interview with us for the ${role} role. We were genuinely impressed by your background, particularly your experience in ${domainStr}.\n\nWe would like to move forward with you to the next stage. Could you share your availability for a follow-up call this week?\n\nBest regards,\nPeter Ehab\nCPO, Intella`,
    yes: `Dear ${firstName},\n\nThank you for meeting with us for the ${roleShort} role at Intella. We enjoyed learning about your experience.\n\nWe would like to move forward. Please let us know your availability for a follow-up call.\n\nBest regards,\nPeter Ehab\nCPO, Intella`,
    maybe: `Dear ${firstName},\n\nThank you for taking the time to interview with us. We appreciated the conversation.\n\nWe are completing our interview process and will be in touch shortly.\n\nBest regards,\nPeter Ehab\nCPO, Intella`,
    no: `Dear ${firstName},\n\nThank you for your interest in the ${roleShort} role at Intella and for taking the time to interview with us.\n\nAfter careful consideration, we have decided to move forward with other candidates at this time. We wish you all the best.\n\nBest regards,\nPeter Ehab\nCPO, Intella`,
  }

  const subject = verdict ? subjects[verdict] : `Re: ${roleShort} Interview — Intella`
  const body = verdict
    ? bodies[verdict]
    : `Dear ${firstName},\n\nThank you for interviewing with us.\n\nBest regards,\nPeter Ehab\nCPO, Intella`

  return { to: candidate.email, subject, body }
}
