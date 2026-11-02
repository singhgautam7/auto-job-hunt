---
name: find-jobs
description: Finds new jobs for the user on company career pages, Naukri and LinkedIn, scores each one against profile.md, and adds them to jobs.md so they show on the dashboard. Use when the user says "find jobs", "search for jobs", "any new jobs?", "look on Naukri" or "look on LinkedIn".
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

The built-in list has about 75 companies: tech firms, which also hire tech sales, plus sales-heavy companies like Paytm, Swiggy, Airwallex, ZoomInfo and Bosch.

**Other fields (the first time, and when the user asks for more companies):** if the user's work is not covered well (for example FMCG sales, banking, pharma, real estate, retail), research companies in their field and city that hire in India. For each, find its job board on Greenhouse, Lever, Ashby or SmartRecruiters (look at the "Apply" link on its careers page), then test it:
`node app/scripts/scan.mjs --check <greenhouse|lever|ashby|smartrecruiters> <slug>`
Add it only if the test shows jobs in India: copy `app/companies.json` to the workspace `companies.json` once, then add `{"name": "...", "ats": "...", "slug": "..."}`. Many Indian companies use other systems (Workday, Darwinbox, their own site); for those, Naukri and LinkedIn are the source, so tell the user that in one line instead of adding them.

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
- **Status** `Skip` if it breaks a limit: wrong city, not remote when they need remote, pay shown and its top is below their minimum, company to avoid, posting closed, a rule under "Other rules", or the user already applied to the same company and role (check rows with Status `Applied`).
- **Pay not shown:** never skip for that alone. If you know the company usually pays well below their minimum for this level, lower the Score and say so in the Verdict.
- **Experience:** read the job's required years. If it asks for 3 or more years above theirs, lower the Score.
- **Pay**: fill in if the posting shows it.
- **Resume**: the resume file from `profile.md` that best fits the title.

Keep the table shape. Never touch Notes or rows the user changed.

## 4. Report (short)

- New jobs found, and from where.
- Top 5 by score: company, role, city, score, one-line reason.
- If `Apply automatically: Yes`: go straight on to the `apply` skill for the jobs it allows, then report both together.
- Otherwise: "Say 'apply to the top 5', or name the jobs you want."
- Dashboard line (start it first if needed).
