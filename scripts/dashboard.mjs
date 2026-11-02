#!/usr/bin/env node
// Local dashboard for jobs.md. No dependencies, Node 18+.
// node dashboard.mjs --dir <workspace> [--port 4747]
// Reads jobs.md on every request; notes and status changes are written back to jobs.md.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HEADER } from './scan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
const DIR = path.resolve(opt('dir') || process.cwd());
const PORT = Number(opt('port') || 4747);
const JOBS = path.join(DIR, 'jobs.md');
const PAGE = path.join(HERE, '..', 'templates', 'dashboard.html');

export const STATUSES = ['New', 'Apply', 'Skip', 'Applied', 'Interview', 'Offer', 'Rejected', 'Closed'];
const EDITABLE = { Notes: v => v.length <= 2000, Status: v => STATUSES.includes(v) };

const isRow = l => /^\|\s*\d+\s*\|/.test(l);
const cellsOf = l => l.split('|').slice(1, -1).map(s => s.trim());

export function parseJobs(text) {
  return text.split('\n').filter(isRow).map(l => Object.fromEntries(HEADER.map((h, i) => [h, cellsOf(l)[i] ?? ''])));
}

export function updateJob(text, id, field, value) {
  const col = HEADER.indexOf(field);
  let hit = false;
  const out = text.split('\n').map(l => {
    if (!isRow(l) || cellsOf(l)[0] !== String(id)) return l;
    hit = true;
    const c = cellsOf(l);
    while (c.length < HEADER.length) c.push('');
    c[col] = value.replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
    return `| ${c.join(' | ')} |`;
  });
  if (!hit) throw new Error('job not found');
  return out.join('\n');
}

function readText(file) { try { return fs.readFileSync(file, 'utf8'); } catch { return ''; } }

function send(res, code, body, type = 'application/json') {
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function serve() {
  http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') return send(res, 200, readText(PAGE), 'text/html; charset=utf-8');
    if (req.method === 'GET' && req.url === '/api/jobs') {
      const stat = fs.existsSync(JOBS) ? fs.statSync(JOBS) : null;
      return send(res, 200, { jobs: parseJobs(readText(JOBS)), updated: stat?.mtime ?? null, statuses: STATUSES, folder: DIR });
    }
    const m = req.url.match(/^\/api\/jobs\/(\d+)$/);
    // The custom header blocks other websites from posting here (browsers preflight it and we never allow CORS).
    if (req.method === 'POST' && m && req.headers['x-job-autopilot'] === '1') {
      let body = '';
      req.on('data', d => { body += d; if (body.length > 10000) req.destroy(); });
      req.on('end', () => {
        try {
          const { field, value } = JSON.parse(body);
          if (!EDITABLE[field] || typeof value !== 'string' || !EDITABLE[field](value)) return send(res, 400, { error: 'bad field' });
          fs.writeFileSync(JOBS, updateJob(readText(JOBS), m[1], field, value));
          send(res, 200, { ok: true });
        } catch (e) { send(res, 400, { error: e.message }); }
      });
      return;
    }
    send(res, 404, { error: 'not found' });
  }).listen(PORT, '127.0.0.1', () => console.log(`Dashboard: http://localhost:${PORT}  (folder: ${DIR})`))
    .on('error', e => {
      if (e.code === 'EADDRINUSE') console.log(`Dashboard already running: http://localhost:${PORT}`);
      else throw e;
    });
}

function selfTest() {
  const assert = (c, m) => { if (!c) throw new Error(`self-test failed: ${m}`); };
  const md = `# Jobs\n\n| ${HEADER.join(' | ')} |\n|---|\n| 1 | 2026-11-02 10:00 |  | Acme | Sales Manager |${' |'.repeat(HEADER.length - 5)}\n`;
  const jobs = parseJobs(md);
  assert(jobs.length === 1 && jobs[0].Company === 'Acme', 'parse');
  const after = parseJobs(updateJob(md, 1, 'Notes', 'call HR | Monday'))[0];
  assert(after.Notes === 'call HR / Monday' && after.Role === 'Sales Manager', 'update keeps other cells');
  let threw = false; try { updateJob(md, 9, 'Notes', 'x'); } catch { threw = true; }
  assert(threw, 'missing id throws');
  console.log('self-test ok');
}

if (args.includes('--self-test')) selfTest();
else serve();
