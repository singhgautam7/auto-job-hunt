#!/usr/bin/env node
// Checks whether job postings in jobs.md are still open. No dependencies, Node 18+.
// node check-live.mjs --jobs <jobs.md> [--ids 12,15] [--status New,Apply] [--companies <companies.json>] [--mark]
// Board links (Greenhouse, Lever, Ashby, SmartRecruiters) are checked with the board's public data.
// Naukri, LinkedIn and other sites are listed as "check_in_browser" for Claude to open.
// --mark: New/Apply rows that closed become Status Closed; other rows get a note.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getJson } from './scan.mjs';
import { parseJobs, editJobFile } from './dashboard.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Works out which board a link belongs to and how to look it up. Returns null when only a browser can tell.
export function boardOf(link, company, companies = []) {
  let u;
  try { u = new URL(link); } catch { return null; }
  const p = u.pathname.split('/').filter(Boolean);
  const gh = u.searchParams.get('gh_jid');
  if (/greenhouse\.io$/.test(u.hostname)) {
    const i = p.indexOf('jobs');
    if (i > 0) return { ats: 'greenhouse', slug: p[i - 1], id: p[i + 1] };
  }
  if (gh) {
    const c = companies.find(x => x.ats === 'greenhouse' && x.name.toLowerCase() === String(company).toLowerCase());
    if (c) return { ats: 'greenhouse', slug: c.slug, id: gh };
  }
  if (u.hostname === 'jobs.lever.co' && p.length >= 2) return { ats: 'lever', slug: p[0], id: p[1] };
  if (u.hostname === 'jobs.ashbyhq.com' && p.length >= 2) return { ats: 'ashby', slug: p[0], id: p[1] };
  if (u.hostname === 'jobs.smartrecruiters.com' && p.length >= 2) return { ats: 'smartrecruiters', slug: p[0], id: p[1] };
  return null;
}

// true = open, false = closed. Network trouble throws, so a slow site is never mistaken for a closed job.
export async function isOpen(b) {
  const url = {
    greenhouse: `https://boards-api.greenhouse.io/v1/boards/${b.slug}/jobs/${b.id}`,
    lever: `https://api.lever.co/v0/postings/${b.slug}/${b.id}`,
    smartrecruiters: `https://api.smartrecruiters.com/v1/companies/${b.slug}/postings/${b.id}`,
    ashby: `https://api.ashbyhq.com/posting-api/job-board/${b.slug}`,
  }[b.ats];
  try {
    const d = await getJson(url);
    return b.ats === 'ashby' ? (d.jobs || []).some(j => j.id === b.id || String(j.jobUrl).includes(b.id)) : true;
  } catch (e) {
    if (e.status === 404) return false;
    throw e;
  }
}

async function main(args) {
  const opt = k => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
  const file = opt('jobs');
  if (!file || !fs.existsSync(file)) return console.log(JSON.stringify({ error: `Job list not found: ${file}` }));
  let companies = [];
  try { companies = JSON.parse(fs.readFileSync(opt('companies') || path.join(HERE, '..', 'companies.json'), 'utf8')); } catch {}
  const ids = opt('ids') ? new Set(opt('ids').split(',').map(s => s.trim())) : null;
  const statuses = (opt('status') || 'New,Apply').split(',');
  const rows = parseJobs(fs.readFileSync(file, 'utf8')).filter(j => ids ? ids.has(j.ID) : statuses.includes(j.Status));

  const out = { checked: 0, open: [], closed: [], check_in_browser: [], failed: [] };
  for (const j of rows) {
    const b = boardOf(j.Link, j.Company, companies);
    if (!b) { out.check_in_browser.push(j.ID); continue; }
    try {
      out.checked++;
      (await isOpen(b) ? out.open : out.closed).push(j.ID);
    } catch (e) { out.failed.push(`${j.ID} (${e.message})`); }
  }
  if (args.includes('--mark')) {
    const today = new Date().toLocaleDateString('sv-SE');
    for (const id of out.closed) {
      const j = rows.find(r => r.ID === id);
      const note = [j.Notes, `Posting closed (checked ${today})`].filter(Boolean).join('; ');
      editJobFile(file, id, ['New', 'Apply'].includes(j.Status) ? { Status: 'Closed', Notes: note } : { Notes: note });
    }
  }
  console.log(JSON.stringify(out));
}

function selfTest() {
  const assert = (c, m) => { if (!c) throw new Error(`self-test failed: ${m}`); };
  const cs = [{ name: 'Databricks', ats: 'greenhouse', slug: 'databricks' }];
  assert(JSON.stringify(boardOf('https://job-boards.greenhouse.io/zscaler/jobs/5184112007', 'Zscaler')) === '{"ats":"greenhouse","slug":"zscaler","id":"5184112007"}', 'greenhouse link');
  assert(boardOf('https://databricks.com/careers/job?gh_jid=123', 'Databricks', cs).slug === 'databricks', 'branded greenhouse link');
  assert(boardOf('https://jobs.ashbyhq.com/sarvam/abc-123', 'Sarvam').id === 'abc-123', 'ashby link');
  assert(boardOf('https://jobs.lever.co/paytm/uuid-1', 'Paytm').ats === 'lever', 'lever link');
  assert(boardOf('https://www.naukri.com/job-listings-x', 'X') === null, 'naukri needs a browser');
  assert(boardOf('not a link', 'X') === null, 'bad link is safe');
  console.log('self-test ok');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--self-test')) selfTest();
  else await main(process.argv.slice(2)).catch(e => console.log(JSON.stringify({ error: e.message })));
}
