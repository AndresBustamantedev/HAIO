/**
 * Adds one billing interval to an ISO date string (YYYY-MM-DD).
 * Returns the resulting ISO date string, or empty string for 'custom'.
 */
export function addBillingInterval(isoDate: string, interval: string): string {
  if (!isoDate || interval === "custom") return ""
  // Use noon UTC to avoid DST boundary issues
  const d = new Date(`${isoDate}T12:00:00Z`)
  switch (interval) {
    case "daily":      d.setUTCDate(d.getUTCDate() + 1); break
    case "weekly":     d.setUTCDate(d.getUTCDate() + 7); break
    case "monthly":    d.setUTCMonth(d.getUTCMonth() + 1); break
    case "quarterly":  d.setUTCMonth(d.getUTCMonth() + 3); break
    case "semiannual": d.setUTCMonth(d.getUTCMonth() + 6); break
    case "annual":     d.setUTCFullYear(d.getUTCFullYear() + 1); break
    case "biennial":   d.setUTCFullYear(d.getUTCFullYear() + 2); break
    default: return ""
  }
  return d.toISOString().slice(0, 10)
}
