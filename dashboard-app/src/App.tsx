import { useEffect, useRef, useState } from 'react'
import { Briefcase, ExternalLink, LayoutDashboard, List, Moon, Send, Sun, User, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from 'cn'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Toaster } from '@/components/ui/sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ago, isApplied, isLink, reviewItems, sourceName, type Filters, type Job } from '@/lib/jobs'
import { Applications, Automations, JobsView, KeyValues, Overview, Profile, ScoreBadge, StatusBadge, type Data } from '@/views'

const initialTab = () => { const h = location.hash.slice(1); return ['overview', 'jobs', 'applied', 'automations', 'profile'].includes(h) ? h : 'overview' }

function JobDialog({ job, focusNote, onClose, onSaved }: { job: Job; focusNote: boolean; onClose: () => void; onSaved: (value: string) => void }) {
  const [note, setNote] = useState(job.Notes)
  const [saving, setSaving] = useState(false)
  const box = useRef<HTMLTextAreaElement>(null)
  const rows: [string, string][] = [['Work mode', job.Mode], ['Posted', job.Posted && `${job.Posted} (${ago(job.Posted)})`], ['Found by Claude', job.Found], ['Pay', job.Pay || 'Not shown'], ['Found on', sourceName(job.Source)], ['Resume', job.Resume], ['Applied on', job.Applied]]

  async function save() {
    const value = note.trim()
    setSaving(true)
    const res = await fetch(`/api/jobs/${job.ID}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-auto-job-hunt': '1' }, body: JSON.stringify({ field: 'Notes', value }) }).catch(() => null)
    setSaving(false)
    // On failure the dialog stays open, so the typed note is not lost.
    if (!res?.ok) return toast('Could not save the note. Is the dashboard still running?')
    onSaved(value.replace(/\|/g, '/').replace(/\s+/g, ' '))
    toast('Note saved')
  }

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-3rem)] overflow-y-auto sm:max-w-xl"
        onOpenAutoFocus={e => { if (focusNote) { e.preventDefault(); box.current?.focus() } }}>
        <DialogHeader>
          <DialogTitle className="pr-6 text-xl">{job.Role}</DialogTitle>
          <DialogDescription>{job.Company} · {job.Location}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2"><StatusBadge status={job.Status} /><ScoreBadge score={job.Score} /></div>
        <KeyValues rows={rows.filter(([, v]) => v)} />
        <div>
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">Why this score</div>
          <div className="rounded-lg bg-muted p-3">{job.Verdict || 'Not scored yet.'}</div>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Your notes</span>
          <Textarea ref={box} className="min-h-28" maxLength={2000} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note, for example who referred you or when to follow up" />
        </label>
        <DialogFooter className="sm:justify-between">
          {isLink(job.Link) ? <Button asChild variant="secondary" size="lg"><a href={job.Link} target="_blank" rel="noopener"><ExternalLink />Open job</a></Button> : <span />}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="lg" onClick={onClose}>Cancel</Button>
            <Button size="lg" disabled={saving} onClick={save}>Save note</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function App() {
  const [data, setData] = useState<Data>({ jobs: [], statuses: [], profile: [], backups: [] })
  const [updated, setUpdated] = useState('Loading your jobs…')
  const [online, setOnline] = useState(true)
  const [tab, setTab] = useState(initialTab)
  const [opened, setOpened] = useState<{ id: string; focusNote: boolean } | null>(null)
  const [filters, setFilters] = useState<Filters>({ q: '', source: 'all', age: 'all', min: 'all', statuses: [], sortKey: 'Score', sortDir: -1 })
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const stamp = useRef('')
  const dialogOpen = useRef(false)
  useEffect(() => { dialogOpen.current = !!opened }, [opened])

  useEffect(() => {
    async function load() {
      if (dialogOpen.current) return
      try {
        const [d, p] = await Promise.all([fetch('/api/jobs', { cache: 'no-store' }).then(r => r.json()), fetch('/api/profile', { cache: 'no-store' }).then(r => r.json())])
        setOnline(true)
        setUpdated(d.updated ? `Updated ${new Date(d.updated).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : 'No jobs yet. Ask Claude to find jobs.')
        const next = d.updated + JSON.stringify(p)
        if (next === stamp.current) return
        stamp.current = next
        setData({ jobs: d.jobs, statuses: d.statuses, profile: p.sections || [], backups: p.backups || [] })
      } catch {
        setOnline(false)
        setUpdated('Cannot reach the dashboard. Ask Claude to "open my dashboard".')
      }
    }
    load()
    const timer = setInterval(load, 10000)
    return () => clearInterval(timer)
  }, [])

  function selectTab(name: string) {
    setTab(name)
    history.replaceState(null, '', `#${name}`)
  }
  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('ajh-mode', next ? 'dark' : 'light') } catch { /* private window */ }
  }

  const onOpen = (id: string, focusNote = false) => setOpened({ id, focusNote })
  const job = data.jobs.find(j => j.ID === opened?.id)
  const appliedCount = data.jobs.filter(isApplied).length
  const reviewCount = reviewItems(data.jobs, data.profile).length
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'jobs', label: 'Jobs', icon: List, count: data.jobs.length },
    { id: 'applied', label: 'Applications', icon: Send, count: appliedCount },
    { id: 'automations', label: 'Automations', icon: Zap, count: reviewCount },
    { id: 'profile', label: 'My profile', icon: User },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      <header className="flex items-center gap-3 pt-5 pb-3">
        <div className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground" aria-hidden><Briefcase className="size-6" /></div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Auto Job Hunt</h1>
          <p className="truncate text-xs text-muted-foreground">{updated}</p>
        </div>
        <div className="flex-1" />
        <Badge variant="outline" className="h-7 gap-2 px-3" title="The page refreshes by itself every 10 seconds">
          <i className={cn('size-2 rounded-full', online ? 'bg-green-500' : 'bg-red-500')} />{online ? 'Live' : 'Offline'}
        </Badge>
        <Button variant="ghost" size="icon" className="size-10" aria-label="Switch light or dark mode" onClick={toggleTheme}>{dark ? <Sun /> : <Moon />}</Button>
      </header>

      <Tabs value={tab} onValueChange={selectTab} className="gap-5">
        <TabsList className="hidden gap-1 md:inline-flex group-data-horizontal/tabs:h-11">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <TabsTrigger key={id} value={id} className="px-3 data-active:bg-primary data-active:text-primary-foreground dark:data-active:border-transparent dark:data-active:bg-primary dark:data-active:text-primary-foreground">
              <Icon />{label}{count !== undefined && <span className="rounded-full bg-foreground/10 px-1.5 text-[11px] tabular-nums">{count}</span>}
            </TabsTrigger>
          ))}
        </TabsList>
        <Select value={tab} onValueChange={selectTab}>
          <SelectTrigger aria-label="Section" className="w-full font-medium data-[size=default]:h-10 md:hidden"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">Overview</SelectItem>
            <SelectItem value="jobs">Jobs ({data.jobs.length})</SelectItem>
            <SelectItem value="applied">Applications ({appliedCount})</SelectItem>
            <SelectItem value="automations">Automations ({reviewCount} to review)</SelectItem>
            <SelectItem value="profile">My profile</SelectItem>
          </SelectContent>
        </Select>

        <TabsContent value="overview"><Overview data={data} onOpen={onOpen} /></TabsContent>
        <TabsContent value="jobs"><JobsView data={data} filters={filters} setFilters={setFilters} onOpen={onOpen} /></TabsContent>
        <TabsContent value="applied"><Applications data={data} onOpen={onOpen} /></TabsContent>
        <TabsContent value="automations"><Automations data={data} onOpen={onOpen} /></TabsContent>
        <TabsContent value="profile"><Profile profile={data.profile} /></TabsContent>
      </Tabs>

      {job && opened && (
        <JobDialog key={job.ID} job={job} focusNote={opened.focusNote} onClose={() => setOpened(null)}
          onSaved={value => { setData(d => ({ ...d, jobs: d.jobs.map(j => j.ID === job.ID ? { ...j, Notes: value } : j) })); setOpened(null) }} />
      )}
      <Toaster theme={dark ? 'dark' : 'light'} position="bottom-center" />
    </div>
  )
}
