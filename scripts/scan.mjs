#!/usr/bin/env node
// Scans public company job boards (Greenhouse, Lever, Ashby, SmartRecruiters)
// and appends new matching jobs to jobs.md. No dependencies, Node 18+.
// Approach credited to career-ops (MIT): https://github.com/career-ops-hq/career-ops
//
// node scan.mjs --jobs <jobs.md> --roles "sales manager,account executive"
//   [--cities "Mumbai,Pune,Bengaluru"] [--remote] [--days 45]
//   [--companies <companies.json>]
// node scan.mjs --self-test

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const HEADER = ['ID', 'Found', 'Posted', 'Company', 'Role', 'Location', 'Mode', 'Source', 'Pay', 'Score', 'Verdict', 'Status', 'Applied', 'Resume', 'Link', 'Notes'];

const CITY_ALIASES = {
  bengaluru: ['bengaluru', 'bangalore'],
  mumbai: ['mumbai', 'bombay', 'navi mumbai', 'thane'],
  delhi: ['delhi', 'new delhi', 'ncr'],
  gurugram: ['gurugram', 'gurgaon'],
  chennai: ['chennai', 'madras'],
};

// Each fetcher returns [{company, role, location, mode, posted, link, pay}].
const FETCHERS = {
  async greenhouse(slug) {
    const d = await getJson(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`);
    return (d.jobs || []).map(j => ({
      role: j.title, location: j.location?.name || '', posted: j.first_published || j.updated_at,
      link: j.absolute_url, mode: '', pay: '',
    }));
  },
  async lever(slug) {
    const d = await getJson(`https://api.lever.co/v0/postings/${slug}?mode=json`);
    return (Array.isArray(d) ? d : []).map(j => ({
      role: j.text, location: [j.categories?.location, ...(j.categories?.allLocations || [])].filter(Boolean).join(' · '),
      posted: j.createdAt ? new Date(j.createdAt).toISOString() : '', link: j.hostedUrl,
      mode: j.workplaceType || '', pay: j.salaryRange ? `${j.salaryRange.currency} ${j.salaryRange.min}-${j.salaryRange.max}` : '',
    }));
  },
  async ashby(slug) {
    const d = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=true`);
    return (d.jobs || []).filter(j => j.isListed !== false).map(j => ({
      role: j.title,
      location: [j.location, ...(j.secondaryLocations || []).map(s => s.location)].filter(Boolean).join(' · '),
      posted: j.publishedAt || '', link: j.jobUrl, mode: j.workplaceType || (j.isRemote ? 'Remote' : ''),
      pay: j.compensation?.compensationTierSummary || '',
    }));
  },
  async smartrecruiters(slug) {
    const d = await getJson(`https://api.smartrecruiters.com/v1/companies/${slug}/postings?limit=100`);
    return (d.content || []).map(j => ({
      role: j.name, location: [j.location?.city, j.location?.country].filter(Boolean).join(', '),
      posted: j.releasedDate || '', link: `https://jobs.smartrecruiters.com/${slug}/${j.id}`,
      mode: j.location?.remote ? 'Remote' : '', pay: '',
    }));
  },
};

async function getJson(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'auto-job-hunt/1.0' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Every word of a role must appear as a whole word (plural allowed), so "engineer" does not match "engineering".
export function roleMatches(title, roles) {
  const t = title.toLowerCase();
  const esc = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return roles.some(r => r.toLowerCase().split(/\s+/).every(w => new RegExp(`(^|[^a-z0-9])${esc(w)}s?($|[^a-z0-9])`).test(t)));
}

export function placeMatches(location, mode, cities, remote) {
  const loc = location.toLowerCase();
  const names = cities.flatMap(c => CITY_ALIASES[c.toLowerCase()] || [c.toLowerCase()]);
  if (names.some(n => loc.includes(n))) return true;
  return remote && /remote/i.test(`${loc} ${mode}`) && /india/.test(loc);
}

const cell = v => String(v ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
const stamp = d => /^\d{4}-\d{2}-\d{2}$/.test(d ?? '') ? d
  : (d ? new Date(d) : new Date()).toLocaleString('sv-SE', { hour12: false }).slice(0, 16);

export function readJobs(file) {
  if (!fs.existsSync(file)) return { links: new Set(), maxId: 0 };
  const rows = fs.readFileSync(file, 'utf8').split('\n').filter(l => /^\|\s*\d+\s*\|/.test(l));
  const linkCol = HEADER.indexOf('Link') + 1;
  return {
    links: new Set(rows.map(r => r.split('|')[linkCol]?.trim())),
    maxId: rows.reduce((m, r) => Math.max(m, parseInt(r.split('|')[1], 10)), 0),
  };
}

export function toRow(id, j, foundAt) {
  const v = { ID: id, Found: foundAt, Posted: j.posted ? stamp(j.posted) : '', Company: j.company, Role: j.role,
    Location: j.location, Mode: j.mode, Source: j.source, Pay: j.pay, Status: 'New', Link: j.link };
  return `| ${HEADER.map(h => cell(v[h])).join(' | ')} |`;
}

async function main(args) {
  const opt = k => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
  // --check <ats> <slug>: test one company's board before adding it to companies.json
  if (opt('check')) {
    const jobs = await FETCHERS[opt('check')](args[args.indexOf('--check') + 2]);
    const india = jobs.filter(j => /india|bengaluru|bangalore|mumbai|pune|delhi|gurgaon|gurugram|noida|hyderabad|chennai/i.test(j.location));
    return console.log(JSON.stringify({ jobs: jobs.length, india: india.length, sample: india.slice(0, 5).map(j => j.role) }));
  }
  const jobsFile = opt('jobs');
  if (jobsFile && opt('add')) return addJobs(jobsFile, JSON.parse(fs.readFileSync(opt('add'), 'utf8')));
  const roles = (opt('roles') || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!jobsFile || !roles.length) { console.error('Need --jobs <file> and --roles "a,b" (or --add <jobs.json>)'); process.exit(2); }
  const cities = (opt('cities') || '').split(',').map(s => s.trim()).filter(Boolean);
  const remote = args.includes('--remote');
  const maxAge = Date.now() - Number(opt('days') || 45) * 864e5;
  let companies = JSON.parse(fs.readFileSync(opt('companies') || path.join(HERE, '..', 'companies.json'), 'utf8'));

  const { links, maxId } = readJobs(jobsFile);
  const found = [], failed = [];
  // Companies with "ats": "jobsite" have no public board; Claude searches them on Naukri and LinkedIn by name.
  const jobsiteOnly = companies.filter(c => !FETCHERS[c.ats]).map(c => c.name);
  companies = companies.filter(c => FETCHERS[c.ats]);
  let scanned = 0;
  // ponytail: fixed batches of 8, a proper pool if company lists grow past a few hundred
  for (let i = 0; i < companies.length; i += 8) {
    await Promise.all(companies.slice(i, i + 8).map(async c => {
      try {
        const jobs = await FETCHERS[c.ats](c.slug);
        scanned += jobs.length;
        for (const j of jobs) {
          if (!j.link || links.has(j.link) || !roleMatches(j.role || '', roles)) continue;
          if (!placeMatches(j.location, j.mode, cities, remote)) continue;
          if (j.posted && new Date(j.posted).getTime() < maxAge) continue;
          links.add(j.link);
          found.push({ ...j, company: c.name, source: c.ats });
        }
      } catch (e) { failed.push(`${c.name} (${e.message})`); }
    }));
  }

  const added = appendRows(jobsFile, found, maxId);
  console.log(JSON.stringify({ companies: companies.length, postings: scanned, new_jobs: added, failed, search_on_naukri_and_linkedin: jobsiteOnly }, null, 1));
}

function appendRows(jobsFile, jobs, maxId) {
  if (!fs.existsSync(jobsFile)) {
    fs.writeFileSync(jobsFile, `# Jobs\n\n| ${HEADER.join(' | ')} |\n|${HEADER.map(() => '---').join('|')}|\n`);
  }
  const foundAt = stamp();
  const rows = jobs.map((j, k) => toRow(maxId + k + 1, j, foundAt));
  if (rows.length) fs.appendFileSync(jobsFile, rows.join('\n') + '\n');
  return rows.length;
}

// Jobs found by hand (Naukri, LinkedIn): [{company, role, location, mode, posted, link, pay, source}]
function addJobs(jobsFile, jobs) {
  const { links, maxId } = readJobs(jobsFile);
  const fresh = jobs.filter(j => j.link && !links.has(j.link) && links.add(j.link));
  console.log(JSON.stringify({ new_jobs: appendRows(jobsFile, fresh, maxId), duplicates: jobs.length - fresh.length }));
}

function selfTest() {
  const assert = (c, m) => { if (!c) throw new Error(`self-test failed: ${m}`); };
  assert(roleMatches('Senior Account Executive, India', ['account executive']), 'role words');
  assert(!roleMatches('Software Engineer', ['sales manager']), 'role miss');
  assert(roleMatches('Regional Sales Manager - West', ['sales manager']), 'role multiword');
  assert(!roleMatches('Senior Engineering Manager - Billing Platform', ['platform engineer']), 'whole words only');
  assert(roleMatches('Staff Platform Engineers', ['platform engineer']), 'plural ok');
  assert(placeMatches('Bangalore HQ · Bengaluru · India', '', ['Bengaluru'], false), 'city alias');
  assert(placeMatches('Remote - India', '', ['Mumbai'], true), 'remote india');
  assert(!placeMatches('Remote - US', '', ['Mumbai'], true), 'remote us');
  assert(!placeMatches('Hyderabad', '', ['Mumbai'], true), 'other city');
  const tmp = path.join(fs.mkdtempSync(path.join((process.env.TMPDIR || '/tmp'), 'ja-')), 'jobs.md');
  fs.writeFileSync(tmp, `| ${HEADER.join(' | ')} |\n|---|\n${toRow(7, { company: 'A|B', role: 'R', link: 'https://x/1' }, '2026-01-01 10:00')}\n`);
  const r = readJobs(tmp);
  assert(r.maxId === 7 && r.links.has('https://x/1'), 'read back id and link');
  assert(toRow(1, { posted: '2026-11-01' }, 'x').includes('| 2026-11-01 |'), 'date-only stays a date');
  console.log('self-test ok');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--self-test')) selfTest();
  else await main(process.argv.slice(2));
}
