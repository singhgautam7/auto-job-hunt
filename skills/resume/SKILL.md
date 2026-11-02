---
name: resume
description: Reviews and improves the user's resume, makes resume versions (one per kind of job, same facts, different headline and summary), and makes a longer CV. Saves Word and PDF files in the resumes folder and records which version goes with which job titles. Use when the user says "make my resume", "review my resume", "make my CV", "resume for sales manager", "fix my resume", "change my resume", or during setup.
---

# Resume versions

Follow the talking rules and hard rules in the workspace `CLAUDE.md`. Never add a fact, number, title, company, date or skill that is not in the user's resume, CV or `profile.md` (including "Extra facts from me"). If something important is missing (for example a sales target they hit), ask for it and save it in `profile.md`.

## 0. Review and improve (when the user asks, or says yes during setup)

1. **Review.** Read the whole resume and give a short, kind, honest review in plain words, at most 8 points:
   - what is strong and should stay on top,
   - weak lines (duties with no result, vague words, very long bullets, typos, missing dates or cities),
   - things that stop job sites from reading it (tables, two columns, text in images, photos, headers and footers),
   - what their target jobs ask for that the resume does not show.
2. **Collect new facts.** Go job by job, newest first, and ask short questions: results with numbers (targets hit, revenue, number of accounts or clients, team size, growth), promotions, awards, big clients, new tools or skills. Also ask what they did in any gap. Only what the user tells you becomes a fact. Save each one under "Extra facts from me" in `profile.md` with the job it belongs to.
3. **Rewrite.** Build one clean main resume from `app/templates/resume.html`: one column, standard headings, newest job first. Each bullet is an action, what it was, and the result with the user's real number when they have one. Keep every true fact from the old resume unless the user says to drop it.
4. **Show and confirm.** Show 3 or 4 before and after bullets and the new summary. Change what they ask. Then save it as `resumes/<first>-<last>-main.html` and `.pdf` (`node app/scripts/make-pdf.mjs ...`), and put it first in the Resumes table in `profile.md`. Keep their old resume file too.

The new main resume is the source for the versions below.

## 1. Plan the versions

Group the user's job titles into 2 to 4 kinds (for example "Area/Regional Sales", "Key Accounts", "Business Development"). One version per kind. Same facts in every version; only these change:
- the headline under the name,
- the 2 to 3 line summary,
- the order of skills (most relevant first).

Show the plan in a short list and go ahead unless they object.

## 2. Make the files

- If the resume is a Word file, copy it and change only the headline, summary and skills text, so their design stays the same. Use the docx skill if available.
- If it is a PDF, or no Word tools are available, build each version from `app/templates/resume.html` and turn it into a PDF with `node app/scripts/make-pdf.mjs <file>.html`.
- Save each version as Word and PDF: `resumes/<first>-<last>-<kind>.docx` and `.pdf`. Keep each to 2 pages or less.
- If the user wants to edit together and Claude Docs is available, also put the main version in a Doc and share the link.

Writing rules: plain words, numbers kept exactly as given, no long dashes, no buzzwords ("results-driven", "dynamic", "synergy", "spearheaded"), no first person ("I").

## 2b. CV (when the user asks for one)

In India a CV usually means a longer, complete version of the resume. Build it from the same facts, with nothing left out:
- every job with all real bullets, projects with what they did and the result, certifications, training, awards, languages, and personal details only if the user wants them (date of birth, address);
- same plain style and rules as the resume; 2 to 4 pages is fine.
Save it as `resumes/<first>-<last>-cv.html` and `.pdf` (and Word if the docx skill is available), and add it to `profile.md` as "CV". Use the CV only where a job or form asks for a CV or a detailed profile.

## 3. Check

Read every PDF back. Check it against the original resume: every fact present, nothing added. Fix and recheck if not.

## 4. Record

Update the Resumes table in `profile.md`: file and the job titles it is for. In `jobs.md`, fill the Resume column for New and Apply rows using this table.

## 5. Report

List the versions and what each is for, in a few lines. Then the dashboard line.
