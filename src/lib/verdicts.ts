export const VERDICTS = [
  {
    value: 'strong-yes',
    label: 'Strong Yes',
    short: '⭐ Strong Yes',
    color: 'var(--green)',
    variant: 'outline-success',
  },
  { value: 'yes', label: 'Yes', short: '✓ Yes', color: 'var(--blue)', variant: 'outline-success' },
  {
    value: 'maybe',
    label: 'Maybe',
    short: '? Maybe',
    color: 'var(--amber)',
    variant: 'outline-warning',
  },
  { value: 'no', label: 'No', short: '✗ No', color: 'var(--red)', variant: 'outline-destructive' },
] as const

export type VerdictValue = (typeof VERDICTS)[number]['value']

export const VERDICT_MAP = Object.fromEntries(VERDICTS.map((v) => [v.value, v])) as Record<
  VerdictValue,
  (typeof VERDICTS)[number]
>
