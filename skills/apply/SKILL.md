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
Never apply twice: skip a job if `jobs.md` already has the same company and role as `Applied` (it may have come from another site).
Daily limits: count rows with Applied = today. Stop at `Max applications per day`, and at the per-site limit for Naukri and LinkedIn.

Before applying, check the list is still open: `node app/scripts/check-live.mjs --jobs jobs.md --ids <ids> --mark`. Drop the ones it marks closed. Jobs it lists under `check_in_browser` are checked when you open them.

## 2. Yes or automatic

- `Apply automatically: Yes` and every job on the list passes the limits: go ahead, no question.
- Otherwise show a short numbered list (company, role, city, resume) and ask: "Apply to these N jobs?" If the user's message already said to submit ("apply and submit", "submit all"), that is the yes.

## 3. Apply, one job at a time

Use Claude in Chrome (the user's own Chrome, where they are logged in). Open the job link in a new tab.

**Before filling any form:** read the job description. Use the `tailor` skill to write a cover letter when the form needs one (or `profile.md` says every application), and a job-specific resume when the job needs one. Never submit a required cover letter field empty.

**Company forms (Greenhouse, Lever, Ashby, Workday, others)**
- Fill every field from `profile.md`. Upload the resume PDF from the job's Resume column (a job-specific one if `tailor` made it).
- Dropdowns that do not take typed text: click to open, then click the option. Some dropdowns allow several answers: a picked option then vanishes from the list, so check what the field shows instead of picking again.
- Read every field back before submitting (text, dropdowns, ticked boxes, attached file name). Never trust that a click worked.
- Screening questions: answer only from `profile.md` and the resume. Yes/No questions about experience must match the resume. If you do not know an answer, do not guess: leave the job unsubmitted, write "Needs you: <question>" in its Notes, and ask all such questions together at the end. Save the answers under "Saved answers" in `profile.md`, then finish those jobs.
- Consent boxes and NDAs: follow hard rule 4.
- Personal questions: follow hard rule 5.
- Sign in, create account, OTP or CAPTCHA: stop this job, write "Needs you: <what>" in its Notes, move on.

**Naukri**
- Click Apply. If it goes to the company website, treat it as a company form.
- Naukri may show a chat of questions. Answer from `profile.md`, same rules as above.

**LinkedIn (tested)**
- **Easy Apply** jobs are applied inside LinkedIn (steps below).
- **"Apply on company website"** jobs (button "Apply" with an arrow) are supported too (tested). LinkedIn opens the company's site in a new tab. That page may be the company's careers page with its own "Apply" button, which opens the real form in another tab (for example LinkedIn, then careers.scopely.com, then a Greenhouse form). Follow the Apply buttons until you reach the form, then fill it as a company form above. Close the extra tabs when done.
  - Check the final site belongs to that company or its hiring system (Greenhouse, Lever, Ashby, SmartRecruiters, Workday, the company's own domain). If it is a third-party job site or looks odd, stop and ask the user.
  - Sites that need an account first (Workday, Taleo, SuccessFactors, iCIMS, many company portals): write "Needs you: create an account on <site> (one time)" in Notes and move on. After the user has signed up and is logged in, you can fill those forms.
  - In `jobs.md`, keep the LinkedIn link, and add "Applied on <company> site" to Notes. If the same company and role already has a row from the company's own board, update that row instead of adding a new one.
  - If the form is on Greenhouse, Lever, Ashby or SmartRecruiters and the company is not in `companies.json`, add it (test first with `--check`) so future searches find its jobs directly.
- Easy Apply has several pages (contact, resume, work history, education, questions, review). Fill every page; never just click Next.
- **Resume page: LinkedIn pre-selects the last file used, which can be the wrong file (in testing it was a cover letter).** Always pick the resume that matches the job's Resume column yourself and check the review page shows that file name.
- Easy Apply only lets you choose resumes already saved on the user's LinkedIn (company-site forms do allow uploading the PDF). Uploading a new one opens the computer's file picker, which you cannot use. So during setup or `job-site-profile`, ask the user once to upload their resume versions in LinkedIn (Jobs, then Application settings). Until then, pick the saved resume closest to the right version and say which one you used.
- Work history and education are copied from the LinkedIn profile. Fix anything that disagrees with the resume (for example a degree shown as "N/A").
- Questions not answered in `profile.md` (for example "Can you work in the office 5 days a week?" or "Do you know anyone here?"): ask the user, then save the answer.
- Untick "Follow company" if it is shown. After submitting, close LinkedIn's "update your profile" offer with "Not now".
- Success means LinkedIn shows "Your application was sent" or "Application submitted".

**When something goes wrong:** follow the table in `CLAUDE.md`. The two that matter most here: never click Submit twice without a visible error, and never guess a form answer.

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
