---
name: apply
description: Applies to jobs for the user. Fills company job forms, Naukri and LinkedIn applications with profile.md and the right resume, ticks consent boxes when allowed, submits (automatically when the user turned that on, otherwise after their yes), and marks the jobs as Applied in jobs.md. Use when the user says "apply", "apply to the top 5", "apply to job 12", "submit", or after find-jobs when automatic applying is on.
---

# Apply

Follow the talking rules and hard rules in the workspace `CLAUDE.md`. Read `profile.md` and `jobs.md` first (the user may have changed them in the dashboard).

## 1. Make the list

- Automatic run (`Apply automatically: Yes`, after find-jobs or on schedule): rows with Status `New` or `Apply` and Score at or above the minimum in `profile.md`, highest first.
- Just "apply": rows with Status `Apply`, else the automatic list.
- "top N": the N highest scores with Status `New` or `Apply`.
- IDs or company names: those rows.

Drop any job that breaks the user's limits (city, minimum pay, companies to avoid) and say why in one line.
Daily limits: count rows with Applied = today. Stop at `Max applications per day`, and at the per-site limit for Naukri and LinkedIn.

## 2. Yes or automatic

- `Apply automatically: Yes` and every job on the list passes the limits: go ahead, no question.
- Otherwise show a short numbered list (company, role, city, resume) and ask: "Apply to these N jobs?" If the user's message already said to submit ("apply and submit", "submit all"), that is the yes.

## 3. Apply, one job at a time

Use Claude in Chrome (the user's own Chrome, where they are logged in). Open the job link in a new tab.

**Company forms (Greenhouse, Lever, Ashby, Workday, others)**
- Fill every field from `profile.md`. Upload the resume PDF from the job's Resume column.
- Dropdowns that do not take typed text: click to open, then click the option.
- Screening questions: answer only from `profile.md` and the resume. Yes/No questions about experience must match the resume. If you do not know an answer, do not guess: leave the job unsubmitted, write "Needs you: <question>" in its Notes, and ask all such questions together at the end (or in the next chat, for a scheduled run). Save the answers under "Saved answers" in `profile.md`, then finish those jobs.
- Consent boxes and NDAs: follow hard rule 4.
- Personal questions: follow hard rule 5.
- Sign in, create account, OTP or CAPTCHA: stop this job, write "Needs you: <what>" in its Notes, move on.

**Naukri**
- Click Apply. If it goes to the company website, treat it as a company form.
- Naukri may show a chat of questions. Answer from `profile.md`, same rules as above.

**LinkedIn**
- Use Easy Apply only. Go through each step, check every field, attach the resume.
- If the job says "Apply on company website", treat it as a company form.
- Untick "Follow company" before submitting.

**Every site**
- Before submitting, check that all required fields are filled and the right resume is attached.
- Click Submit. Wait for the success message. Do not claim success without it.
- On Naukri and LinkedIn, wait 30 to 90 seconds before the next application. Stop everything on a CAPTCHA or "unusual activity" warning.

## 4. Update jobs.md after each job

- Success: Status `Applied`, Applied = today's date, Resume = file used.
- Closed posting: Status `Closed`.
- Blocked: keep Status, add the reason to Notes (append, never erase the user's notes).

## 5. Report

A short table: company, role, result (Applied, Needs you, Closed). Then what the user must do, if anything, in one or two lines. Then the dashboard line.
