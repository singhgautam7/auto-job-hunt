---
name: tailor
description: Writes a cover letter and, when needed, a job-specific resume for one job, from that job's description and the user's own resume. Saves PDFs ready to upload and checks every fact against the resume. Use when the user says "write a cover letter for job 12", "make a resume for this job", "tailor my resume for Zscaler", and from the apply skill when a form asks for a cover letter or the job needs its own resume.
---

# Cover letter and job-specific resume

Follow the talking rules and hard rules in the workspace `CLAUDE.md`. Work in the workspace folder.

## The one rule that matters

**Every fact must come from the user's resume, CV, `profile.md` or the user's own words in this chat.** You may reorder, choose what to show, shorten, and use the job's words for things the user really did. You may never add a number, company, title, date, tool, skill, degree or result that is not in those sources. If a strong point is missing (for example a sales target they hit), ask the user one short question and save the answer under "Saved answers" in `profile.md`. Never fill a gap with a guess.

## 1. Read

- The job: open its Link from `jobs.md` and read the whole description. Note the must-have skills, nice-to-haves, years asked, and the words they use.
- The user: their main resume (Resumes table in `profile.md`), CV if any, and "Saved answers".
- Decide what the job cares about most, and which of the user's real experience proves it.

## 2. Job-specific resume (when needed)

Make one when the user asks, when `profile.md` says `Job-specific resume: Always`, or (default, `When needed`) when the job's must-haves that the user truly has are not visible near the top of their chosen resume version.

1. Copy `app/templates/resume.html` to `resumes/jobs/<ID>-<company>.html` (lowercase, dashes, no spaces).
2. Fill it:
   - Headline: the user's real title, phrased toward this job.
   - Summary: 2 to 3 sentences leading with what this job asks for most.
   - Skills: their true skills, most relevant first.
   - Experience: every job they have, in the same order and with the same titles and dates as the resume. Put the most relevant bullets first in each job; drop weak ones if space is short.
   - Education and anything else exactly as in the resume.
3. `node app/scripts/make-pdf.mjs resumes/jobs/<ID>-<company>.html`. It prints the page count. Keep it to 2 pages; if longer, cut the least relevant bullets and run again.

## 3. Cover letter

Write one when the form has a cover letter field and it is required, or when `profile.md` says `Cover letters: Every application`, or when the user asks.

1. Copy `app/templates/cover-letter.html` to `letters/<ID>-<company>.html`.
2. Write 180 to 260 words in three short paragraphs:
   - Why them for this role, with one real result.
   - Two or three things the job asks for, each matched to something real they did.
   - One true, specific reason for this company (from the job post or the company's site), notice period if helpful, simple close.
3. Sound like a person: short sentences, plain words, no long dashes, no "I am excited to", "passionate", "leverage", "dynamic", "synergy", "fast-paced", "I believe I would be a great fit". Use the hiring manager's name only if the post gives it; else "Dear Hiring Team".
4. `node app/scripts/make-pdf.mjs letters/<ID>-<company>.html`. It must be 1 page.
5. If the form has a text box instead of an upload, paste the same letter as plain text.

## 4. Check before using

List every number, company, title, date, tool and skill in what you wrote. Find each one in the sources. Remove or fix anything you cannot find, then make the PDF again. Read the PDF once to check it looks right (no cut text, no empty page).

## 5. Record

- In `jobs.md`, set the job's Resume column to the file used (`resumes/jobs/<ID>-<company>.pdf` or the base version).
- Append to its Notes: "Cover letter: letters/<ID>-<company>.pdf" when you wrote one.
- If the user asked directly, tell them in one or two lines what you wrote and where, then the dashboard line.
