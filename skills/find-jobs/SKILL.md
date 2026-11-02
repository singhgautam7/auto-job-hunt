---
name: find-jobs
description: Finds new jobs for the user on company career pages, Naukri and LinkedIn, scores each one against profile.md, and adds them to jobs.md so they show on the dashboard. Use when the user says "find jobs", "search for jobs", "any new jobs?", "look on Naukri", "look on LinkedIn", or for the daily scheduled run.
---

# Find jobs

Follow the talking rules and hard rules in the workspace `CLAUDE.md`. Work in the workspace folder. Read `profile.md` first. Tell the user what you are doing in one short line per step ("Checking 50 company career pages...").

## 1. Company career pages (fast, no login)

```
node app/scripts/scan.mjs --jobs jobs.md --roles "<titles>" --cities "<cities>" [--remote] --days 30 --companies <list>
```
- `<titles>`: wanted titles plus accepted suggestions, comma separated. A title matches when every word appears in the job title, so prefer short forms ("sales manager", "account executive", "business development").
- `<cities>`: preferred cities. Add `--remote` if they accept remote.
- `<list>`: `companies.json` in the workspace if it exists, else `app/companies.json`.
- The output says how many new jobs were added and which companies failed. Failures are fine; do not retry more than once.

To add companies for the user's field: find the company's job board on Greenhouse, Lever, Ashby or SmartRecruiters, then add `{"name": "...", "ats": "greenhouse|lever|ashby|smartrecruiters", "slug": "..."}` to the workspace `companies.json` (copy `app/companies.json` first). Only add a company after one test fetch works.

## 2. Naukri and LinkedIn (needs Claude in Chrome and the user logged in)

Skip this step with one line if Claude in Chrome is not available or the user is not logged in.

Search each wanted title in each preferred city, newest first, first 2 pages only. Go at human speed. Stop at once on a CAPTCHA or warning and tell the user.

- Naukri: `https://www.naukri.com/<title-with-dashes>-jobs-in-<city>?jobAge=7` (add `&experience=<years>`).
- LinkedIn: `https://www.linkedin.com/jobs/search/?keywords=<title>&location=<city>%2C%20India&f_TPR=r604800&sortBy=DD`.

Read each result: company, title, location, salary if shown, posted ("3 days ago" → convert to a date), and the job link (no tracking parameters). Skip jobs from companies to avoid. Write them to a temp JSON file as
`[{"company","role","location","mode","posted","pay","link","source":"naukri"|"linkedin"}]` and run
`node app/scripts/scan.mjs --jobs jobs.md --add <file>`. It skips duplicates by link.

## 3. Score every job with Status `New` and no Score

For each, open the job page only if the title and location are not enough. Then edit its row in `jobs.md`:
- **Score** 1 to 5: how well the job fits their titles, experience, industry and cities. 4+ means worth applying.
- **Verdict**: one short reason in plain words, for example "Good fit, Mumbai, pay not shown" or "Needs 10+ years, you have 6".
- **Status** `Skip` if it breaks a limit: wrong city, not remote when they need remote, pay shown and its top is below their minimum, company to avoid, posting closed.
- **Pay**: fill in if the posting shows it.
- **Resume**: the resume file from `profile.md` that best fits the title.

Keep the table shape. Never touch Notes or rows the user changed.

## 4. Report (short)

- New jobs found, and from where.
- Top 5 by score: company, role, city, score, one-line reason.
- "Pick jobs on your dashboard by setting Status to Apply, or say 'apply to the top 5'."
- Dashboard line (start it first if needed).

A scheduled run does steps 1 to 4 and never applies.
