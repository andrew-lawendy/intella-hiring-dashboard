// src/lib/interview.ts
// Timestamps are stored as UTC. All display and input helpers use the browser's
// local timezone so the app works correctly regardless of where the user is.

/** "Sun 17 May" — for logistics display and day-filter labels */
export function formatInterviewDate(interview_at: string | null): string {
  if (!interview_at) return '—'
  return new Date(interview_at).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/** "11:00" — start time only */
export function formatInterviewTime(interview_at: string | null): string {
  if (!interview_at) return '—'
  return new Date(interview_at).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/** "Sun 17 May · 11:00" — for cards, schedules, exports */
export function formatInterviewSlot(interview_at: string | null): string {
  if (!interview_at) return 'TBD'
  return `${formatInterviewDate(interview_at)} · ${formatInterviewTime(interview_at)}`
}

/** "Sunday 17 May" — matches the hardcoded DAYS labels used in BriefingPage and InterviewTimeline */
export function formatInterviewDayLabel(interview_at: string | null): string {
  if (!interview_at) return ''
  return new Date(interview_at).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/** YYYY-MM-DD in browser local time — for <input type="date"> value */
export function interviewAtToDateInput(interview_at: string | null): string {
  if (!interview_at) return ''
  return new Date(interview_at).toLocaleDateString('en-CA')
}

/** HH:mm in browser local time — for <input type="time"> value */
export function interviewAtToTimeInput(interview_at: string | null): string {
  if (!interview_at) return ''
  return new Date(interview_at).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Update the date portion of an interview datetime, preserving the existing local time.
 * Returns a new Date — does not mutate current.
 */
export function updateInterviewDate(current: Date | null, dateInput: string): Date {
  const d = current ? new Date(current.getTime()) : new Date()
  if (!current) d.setHours(0, 0, 0, 0)
  const [year, month, day] = dateInput.split('-').map(Number)
  d.setFullYear(year, month - 1, day)
  return d
}

/**
 * Update the time portion of an interview datetime, preserving the existing local date.
 * Returns a new Date — does not mutate current.
 */
export function updateInterviewTime(current: Date | null, timeInput: string): Date {
  const d = current ? new Date(current.getTime()) : new Date()
  const [hours, minutes] = timeInput.split(':').map(Number)
  d.setHours(hours, minutes, 0, 0)
  return d
}
