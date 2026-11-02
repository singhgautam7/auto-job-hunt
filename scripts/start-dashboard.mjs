#!/usr/bin/env node
// Runs when a Claude chat starts (plugin SessionStart hook). If an Auto Job Hunt
// folder exists: refreshes its app/ copy when the plugin was updated, makes sure
// the dashboard is running, and tells Claude the link.
// Prints nothing when there is no workspace yet, so other projects are untouched.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const URL = 'http://localhost:4747';
const PLUGIN = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWorkspace = dir => fs.existsSync(path.join(dir, 'profile.md')) && fs.existsSync(path.join(dir, 'jobs.md'));
const readJson = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };

// Copies the plugin's scripts, templates and company list into <ws>/app when the
// version differs. A user's own companies.json keeps its entries and gains new built-in ones.
export function syncApp(ws, plugin = PLUGIN) {
  const want = readJson(path.join(plugin, '.claude-plugin', 'plugin.json'))?.version;
  const have = readJson(path.join(ws, 'app', 'plugin.json'))?.version;
  if (!want || want === have) return null;
  const app = path.join(ws, 'app');
  fs.cpSync(path.join(plugin, 'scripts'), path.join(app, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(app, 'templates'), { recursive: true });
  for (const t of ['dashboard.html', 'resume.html', 'cover-letter.html']) {
    if (fs.existsSync(path.join(plugin, 'templates', t))) fs.copyFileSync(path.join(plugin, 'templates', t), path.join(app, 'templates', t));
  }
  fs.copyFileSync(path.join(plugin, 'companies.json'), path.join(app, 'companies.json'));
  const own = path.join(ws, 'companies.json');
  const mine = readJson(own);
  if (Array.isArray(mine)) {
    const key = c => `${c.ats}/${(c.slug || c.name).toLowerCase()}`;
    const known = new Set(mine.map(key));
    const added = readJson(path.join(plugin, 'companies.json')).filter(c => !known.has(key(c)));
    if (added.length) fs.writeFileSync(own, '[\n' + [...mine, ...added].map(c => '  ' + JSON.stringify(c)).join(',\n') + '\n]\n');
  }
  fs.copyFileSync(path.join(plugin, 'CLAUDE.md'), path.join(ws, 'CLAUDE.md'));
  fs.copyFileSync(path.join(plugin, '.claude-plugin', 'plugin.json'), path.join(app, 'plugin.json'));
  return { from: have || 'none', to: want };
}

// Keeps one copy of jobs.md and profile.md per day in <ws>/.backups, for the last 14 days.
export function backup(ws, keep = 14, today = new Date().toLocaleDateString('sv-SE')) {
  const root = path.join(ws, '.backups'), dir = path.join(root, today);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    for (const f of ['jobs.md', 'profile.md']) if (fs.existsSync(path.join(ws, f))) fs.copyFileSync(path.join(ws, f), path.join(dir, f));
  }
  const days = fs.readdirSync(root).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  for (const d of days.slice(0, Math.max(0, days.length - keep))) fs.rmSync(path.join(root, d), { recursive: true, force: true });
}

async function main() {
  const ws = [process.cwd(), path.join(os.homedir(), 'Documents', 'Auto Job Hunt')].find(isWorkspace);
  if (!ws) return;
  let synced = null;
  try { synced = syncApp(ws); } catch (e) { console.log(`Auto Job Hunt: could not update the app files (${e.message}).`); }
  try { backup(ws); } catch (e) { console.log(`Auto Job Hunt: daily backup failed (${e.message}).`); }

  const up = () => fetch(`${URL}/api/jobs`, { signal: AbortSignal.timeout(800) }).then(r => r.ok, () => false);
  if (!(await up())) {
    spawn(process.execPath, [path.join(PLUGIN, 'scripts', 'dashboard.mjs'), '--dir', ws], { detached: true, stdio: 'ignore' }).unref();
    for (let i = 0; i < 10 && !(await up()); i++) await new Promise(r => setTimeout(r, 200));
  }
  if (synced) console.log(`Auto Job Hunt was updated (${synced.from} to ${synced.to}). Tell the user in one line that the tool was updated.`);
  console.log((await up())
    ? `Auto Job Hunt: the dashboard is running at ${URL} for the folder "${ws}". Give the user this link in your first reply.`
    : `Auto Job Hunt: the dashboard did not start for "${ws}". Use the dashboard skill to start it.`);
}

function selfTest() {
  const assert = (c, m) => { if (!c) throw new Error(`self-test failed: ${m}`); };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ajh-sync-'));
  const ws = path.join(tmp, 'ws');
  fs.mkdirSync(path.join(ws, 'app'), { recursive: true });
  fs.writeFileSync(path.join(ws, 'app', 'plugin.json'), '{"version":"0.0.1"}');
  fs.writeFileSync(path.join(ws, 'companies.json'), '[{"name":"Mine","ats":"lever","slug":"mine"}]');
  const r = syncApp(ws);
  assert(r && r.from === '0.0.1', 'syncs when version differs');
  assert(fs.existsSync(path.join(ws, 'app', 'scripts', 'scan.mjs')), 'scripts copied');
  const mine = readJson(path.join(ws, 'companies.json'));
  assert(mine[0].name === 'Mine' && mine.length > 1, 'own companies kept and new ones added');
  assert(syncApp(ws) === null, 'no second sync at same version');
  fs.writeFileSync(path.join(ws, 'jobs.md'), 'x');
  for (const d of ['2026-01-01', '2026-01-02', '2026-01-03']) backup(ws, 2, d);
  const kept = fs.readdirSync(path.join(ws, '.backups')).sort();
  assert(kept.join() === '2026-01-02,2026-01-03' && fs.existsSync(path.join(ws, '.backups', '2026-01-03', 'jobs.md')), 'backups kept for N days');
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('self-test ok');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--self-test')) selfTest();
  else await main();
}
