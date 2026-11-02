#!/usr/bin/env node
// Health check for an Auto Job Hunt folder. Prints plain-English problems and fixes.
// node doctor.mjs [--dir <workspace>] [--json]      node doctor.mjs --self-test

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HEADER } from './scan.mjs';
import { parseProfile } from './dashboard.mjs';
import { findChrome } from './make-pdf.mjs';

const REQUIRED = ['Full name', 'Email', 'Phone (with country code)', 'Current city', 'Job titles I want',
  'Preferred cities, in order', 'Minimum fixed salary I will accept', 'Notice period', 'Gender'];
const blank = v => !v || /^\(.*\)$/.test(v.trim());

// Returns [{ok, what, fix}] for one workspace. Network checks are left to main().
export function checkWorkspace(ws) {
  const out = [], add = (ok, what, fix = '') => out.push({ ok, what, fix });
  const major = Number(process.versions.node.split('.')[0]);
  add(major >= 18, `Node.js ${process.versions.node}`, 'Install the LTS version from nodejs.org.');
  if (!ws || !fs.existsSync(path.join(ws, 'profile.md'))) {
    add(false, 'Auto Job Hunt folder', 'Say "start" to Claude to set it up.');
    return out;
  }
  add(true, `Folder: ${ws}`);

  const profileText = fs.readFileSync(path.join(ws, 'profile.md'), 'utf8');
  const items = Object.fromEntries(parseProfile(profileText).flatMap(s => s.items));
  const missing = REQUIRED.filter(k => blank(items[k]));
  add(!missing.length, missing.length ? `Profile is missing: ${missing.join(', ')}` : 'Profile has every required answer', 'Say "start" and Claude asks only the missing questions.');

  const resumeSection = parseProfile(profileText).find(s => s.title === 'Resumes');
  const files = (resumeSection?.items || []).map(([f]) => f).filter(f => /\.(pdf|docx?)$/i.test(f));
  const lost = files.filter(f => ![path.join(ws, f), path.join(ws, 'resumes', f)].some(p => fs.existsSync(p)));
  add(files.length > 0 && !lost.length, !files.length ? 'No resume listed in the profile' : lost.length ? `Resume files not found: ${lost.join(', ')}` : `${files.length} resume file(s) found`,
    'Put your resume in the resumes folder and tell Claude.');

  const jobsFile = path.join(ws, 'jobs.md');
  if (!fs.existsSync(jobsFile)) add(false, 'jobs.md is missing', 'Say "find jobs" and Claude creates it.');
  else {
    const lines = fs.readFileSync(jobsFile, 'utf8').split('\n');
    const head = lines.find(l => l.startsWith('| ID '));
    const headOk = head && head.split('|').slice(1, -1).map(s => s.trim()).join() === HEADER.join();
    const rows = lines.map((l, i) => [l, i + 1]).filter(([l]) => /^\|\s*\d+\s*\|/.test(l));
    const bad = rows.filter(([l]) => l.split('|').length - 2 !== HEADER.length).map(([, n]) => n);
    const ids = rows.map(([l]) => l.split('|')[1].trim());
    const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    add(headOk && !bad.length && !dupes.length,
      !headOk ? 'jobs.md heading row is damaged' : bad.length ? `jobs.md lines with the wrong number of columns: ${bad.join(', ')}` : dupes.length ? `jobs.md has repeated IDs: ${dupes.join(', ')}` : `jobs.md is healthy (${rows.length} jobs)`,
      'Ask Claude to repair jobs.md. A copy from each day is in the .backups folder.');
  }

  for (const f of [path.join(ws, 'companies.json'), path.join(ws, 'app', 'companies.json')].filter(fs.existsSync)) {
    let ok = true; try { ok = Array.isArray(JSON.parse(fs.readFileSync(f, 'utf8'))); } catch { ok = false; }
    add(ok, `${path.relative(ws, f)} ${ok ? 'is valid' : 'is damaged'}`, 'Ask Claude to repair the company list.');
  }
  add(fs.existsSync(path.join(ws, 'app', 'scripts', 'scan.mjs')), 'App files in app/', 'Start a new Claude chat; the plugin copies them in.');
  add(!!findChrome(), 'Google Chrome installed', 'Install Chrome from google.com/chrome.');
  return out;
}

async function main(args) {
  const opt = k => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
  const isWs = d => d && fs.existsSync(path.join(d, 'profile.md'));
  const ws = [opt('dir'), process.cwd(), path.join(os.homedir(), 'Documents', 'Auto Job Hunt')].find(isWs);
  const out = checkWorkspace(ws);
  const dash = await fetch('http://localhost:4747/api/jobs', { signal: AbortSignal.timeout(1500) }).then(r => r.ok, () => false);
  out.push({ ok: dash, what: 'Dashboard running at http://localhost:4747', fix: 'Start a Claude chat in the folder, or double-click Open Dashboard.' });
  if (args.includes('--json')) return console.log(JSON.stringify(out));
  for (const c of out) console.log(`${c.ok ? 'OK ' : 'FIX'}  ${c.what}${c.ok ? '' : `\n     ${c.fix}`}`);
  process.exitCode = out.every(c => c.ok) ? 0 : 1;
}

function selfTest() {
  const assert = (c, m) => { if (!c) throw new Error(`self-test failed: ${m}`); };
  const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'ajh-doc-'));
  fs.writeFileSync(path.join(ws, 'profile.md'), '# P\n## About me\n- Full name: A\n- Email:\n## Resumes\n| File | Use for |\n|---|---|\n| a.pdf | Sales |\n');
  fs.writeFileSync(path.join(ws, 'jobs.md'), `| ${HEADER.join(' | ')} |\n|---|\n| 1 | x |\n| 1 |${' |'.repeat(HEADER.length - 1)}\n`);
  const out = checkWorkspace(ws);
  const find = s => out.find(c => c.what.includes(s));
  assert(find('Profile is missing') && find('Profile is missing').what.includes('Email'), 'missing profile answers');
  assert(!find('Resume files not found').ok, 'missing resume file');
  assert(find('wrong number of columns').what.endsWith('3'), 'damaged row reported by line');
  fs.rmSync(ws, { recursive: true, force: true });
  console.log('self-test ok');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--self-test')) selfTest();
  else await main(process.argv.slice(2));
}
