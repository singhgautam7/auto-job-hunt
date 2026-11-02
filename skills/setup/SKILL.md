---
name: setup
description: First-time setup for Auto Job Hunt. Asks the user a short set of questions (name, cities, job titles, resume, salary, notice period), suggests more job titles, creates the Auto Job Hunt folder and opens the dashboard. Use when the user says "set me up", "redo my profile", "set up auto job hunt", or when profile.md is missing or incomplete (the hunt skill calls it for "start").
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
9. Home address (city and state is enough; many forms require it).
10. Gender, for forms that ask (Male / Female / Other / Prefer not to say). Never assume it.

**Your resume, ask both**
- "Do you want me to review your resume first? I will tell you what is strong, what is missing and what to fix." (Yes / No)
- "Is there anything from your current or past jobs that is not on your resume yet? For example a promotion, a target you hit, a big client, an award or a new skill." (Yes, let me tell you / No)
If they say yes to either, run the `resume` skill's "Review and improve" step right after the questions, before suggesting titles or making versions.

**Optional, ask in one go**
11. A CV or longer profile, if different from the resume.
12. Industries you like, and companies to avoid (suggest their current company).
13. LinkedIn link. Do you have a Naukri account?

**Rules, explain then ask**
14. "When you ask me to find jobs, should I also apply to the good ones right away? I will only apply to jobs that match you well (score 4 out of 5 or more), are in your cities and meet your minimum salary when it is shown. You can see every application on your dashboard." (Yes, apply automatically / No, ask me first). If yes: "How many applications a day at most?" (10 / 20 / 30)
15. "Some jobs ask for a cover letter. Should I write one only when the form needs it, or for every application?" (Only when needed / Every application)
16. "Some forms have privacy and consent boxes. Should I tick them for you after reading them?" (Yes / No, I will tick them). If they chose automatic applying and say No here, tell them forms with consent boxes will wait for them.
17. "Naukri and LinkedIn do not allow automatic tools, and may restrict accounts that apply too fast. I will apply slowly, at most 10 jobs a day on each. Is 10 OK?" (10 / 5 / 20)

## 3. Suggest more job titles

From the resume and their titles, suggest 5 to 8 related titles people in India search for. Example for "Sales Manager": Area Sales Manager, Regional Sales Manager, Key Account Manager, Business Development Manager, Enterprise Account Executive, Channel Sales Manager. Say why in a few words if it is not obvious. Let them pick (multi-select). Also point out anything useful from the resume, for example a strong number they should keep on top.

## 4. Create the workspace

1. Folder: `~/Documents/Auto Job Hunt/` (Windows: `Documents\Auto Job Hunt`). In Cowork, use the folder the user shared. If it already has `profile.md`, update it instead of starting over.
2. Copy from PLUGIN:
   - `templates/workspace/*` → workspace root (CLAUDE.md comes from PLUGIN/CLAUDE.md, AGENTS.md, profile.md, Open Dashboard files). Keep only the launcher for their system: `.command` on Mac (keep it executable), `.bat` on Windows.
   - `scripts/` → `app/scripts/`; `templates/dashboard.html`, `templates/resume.html`, `templates/cover-letter.html` → `app/templates/`; `companies.json` → `app/companies.json`; `.claude-plugin/plugin.json` → `app/plugin.json` (to know the version later).
   - Create empty folders `resumes/jobs/` and `letters/`.
3. Fill `profile.md` with every answer. Leave unknown lines blank.
4. Copy their resume (and CV) into `resumes/`, add it to the Resumes table in `profile.md`.
5. Create an empty `jobs.md`:
   `node app/scripts/scan.mjs --jobs jobs.md --add <file with []>` creates the header.

6. If this session was not opened in the workspace folder, tell the user to open Claude in it from now on (see `CLAUDE.md`), because job forms can only get the resume from the session's folder.

**Updating later:** at the start of any session, if PLUGIN's `plugin.json` version is newer than `app/plugin.json`, copy the `app/` files again. Never overwrite `profile.md`, `jobs.md` or `resumes/`.

## 5. Check the one-time needs

Run `node -v`. If Node is missing or below 18, give the plain install steps from `CLAUDE.md` and wait for "done".
Check for Claude in Chrome: its tools exist and at least one browser is connected. If not, give the install message from `CLAUDE.md` with the link https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn and wait for "done", then check again. Say Naukri and LinkedIn need it; company websites work without it.
Ask them to log in to Naukri and LinkedIn in Chrome now, and say "done".

## 6. Open the dashboard

Start it (see the `dashboard` skill), then explain how to open it, in these words:

"Your dashboard is ready: http://localhost:4747
Click the link and it opens in your browser. It only works on this computer.
Next time, open the Auto Job Hunt folder in Documents and double-click Open Dashboard. Bookmark the page to make it one click."

## 7. Next steps (offer as options)

- "Make my resume versions" → `resume` skill
- "Update my Naukri and LinkedIn" → `job-site-profile` skill
- "Find jobs now" → `find-jobs` skill

If setup was started by the `hunt` skill ("start", "job hunt"), do not offer options: go straight back to `hunt` and continue with finding jobs. Otherwise recommend "Find jobs now". Tell them nothing runs by itself: they just come back and say "start" or "find jobs" whenever they want.
