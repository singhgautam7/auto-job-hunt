import { Fragment } from 'react'
import { ArrowDown, ArrowUp, Download, ExternalLink, Info, NotebookPen, Quote, Search, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Bars, Columns, Empty } from '@/components/charts'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Toggle } from '@/components/ui/toggle'
import { ago, countBy, daysSince, downloadCsv, followDays, followUps, isApplied, isLink, lastDays, num, quoteOfTheDay, reviewItems, setting, sourceName, toDate, visibleJobs, within, type Filters, type Job, type Section } from '@/lib/jobs'

export type Data = { jobs: Job[]; statuses: string[]; profile: Section[]; backups: string[] }
type OpenJob = (id: string, focusNote?: boolean) => void

const TONE = {
  blue: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  green: 'bg-green-500/15 text-green-700 dark:text-green-400',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  red: 'bg-red-500/15 text-red-700 dark:text-red-300',
  purple: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
  slate: 'bg-muted text-muted-foreground',
}
const STATUS_TONE: Record<string, keyof typeof TONE> = { New: 'blue', Apply: 'purple', Applied: 'green', Offer: 'green', Interview: 'amber', Rejected: 'red', Skip: 'slate', Closed: 'slate' }

export const StatusBadge = ({ status }: { status: string }) => <Badge className={TONE[STATUS_TONE[status] ?? 'blue']}>{status || 'New'}</Badge>

export function ScoreBadge({ score }: { score: string }) {
  const n = num(score)
  if (n === null) return <span className="text-xs text-muted-foreground">-</span>
  return <Badge title="Match score out of 5" className={cn('h-7 min-w-10 rounded-lg font-semibold tabular-nums', TONE[n >= 4 ? 'green' : n >= 3 ? 'amber' : 'slate'])}>{n.toFixed(1)}</Badge>
}

function Stat({ label, value, note, hero }: { label: string; value: number; note: string; hero?: boolean }) {
  return (
    <Card className={cn(hero && 'bg-primary text-primary-foreground ring-0')}>
      <CardContent className="flex flex-col gap-1">
        <span className={cn('font-medium', !hero && 'text-muted-foreground')}>{label}</span>
        <span className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">{value}</span>
        <span className={cn('text-xs', !hero && 'text-muted-foreground')}>{note}</span>
      </CardContent>
    </Card>
  )
}

