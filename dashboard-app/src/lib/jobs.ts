// Data helpers for the dashboard. Jobs are rows of jobs.md, keyed by column name.
export type Job = Record<string, string>
export type Section = { title: string; items: [string, string][] }
export type Filters = { q: string; source: string; age: string; min: string; statuses: string[]; sortKey: string; sortDir: number }

export const DAY = 864e5
const APPLIED = ['Applied', 'Interview', 'Offer', 'Rejected']
const DATE_COLS = ['Posted', 'Found', 'Applied']
const SOURCES: Record<string, string> = { naukri: 'Naukri', linkedin: 'LinkedIn' }

export const toDate = (s?: string) => { if (!s) return null; const d = new Date(String(s).replace(' ', 'T')); return isNaN(+d) ? null : d }
const dayKey = (d: Date) => d.toLocaleDateString('sv-SE')
export const num = (s?: string) => { const n = parseFloat(s ?? ''); return isNaN(n) ? null : n }
export const isApplied = (j: Job) => APPLIED.includes(j.Status) || !!j.Applied
export const sourceName = (s: string) => SOURCES[s] || (s ? 'Company website' : '')
export const isLink = (s: string) => /^https?:\/\//.test(s)
export const daysSince = (s?: string) => { const d = toDate(s); return d ? Math.floor((Date.now() - +d) / DAY) : 0 }
export const within = (s: string, days: number) => (toDate(s)?.getTime() ?? 0) >= Date.now() - days * DAY

export function ago(s: string) {
  const d = toDate(s); if (!d) return ''
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / DAY)
  return days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : days < 30 ? `${days} days ago` : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

// One row per day for the last n days, counting the jobs whose field falls on that day.
export function lastDays(jobs: Job[], n: number, field: (j: Job) => string) {
  const out: { key: string; label: string; value: number }[] = [], today = new Date(); today.setHours(0, 0, 0, 0)
  for (let i = n - 1; i >= 0; i--) { const d = new Date(+today - i * DAY); out.push({ key: dayKey(d), label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), value: 0 }) }
  const idx = Object.fromEntries(out.map((o, i) => [o.key, i]))
  for (const j of jobs) { const d = toDate(field(j)); if (d && idx[dayKey(d)] !== undefined) out[idx[dayKey(d)]].value++ }
  return out
}

export function countBy(list: Job[], f: (j: Job) => string) {
  const m: Record<string, number> = {}
  for (const j of list) { const k = f(j) || 'Other'; m[k] = (m[k] || 0) + 1 }
  return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}

// Settings saved in profile.md, by their label.
export function setting(profile: Section[], label: string, fallback = '') {
  for (const s of profile) for (const [k, v] of s.items) if (k === label && v && !/^\(.*\)$/.test(v)) return v
  return fallback
}
export const followDays = (profile: Section[]) => parseInt(setting(profile, 'Follow up after (days)', '10'), 10) || 10
// Applied long enough ago, no reply recorded, not followed up yet.
export const followUps = (jobs: Job[], profile: Section[]) =>
  jobs.filter(j => j.Status === 'Applied' && daysSince(j.Applied) >= followDays(profile) && !/followed up/i.test(j.Notes))
export const reviewItems = (jobs: Job[], profile: Section[]) => [
  ...jobs.filter(j => /needs you/i.test(j.Notes)).map(job => ({ job, warn: job.Notes })),
  ...followUps(jobs, profile).map(job => ({ job, warn: `Follow up: applied ${daysSince(job.Applied)} days ago. Ask Claude to draft a message.` })),
]

export function visibleJobs(jobs: Job[], f: Filters) {
  const q = f.q.trim().toLowerCase(), age = Number(f.age) || 0, min = Number(f.min) || 0
  const key = (j: Job) => DATE_COLS.includes(f.sortKey) ? toDate(j[f.sortKey])?.getTime() ?? 0 : num(j[f.sortKey])
  return jobs.filter(j =>
    (!f.statuses.length || f.statuses.includes(j.Status)) && (f.source === 'all' || sourceName(j.Source) === f.source) &&
    (!min || (num(j.Score) ?? 0) >= min) && (!age || within(j.Posted, age)) &&
    (!q || [j.Company, j.Role, j.Location, j.Notes, j.Verdict].join(' ').toLowerCase().includes(q))
  ).sort((a, b) => {
    const x = key(a), y = key(b)
    return (x !== null && y !== null ? x - y : String(a[f.sortKey]).localeCompare(String(b[f.sortKey]))) * f.sortDir
  })
}

// A CSV file that Excel and Google Sheets open; the BOM keeps the rupee sign intact in Excel.
export function downloadCsv(list: Job[]) {
  const cols = ['ID', 'Company', 'Role', 'Location', 'Mode', 'Source', 'Posted', 'Found', 'Pay', 'Score', 'Verdict', 'Status', 'Applied', 'Resume', 'Link', 'Notes']
  const q = (v?: string) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = '﻿' + [cols.map(q).join(','), ...list.map(j => cols.map(c => q(c === 'Source' ? sourceName(j[c]) : j[c])).join(','))].join('\r\n')
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `jobs-${dayKey(new Date())}.csv` })
  document.body.append(a); a.click(); a.remove()
}

const QUOTES = [
  ['It always seems impossible until it is done.', 'Nelson Mandela'],
  ['The secret of getting ahead is getting started.', 'Mark Twain'],
  ['Do what you can, with what you have, where you are.', 'Theodore Roosevelt'],
  ['Believe you can and you are halfway there.', 'Theodore Roosevelt'],
  ['Fall seven times, stand up eight.', 'Japanese proverb'],
  ['Act as if what you do makes a difference. It does.', 'William James'],
  ['Arise, awake, and stop not till the goal is reached.', 'Swami Vivekananda'],
  ['You have to dream before your dreams can come true.', 'A. P. J. Abdul Kalam'],
  ['Excellence is a continuous process and not an accident.', 'A. P. J. Abdul Kalam'],
  ['Start where you are. Use what you have. Do what you can.', 'Arthur Ashe'],
  ['The best way out is always through.', 'Robert Frost'],
  ['Little by little, one travels far.', 'J. R. R. Tolkien'],
  ['The future depends on what you do today.', 'Mahatma Gandhi'],
  ['Action is the foundational key to all success.', 'Pablo Picasso'],
  ['Success is the sum of small efforts, repeated day in and day out.', 'Robert Collier'],
  ['Opportunities do not happen. You create them.', 'Chris Grosser'],
  ['Hard work beats talent when talent does not work hard.', 'Tim Notke'],
  ['What you do today can improve all your tomorrows.', 'Ralph Marston'],
  ['Keep your face always toward the sunshine, and shadows will fall behind you.', 'Walt Whitman'],
  ['A rejection is nothing more than a necessary step in the pursuit of success.', 'Bo Bennett'],
  ['Perseverance is not a long race; it is many short races one after another.', 'Walter Elliot'],
  ['Do not watch the clock; do what it does. Keep going.', 'Sam Levenson'],
  ['You miss 100% of the shots you do not take.', 'Wayne Gretzky'],
  ['Quality is not an act, it is a habit.', 'Aristotle'],
  ['Every application is one step closer to the right job.', 'Auto Job Hunt'],
]
export function quoteOfTheDay() {
  const d = new Date()
  return QUOTES[Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY) % QUOTES.length]
}
