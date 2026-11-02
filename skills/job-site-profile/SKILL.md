---
name: job-site-profile
description: Updates the user's Naukri and LinkedIn profiles once from their resume and profile.md, so recruiters find them. Uploads the resume and sets headline, summary, key skills, salary, notice period and preferred cities. Use when the user says "update my Naukri", "update my LinkedIn", "upload my resume to Naukri", or "make my profile better".
---

# Update Naukri and LinkedIn profile

Follow the talking rules and hard rules in the workspace `CLAUDE.md`. Needs Claude in Chrome and the user logged in. If they are not logged in, ask them to log in and say "done". Never touch password, email, phone number or privacy settings.

## 1. Read and plan

Read `profile.md` and the resume. Open their Naukri profile (`https://www.naukri.com/mnjuser/profile`) and LinkedIn profile, and read what is there now.

Draft the changes. Use only facts from the resume and `profile.md`. Plain words, no long dashes, nothing that sounds AI written.

**Naukri**
- Resume: upload the main resume PDF.
- Resume headline: one line, under 250 characters, title + years + strongest area. Example: "Area Sales Manager, 8 years in FMCG distribution across Maharashtra".
- Key skills: 10 to 15 from the resume, the ones recruiters search for.
- Profile summary: 3 to 4 short sentences.
- Career profile: current salary, expected salary, notice period, preferred locations, job type.
- Employment: check the current job matches the resume.

**LinkedIn**
- Headline: same idea as Naukri.
- About: 3 to 5 short sentences.
- Skills: add missing ones from the resume (up to 10).
- Open to work: job titles and cities from `profile.md`, visible to **recruiters only** (so their current employer does not see it).
- Saved resumes for Easy Apply (Jobs > Application settings): the user must upload these themselves, because uploading opens the computer's file picker. Tell them which PDFs from `resumes/` to upload (one per version) and wait for "done".

## 2. Show, then ask once

Show a short before/after list for each site. Ask: "Make these changes?" Change only what they approve.

## 3. Make the changes

Edit one section at a time, save, and check the page shows the new text. Go at human speed. Stop on any CAPTCHA or warning.

## 4. Record

After a Naukri update, set `Naukri profile last updated` in `profile.md` to today's date.

## 5. Report

What changed on each site, in a few lines. Suggest updating the Naukri resume every 2 weeks (Naukri shows recently updated profiles higher). Then the dashboard line.