function Panel({ title, sub, className, children }: { title: string; sub: string; className?: string; children: React.ReactNode }) {
  return (
    <Card className={cn('min-w-0', className)}>
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{sub}</CardDescription></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// warn: a message to show instead of the location, with a warning icon instead of the score.
function JobItem({ job, warn, onOpen }: { job: Job; warn?: string; onOpen: OpenJob }) {
  return (
    <button onClick={() => onOpen(job.ID)} className="flex w-full items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
      {warn ? <TriangleAlert className="size-5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden /> : <ScoreBadge score={job.Score} />}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{job.Role}</span>
        <span className="block truncate text-xs text-muted-foreground">{job.Company} · {warn || job.Location}</span>
      </span>
      <StatusBadge status={job.Status} />
    </button>
  )
}

function ReviewList({ data, onOpen }: { data: Data; onOpen: OpenJob }) {
  const items = reviewItems(data.jobs, data.profile)
  if (!items.length) return <Empty>All clear. Nothing needs you.</Empty>
  return <div className="flex flex-col gap-1">{items.map(i => <JobItem key={`${i.job.ID}-${i.warn}`} {...i} onOpen={onOpen} />)}</div>
}

function RowActions({ job, onOpen }: { job: Job; onOpen: OpenJob }) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant={job.Notes ? 'secondary' : 'ghost'} size="icon" className="relative size-9" title={job.Notes || 'Add a note'}
        aria-label={`${job.Notes ? 'Edit note' : 'Add note'} for ${job.Company}`} onClick={e => { e.stopPropagation(); onOpen(job.ID, true) }}>
        <NotebookPen />
        {job.Notes && <span className="absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground ring-2 ring-card" aria-hidden>1</span>}
      </Button>
      {isLink(job.Link) && (
        <Button asChild variant="ghost" size="icon" className="size-9" title="Open job posting" onClick={e => e.stopPropagation()}>
          <a href={job.Link} target="_blank" rel="noopener" aria-label={`Open job at ${job.Company}`}><ExternalLink /></a>
        </Button>
      )}
    </div>
  )
}

export function Overview({ data, onOpen }: { data: Data; onOpen: OpenJob }) {
  const { jobs } = data
  const applied = jobs.filter(isApplied), good = jobs.filter(j => (num(j.Score) ?? 0) >= 4)
  const interviews = jobs.filter(j => ['Interview', 'Offer'].includes(j.Status))
  const found = lastDays(jobs, 14, j => j.Found), sent = lastDays(jobs, 14, j => isApplied(j) ? j.Applied : '')
  const buckets = [1, 2, 3, 4, 5].map(b => ({ label: `${b}`, value: jobs.filter(j => { const n = num(j.Score); return n !== null && Math.min(5, Math.floor(n)) === b }).length }))
  const best = jobs.filter(j => !isApplied(j) && !['Skip', 'Closed'].includes(j.Status) && num(j.Score) !== null).sort((a, b) => num(b.Score)! - num(a.Score)!).slice(0, 5)
  const [text, by] = quoteOfTheDay()
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat hero label="Applied" value={applied.length} note={`${applied.filter(j => within(j.Applied, 7)).length} this week`} />
        <Stat label="Jobs found" value={jobs.length} note={`${jobs.filter(j => within(j.Found, 7)).length} new this week`} />
        <Stat label="Good matches" value={good.length} note="Match score 4 or more" />
        <Stat label="Interviews" value={interviews.length} note={applied.length ? `${Math.round(interviews.length / applied.length * 100)}% of applications` : 'None yet'} />
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 ring-1 ring-primary/30">
        <Quote className="size-6 shrink-0 text-brand" aria-hidden />
        <div>
          <span className="block text-[11px] font-semibold tracking-wider text-brand uppercase">Quote of the day</span>
          <q className="font-medium">{text}</q> <span className="text-xs text-muted-foreground">{by}</span>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Jobs found and applied per day" sub="Last 14 days" className="lg:col-span-2">
          <Columns data={found.map((d, i) => ({ label: d.label, found: d.value, applied: sent[i].value }))}
            series={[{ key: 'found', label: 'Jobs found', color: 'var(--chart-1)' }, { key: 'applied', label: 'Jobs applied', color: 'var(--chart-2)' }]} />
        </Panel>
        <Panel title="Your progress" sub="From found to offer">
          <Bars data={[
            { label: 'Found', value: jobs.length },
            { label: 'Good match', value: good.length, note: 'score 4+' },
            { label: 'Applied', value: applied.length },
            { label: 'Interview', value: interviews.length },
            { label: 'Offer', value: jobs.filter(j => j.Status === 'Offer').length },
          ]} />
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Best new matches" sub="Highest match scores you have not applied to yet">
          {best.length ? <div className="flex flex-col gap-1">{best.map(j => <JobItem key={j.ID} job={j} onOpen={onOpen} />)}</div> : <Empty>No open matches right now</Empty>}
        </Panel>
        <Panel title="Needs you" sub="Things only you can do, and follow-ups that are due"><ReviewList data={data} onOpen={onOpen} /></Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Match scores" sub="How well jobs fit you, out of 5">
          <Columns data={buckets.map(b => ({ label: b.label, jobs: b.value }))} series={[{ key: 'jobs', label: 'Jobs', color: 'var(--chart-1)' }]} />
        </Panel>
        <Panel title="Top companies" sub="Companies with the most jobs for you">
          <Bars data={countBy(jobs.filter(j => j.Status !== 'Skip'), j => j.Company).slice(0, 8)} />
        </Panel>
      </div>
    </div>
  )
}

function Pick({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="data-[size=default]:h-9 grow sm:grow-0"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  )
}

const COLS: [string, string, string?][] = [
  ['Role', 'Job'], ['Location', 'Location', 'hidden lg:table-cell'], ['Posted', 'Posted', 'hidden sm:table-cell'], ['Found', 'Found', 'hidden lg:table-cell'],
  ['Pay', 'Pay', 'hidden lg:table-cell'], ['Score', 'Match'], ['Status', 'Status'],
]

