// src/lib/salary.ts
export const DEFAULT_USD_TO_EGP = 50

/** "65,000 EGP/month" — returns "TBD" when any field is missing */
export function formatSalary(
  amount: number | null | undefined,
  currency: string | null | undefined,
  period: string | null | undefined,
): string {
  if (amount == null || !currency || !period) return 'TBD'
  return `${amount.toLocaleString()} ${currency}/${period}`
}

/** Monthly EGP equivalent for chart comparison. Returns null when any field is missing. */
export function salaryToEGP(
  amount: number | null | undefined,
  currency: string | null | undefined,
  period: string | null | undefined,
  usdToEgp: number = DEFAULT_USD_TO_EGP,
): number | null {
  if (amount == null || !currency || !period) return null
  const monthly = period === 'year' ? amount / 12 : amount
  return currency === 'USD' ? monthly * usdToEgp : monthly
}

export function sortBySalary<T>(
  items: T[],
  getSalary: (item: T) => {
    salary_amount: number | null
    salary_currency: string | null
    salary_period: string | null
  },
): T[] {
  return [...items].sort((a, b) => {
    const s = getSalary(a)
    const t = getSalary(b)
    const va = salaryToEGP(s.salary_amount, s.salary_currency, s.salary_period)
    const vb = salaryToEGP(t.salary_amount, t.salary_currency, t.salary_period)
    if (va === null && vb === null) return 0
    if (va === null) return 1
    if (vb === null) return -1
    return vb - va
  })
}
