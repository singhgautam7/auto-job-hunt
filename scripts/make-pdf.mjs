#!/usr/bin/env node
// Turns an HTML resume or cover letter into a PDF with the Chrome already on the
// computer (headless print). No dependencies, Node 18+.
// node make-pdf.mjs <in.html> [out.pdf]   → prints {"pdf": "...", "pages": N}

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const CHROMES = {
  darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'],
  win32: [
    `${process.env['PROGRAMFILES'] || 'C:\\Program Files'}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)'}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env.LOCALAPPDATA || ''}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)'}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ],
  linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'],
};

export function findChrome() {
  return (CHROMES[process.platform] || CHROMES.linux).find(p => p && fs.existsSync(p));
}

// Counts page objects ("/Type /Page", not "/Type /Pages") in a PDF.
export const countPages = buf => (buf.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) || []).length;

export function makePdf(input, output = input.replace(/\.html?$/i, '.pdf')) {
  const chrome = findChrome();
  if (!chrome) throw new Error('Google Chrome was not found. Install Chrome, then try again.');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ajh-pdf-'));
  try {
    execFileSync(chrome, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--user-data-dir=${profile}`,
      `--print-to-pdf=${path.resolve(output)}`, pathToFileURL(path.resolve(input)).href], { stdio: 'ignore', timeout: 60000 });
  } finally { fs.rmSync(profile, { recursive: true, force: true }); }
  return { pdf: path.resolve(output), pages: countPages(fs.readFileSync(output)) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--self-test')) {
    const assert = (c, m) => { if (!c) throw new Error(`self-test failed: ${m}`); };
    assert(countPages(Buffer.from('<< /Type /Pages /Count 2 >> << /Type /Page >> << /Type/Page /Parent 1 >>')) === 2, 'page count');
    console.log('self-test ok');
  } else {
    const [input, output] = process.argv.slice(2);
    if (!input) { console.error('Usage: node make-pdf.mjs <in.html> [out.pdf]'); process.exit(2); }
    console.log(JSON.stringify(makePdf(input, output)));
  }
}