export function JobsView({ data, filters: f, setFilters, onOpen }: { data: Data; filters: Filters; setFilters: (f: Filters) => void; onOpen: OpenJob }) {
  const { jobs, statuses } = data
  const set = (patch: Partial<Filters>) => setFilters({ ...f, ...patch })
  const list = visibleJobs(jobs, f)
  const sources = [...new Set(jobs.map(j => sourceName(j.Source)).filter(Boolean))].sort()
  const counts = Object.fromEntries(statuses.map(s => [s, jobs.filter(j => j.Status === s).length]))
  // Status chips combine: pick several to see them together; "All" clears the choice.
  const chip = 'gap-1.5 aria-pressed:border-primary aria-pressed:bg-primary/15 aria-pressed:text-foreground data-[state=on]:bg-primary/15'
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-64 flex-1">
          <span className="sr-only">Search jobs</span>
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input type="search" className="h-9 pl-9" placeholder="Search company, role, city or notes" value={f.q} onChange={e => set({ q: e.target.value })} />
        </label>
        <Pick label="Where the job came from" value={f.source} onChange={source => set({ source })} options={[['all', 'All sources'], ...sources.map(s => [s, s] as [string, string])]} />
        <Pick label="When it was posted" value={f.age} onChange={age => set({ age })} options={[['all', 'Posted any time'], ['1', 'Posted today'], ['7', 'Last 7 days'], ['30', 'Last 30 days']]} />
        <Pick label="Lowest match score" value={f.min} onChange={min => set({ min })} options={[['all', 'Any match'], ['4', 'Match 4+'], ['3', 'Match 3+']]} />
        <Button variant="secondary" size="lg" onClick={() => { if (!list.length) return toast('No jobs to download with these filters.'); downloadCsv(list); toast(`Downloaded ${list.length} jobs`) }}>
          <Download />Download for Excel
        </Button>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        <Toggle variant="outline" className={chip} pressed={!f.statuses.length} onPressedChange={() => set({ statuses: [] })}>All <span className="tabular-nums opacity-80">{jobs.length}</span></Toggle>
        {statuses.filter(s => counts[s]).map(s => (
          <Toggle key={s} variant="outline" className={chip} pressed={f.statuses.includes(s)}
            onPressedChange={on => set({ statuses: on ? [...f.statuses, s] : f.statuses.filter(x => x !== s) })}>
            {s} <span className="tabular-nums opacity-80">{counts[s]}</span>
          </Toggle>
        ))}
      </div>
      <Card className="gap-0 py-0">
        <Table>
          <TableHeader>
            <TableRow>
              {COLS.map(([k, l, c]) => {
                const on = k === f.sortKey
                return (
                  <TableHead key={k} className={c} aria-sort={on ? (f.sortDir > 0 ? 'ascending' : 'descending') : undefined}>
                    <button className={cn('inline-flex items-center gap-1 outline-none hover:text-foreground focus-visible:underline', !on && 'text-muted-foreground')}
                      onClick={() => set({ sortKey: k, sortDir: on ? -f.sortDir : -1 })}>
                      {l}{on && (f.sortDir > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                    </button>
                  </TableHead>
                )
              })}
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length ? list.map(j => (
              <TableRow key={j.ID} className="cursor-pointer" onClick={() => onOpen(j.ID)}>
                <TableCell className="whitespace-normal"><div className="font-medium">{j.Role}</div><div className="text-xs text-muted-foreground">{j.Company}</div></TableCell>
                <TableCell className="hidden lg:table-cell"><div>{j.Location}</div><div className="text-xs text-muted-foreground">{j.Mode}</div></TableCell>
                <TableCell className="hidden sm:table-cell" title={j.Posted}>{ago(j.Posted)}</TableCell>
                <TableCell className="hidden lg:table-cell" title={j.Found}>{ago(j.Found)}</TableCell>
                <TableCell className="hidden lg:table-cell">{j.Pay || <span className="text-xs text-muted-foreground">Not shown</span>}</TableCell>
                <TableCell><ScoreBadge score={j.Score} /></TableCell>
                <TableCell><StatusBadge status={j.Status} /></TableCell>
                <TableCell><RowActions job={j} onOpen={onOpen} /></TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={COLS.length + 1}><Empty>No jobs match these filters.</Empty></TableCell></TableRow>}
          </TableBody>
        </Table>
        <p className="border-t px-4 py-3 text-xs text-muted-foreground">Showing {list.length} of {jobs.length} jobs. Click a job to see details and notes.</p>
      </Card>
    </div>
  )
}

export function Applications({ data, onOpen }: { data: Data; onOpen: OpenJob }) {
  const applied = data.jobs.filter(isApplied).sort((a, b) => (toDate(b.Applied)?.getTime() ?? 0) - (toDate(a.Applied)?.getTime() ?? 0))
  const inter = applied.filter(j => ['Interview', 'Offer'].includes(j.Status)).length
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat hero label="Applied" value={applied.length} note="All time" />
        <Stat label="This week" value={applied.filter(j => within(j.Applied, 7)).length} note="Last 7 days" />
        <Stat label="Interviews" value={inter} note={applied.length ? `${Math.round(inter / applied.length * 100)}% response` : 'None yet'} />
        <Stat label="Offers" value={applied.filter(j => j.Status === 'Offer').length} note="Keep going" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Applications per day" sub="Last 14 days" className="lg:col-span-2">
          <Columns data={lastDays(data.jobs, 14, j => isApplied(j) ? j.Applied : '').map(d => ({ label: d.label, applications: d.value }))}
            series={[{ key: 'applications', label: 'Applications', color: 'var(--chart-1)' }]} />
        </Panel>
        <Panel title="Where you applied" sub="Job source"><Bars unit="Applications" data={countBy(applied, j => sourceName(j.Source))} /></Panel>
      </div>
      <Card className="gap-0 py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead><TableHead>Applied on</TableHead><TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Resume</TableHead><TableHead className="hidden lg:table-cell">Match</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applied.length ? applied.map(j => (
              <TableRow key={j.ID} className="cursor-pointer" onClick={() => onOpen(j.ID)}>
                <TableCell className="whitespace-normal"><div className="font-medium">{j.Role}</div><div className="text-xs text-muted-foreground">{j.Company} · {j.Location}</div></TableCell>
                <TableCell>{j.Applied || '-'}</TableCell>
                <TableCell><StatusBadge status={j.Status} /></TableCell>
                <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{j.Resume.replace(/\.pdf$/, '')}</TableCell>
                <TableCell className="hidden lg:table-cell"><ScoreBadge score={j.Score} /></TableCell>
                <TableCell><RowActions job={j} onOpen={onOpen} /></TableCell>
              </TableRow>
            )) : <TableRow><TableCell colSpan={6}><Empty>No applications yet. Claude adds them here as it applies.</Empty></TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

const Note = ({ children }: { children: React.ReactNode }) => (
  <Alert className="border-primary/30 bg-primary/10"><Info className="text-brand" /><AlertDescription className="font-medium text-foreground">{children}</AlertDescription></Alert>
)

const STATE_TONE = { on: TONE.green, off: TONE.slate, due: TONE.amber }

function AutoCard({ title, state, tone, detail, how }: { title: string; state: string; tone: keyof typeof STATE_TONE; detail: string; how: string }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-2"><CardTitle>{title}</CardTitle><Badge className={STATE_TONE[tone]}>{state}</Badge></CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <p className="text-muted-foreground">{detail}</p>
        <p className="mt-auto border-t pt-2 text-xs text-muted-foreground">{how}</p>
      </CardContent>
    </Card>
  )
}

