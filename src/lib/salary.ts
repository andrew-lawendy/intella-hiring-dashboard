const USD_TO_EGP = 50

export function parseSalaryToEGP(raw: string | null | undefined): number | null {
  if (!raw || raw === 'TBD' || raw === '—') return null

  // USD per month: $3,200/month or $3,000-$3,200/month
  const usdMatch = raw.match(/\$([0-9,]+)(?:\s*-\s*\$?([0-9,]+))?/)
  if (usdMatch) {
    const lo = parseFloat(usdMatch[1].replace(/,/g, ''))
    const hi = usdMatch[2] ? parseFloat(usdMatch[2].replace(/,/g, '')) : lo
    return ((lo + hi) / 2) * USD_TO_EGP
  }

  // K range: 85K-100K EGP or 85,000-100,000 EGP
  const kRangeMatch = raw.match(/([0-9]+)[Kk]?\s*-\s*([0-9]+)[Kk]?/)
  if (kRangeMatch) {
    const lo = parseFloat(kRangeMatch[1]) * (raw.toLowerCase().includes('k') ? 1000 : 1)
    const hi = parseFloat(kRangeMatch[2]) * (raw.toLowerCase().includes('k') ? 1000 : 1)
    return (lo + hi) / 2
  }

  // Plain number with EGP
  const plainMatch = raw.match(/([0-9][0-9,]*)\s*(?:EGP|egp)?/)
  if (plainMatch) {
    const val = parseFloat(plainMatch[1].replace(/,/g, ''))
    if (val > 100) return val
  }

  return null
}

export function sortBySalary<T>(items: T[], getRaw: (item: T) => string | null | undefined): T[] {
  return [...items].sort((a, b) => {
    const va = parseSalaryToEGP(getRaw(a))
    const vb = parseSalaryToEGP(getRaw(b))
    if (va === null && vb === null) return 0
    if (va === null) return 1
    if (vb === null) return -1
    return vb - va
  })
}
