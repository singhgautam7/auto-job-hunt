#!/usr/bin/env node
// Runs when a Claude chat starts (plugin SessionStart hook). If an Auto Job Hunt
// folder exists, makes sure its dashboard is running and tells Claude the link.
// Prints nothing when there is no workspace yet, so other projects are untouched.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const URL = 'http://localhost:4747';
const isWorkspace = dir => fs.existsSync(path.join(dir, 'profile.md')) && fs.existsSync(path.join(dir, 'jobs.md'));
const ws = [process.cwd(), path.join(os.homedir(), 'Documents', 'Auto Job Hunt')].find(isWorkspace);
if (!ws) process.exit(0);

const up = () => fetch(`${URL}/api/jobs`, { signal: AbortSignal.timeout(800) }).then(r => r.ok, () => false);

if (!(await up())) {
  const server = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dashboard.mjs');
  spawn(process.execPath, [server, '--dir', ws], { detached: true, stdio: 'ignore' }).unref();
  for (let i = 0; i < 10 && !(await up()); i++) await new Promise(r => setTimeout(r, 200));
}

console.log((await up())
  ? `Auto Job Hunt: the dashboard is running at ${URL} for the folder "${ws}". Give the user this link in your first reply.`
  : `Auto Job Hunt: the dashboard did not start for "${ws}". Use the dashboard skill to start it.`);