export function Automations({ data, onOpen }: { data: Data; onOpen: OpenJob }) {
  const { profile, backups } = data
  const get = (label: string, fallback?: string) => setting(profile, label, fallback)
  const on = (v: string) => /^yes|^on|^every|^when|^only/i.test(v)
  const onOff = (v: boolean) => (v ? { state: 'On', tone: 'on' } : { state: 'Off', tone: 'off' }) as { state: string; tone: 'on' | 'off' }
  const morning = get('Morning run', 'No'), auto = get('Apply automatically', 'No'), closed = get('Check closed jobs before applying', 'Yes')
  const nDays = parseInt(get('Naukri refresh every (days)', '14'), 10) || 14, nLast = get('Naukri profile last updated')
  const nDue = get('Naukri account', 'No') !== 'No' && (!nLast || daysSince(nLast) >= nDays)
  const fu = followUps(data.jobs, profile).length
  return (
    <div className="flex flex-col gap-4">
      <Note>Everything Claude does for you on its own, and the settings it follows. To change one, just tell Claude, for example "turn on the morning run".</Note>
      <Panel title="Needs your review" sub="Things only you can do, and follow-ups that are due"><ReviewList data={data} onOpen={onOpen} /></Panel>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AutoCard title="Morning run" {...onOff(on(morning))} detail={on(morning) ? `Runs ${morning.replace(/^yes\s*/i, '')}: finds jobs, then applies if automatic applying is on.` : 'Nothing runs by itself. Say "start" whenever you want.'} how={'Change: "turn on the morning run" or "turn off the morning run"'} />
        <AutoCard title="Apply automatically" {...onOff(on(auto))} detail={on(auto) ? `Jobs scoring ${get('Only apply when match score is at least', '4')}+ in your cities, up to ${get('Max applications per day', '20')} a day.` : 'Claude shows the best matches and asks before applying.'} how={'Change: "apply automatically" or "ask me before applying"'} />
        <AutoCard title="Naukri and LinkedIn limit" state={`${get('Daily limit per site on Naukri and LinkedIn', '10')} a day`} tone="on" detail="Applies slowly on each site and stops on any warning, to keep your accounts safe." how={'Change: "set the Naukri limit to 5"'} />
        <AutoCard title="Closed-job check" {...onOff(on(closed))} detail="Checks each job is still open before applying. Closed ones are marked Closed." how={'Run now: "are my jobs still open?"'} />
        <AutoCard title="Follow-up reminders" state={fu ? `${fu} due` : 'On'} tone={fu ? 'due' : 'on'} detail={`After ${followDays(profile)} days with no reply, Claude offers to draft a short follow-up. Nothing is sent without your yes.`} how={'Change: "remind me after 7 days"'} />
        <AutoCard title="Naukri profile refresh" state={nDue ? 'Due' : 'On'} tone={nDue ? 'due' : 'on'} detail={`Every ${nDays} days. Last updated: ${nLast || 'never'}.`} how={'Run now: "update my Naukri"'} />
        <AutoCard title="Cover letters" state={get('Cover letters', 'Only when needed')} tone="on" detail={`Job-specific resume: ${get('Job-specific resume', 'When needed')}. Facts come only from your resume and answers.`} how={'Change: "write a cover letter for every application"'} />
        <AutoCard title="Consent boxes" state={on(get('Tick consent boxes', 'No')) ? 'Claude ticks' : 'You tick'} tone={on(get('Tick consent boxes', 'No')) ? 'on' : 'off'} detail="Privacy notices and standard candidate NDAs on forms. Claude reads them first and stops on anything unusual." how={'Change: "tick consent boxes for me" or "leave them for me"'} />
        <AutoCard title="Daily backups" state={backups.length ? 'On' : 'Starts next chat'} tone={backups.length ? 'on' : 'off'} detail={backups.length ? `Last backup: ${backups[0]}. Keeping ${backups.length} of the last 14 days.` : 'A copy of your job list and profile is saved each day you open a chat.'} how={'Restore: "restore my jobs from yesterday"'} />
      </div>
    </div>
  )
}

export const KeyValues = ({ rows }: { rows: [string, React.ReactNode][] }) => (
  <dl className="grid grid-cols-[minmax(120px,42%)_1fr] gap-x-4 gap-y-2.5">
    {rows.map(([k, v]) => <Fragment key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-medium wrap-anywhere">{v}</dd></Fragment>)}
  </dl>
)

export function Profile({ profile }: { profile: Section[] }) {
  return (
    <div className="flex flex-col gap-4">
      <Note>Claude uses this for every search and application. To change anything, just tell Claude.</Note>
      {profile.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {profile.filter(s => s.title !== 'Rules for applying').map(s => (
            <Card key={s.title}>
              <CardHeader><CardTitle>{s.title}</CardTitle></CardHeader>
              <CardContent><KeyValues rows={s.items.map(([k, v]) => [k, v || <span className="text-xs font-normal text-muted-foreground">Not set</span>])} /></CardContent>
            </Card>
          ))}
        </div>
      ) : <Card><Empty>No profile yet. Tell Claude "start" to set it up.</Empty></Card>}
    </div>
  )
}
