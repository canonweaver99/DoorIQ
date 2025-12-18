/**
 * Free Period Utility
 * DoorIQ is completely free until January 1st, 2025
 */

const FREE_PERIOD_END_DATE = new Date('2025-01-01T00:00:00Z')

/**
 * Check if we're currently in the free period
 * @returns true if current date is before January 1st, 2025
 */
export function isFreePeriod(): boolean {
  const now = new Date()
  return now < FREE_PERIOD_END_DATE
}

/**
 * Get the end date of the free period
 */
export function getFreePeriodEndDate(): Date {
  return FREE_PERIOD_END_DATE
}

/**
 * Get days remaining in free period
 */
export function getDaysRemainingInFreePeriod(): number {
  if (!isFreePeriod()) {
    return 0
  }
  const now = Date.now()
  const endMs = FREE_PERIOD_END_DATE.getTime()
  const diffMs = endMs - now
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}
