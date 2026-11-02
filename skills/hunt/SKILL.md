---
name: hunt
description: Runs the whole job hunt in one go - setup questions if they are not done yet, then a job search, then applying. Use when the user says "start", "start hunt", "start my hunt", "job hunt", "hunt", "let's start", "find and apply", or opens a chat with just a greeting in their Auto Job Hunt folder.
---

# Start the hunt

Follow the talking rules and hard rules in the workspace `CLAUDE.md`. Tell the user in one short line which step you are on.

## 1. Setup, only if needed

Find the workspace (see `CLAUDE.md`). If there is no `profile.md`, or a required answer in it is empty, run the `setup` skill first. Ask only the missing questions; never repeat ones already answered. When setup is complete, go straight on to step 2 without waiting to be asked.

If the profile is complete, say "Welcome back" and the one or two most useful facts from `jobs.md` (for example "8 applied, 1 needs your answer"), then go on.

## 2. Things waiting for the user

If any job's Notes say "Needs you", ask those questions now in one go, save the answers in `profile.md`, and finish those applications in step 4.

## 2b. Keep Naukri fresh

Naukri shows recently updated profiles higher. If the user has a Naukri account and `Naukri profile last updated` in `profile.md` is empty or more than 14 days ago, ask: "Your Naukri profile was last updated on <date>. Refresh it now with your latest resume? It helps recruiters find you." On yes, run the `job-site-profile` skill (Naukri part only).

## 3. Find jobs

Run the `find-jobs` skill: company career pages, then Naukri and LinkedIn when Chrome is connected, then score everything new.

## 4. Apply

Run the `apply` skill:
- `Apply automatically: Yes` in `profile.md`: apply to the jobs it allows, without asking.
- Otherwise show the top matches (up to 5, score 4 or more first) and ask one question: "Apply to these?"

## 5. Report

A short summary: new jobs found, applied today, anything that needs the user. Then the dashboard line.
