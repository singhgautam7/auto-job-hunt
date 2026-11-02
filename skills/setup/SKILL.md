---
name: setup
description: First-time setup for Job Autopilot. Asks the user a short set of questions (name, cities, job titles, resume, salary, notice period), suggests more job titles, creates the Job Autopilot folder and opens the dashboard. Use when the user says "start", "set me up", "start my job search", "set up job autopilot", or when profile.md is missing or incomplete.
---

# Setup

Follow the talking rules in the plugin's `CLAUDE.md` (two folders up from this skill): easy English, few words, no long dashes, end every reply with the dashboard line once the dashboard exists.

The plugin folder is two levels up from this skill's folder. Call it PLUGIN below.

## 1. Welcome (one short message)

"Hi! I will help you find jobs and apply for you. First, a few quick questions. It takes about 5 minutes."

## 2. Ask the questions

Ask in small groups. Use clickable options when the app offers them (AskUserQuestion), free text otherwise. Skip anything you can read from the resume, but confirm it.

**Required**
1. Your resume. "Please attach your resume (PDF or Word)." Do not continue without it. Read it fully.
2. Full name, email, phone. Offer what the resume says and ask to confirm.
3. Current city.
4. Job titles you want (up to 5).
5. Preferred cities, in order. Options: Mumbai, Pune, Bengaluru, Delhi NCR, Hyderabad, Chennai, plus "Other". Then: open to remote jobs? Open to moving?
6. Current fixed salary per year, and variable or bonus.
7. Expected total salary, and the **minimum fixed salary** you will accept.
8. Notice period (Immediate, 15 days, 30 days, 60 days, 90 days).

**Optional, ask in one go**
9. A CV or longer profile, if different from the resume.
10. Industries you like, and companies to avoid (suggest their current company).
11. LinkedIn link. Do you have a Naukri account?

**Rules, explain then ask**
12. "Should I apply for you automatically every morning? I will only apply to jobs that match you well (score 4 out of 5 or more), are in your cities and meet your minimum salary when it is shown. You can see every application on your dashboard." (Yes, apply automatically / No, ask me first). If yes: "How many applications a day at most?" (10 / 20 / 30)
13. "Some forms have privacy and consent boxes. Should I tick them for you after reading them?" (Yes / No, I will tick them). If they chose automatic applying and say No here, tell them forms with consent boxes will wait for them.
14. "Naukri and LinkedIn do not allow automatic tools, and may restrict accounts that apply too fast. I will apply slowly, at most 10 jobs a day on each. Is 10 OK?" (10 / 5 / 20)

## 3. Suggest more job titles

From the resume and their titles, suggest 5 to 8 related titles people in India search for. Example for "Sales Manager": Area Sales Manager, Regional Sales Manager, Key Account Manager, Business Development Manager, Enterprise Account Executive, Channel Sales Manager. Say why in a few words if it is not obvious. Let them pick (multi-select). Also point out anything useful from the resume, for example a strong number they should keep on top.

## 4. Create the workspace

1. Folder: `~/Documents/Job Autopilot/` (Windows: `Documents\Job Autopilot`). In Cowork, use the folder the user shared. If it already has `profile.md`, update it instead of starting over.
2. Copy from PLUGIN:
   - `templates/workspace/*` → workspace root (CLAUDE.md comes from PLUGIN/CLAUDE.md, AGENTS.md, profile.md, Open Dashboard files). Keep only the launcher for their system: `.command` on Mac (keep it executable), `.bat` on Windows.
   - `scripts/` → `app/scripts/`, `templates/dashboard.html` → `app/templates/dashboard.html`, `companies.json` → `app/companies.json`, `.claude-plugin/plugin.json` → `app/plugin.json` (to know the version later).
3. Fill `profile.md` with every answer. Leave unknown lines blank.
4. Copy their resume (and CV) into `resumes/`, add it to the Resumes table in `profile.md`.
5. Create an empty `jobs.md`:
   `node app/scripts/scan.mjs --jobs jobs.md --add <file with []>` creates the header.

**Updating later:** at the start of any session, if PLUGIN's `plugin.json` version is newer than `app/plugin.json`, copy the `app/` files again. Never overwrite `profile.md`, `jobs.md` or `resumes/`.

## 5. Check the one-time needs

Run `node -v`. If Node is missing or below 18, give the plain install steps from `CLAUDE.md` and wait for "done".
Check for Claude in Chrome tools. If missing, give the install step and say Naukri and LinkedIn will work after that; company websites still work.
Ask them to log in to Naukri and LinkedIn in Chrome now, and say "done".

## 6. Open the dashboard

Start it (see the `dashboard` skill), then explain how to open it, in these words:

"Your dashboard is ready: http://localhost:4747
Click the link and it opens in your browser. It only works on this computer.
Next time, open the Job Autopilot folder in Documents and double-click Open Dashboard. Bookmark the page to make it one click."

## 7. Next steps (offer as options)

- "Make my resume versions" → `resume` skill
- "Update my Naukri and LinkedIn" → `job-site-profile` skill
- "Find jobs now" → `find-jobs` skill
- "Run every morning" → create a daily scheduled task at 9 AM in the workspace folder. Its prompt: "Run the job-autopilot find-jobs skill. Then, if profile.md says Apply automatically: Yes, run the apply skill on the jobs it allows." Use the app's scheduled tasks tool if available; otherwise skip and say they can ask any time. Tell them it runs while the Claude app is open and the computer is awake, and that Chrome must stay logged in to Naukri and LinkedIn.

Recommend "Find jobs now" first, then "Run every morning".
