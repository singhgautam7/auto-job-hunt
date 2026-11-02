<img src=".claude-plugin/icon.png" width="96" alt="">

# Auto Job Hunt

A Claude plugin that runs your job search for you. No tech skills needed.

- Asks you a few questions and reads your resume.
- Finds jobs on about 75 company career pages (tech, tech sales and sales), Naukri and LinkedIn.
- Scores each job against what you want and skips the ones that do not fit.
- Writes a cover letter and a job-specific resume when a job needs one, using only facts from your resume.
- Applies for you, slowly and safely, after you say yes (or right away, if you turn that on).
- Shows everything on a dashboard in your browser: every job, when it was posted, when it was found, its status and your notes.

## What you need

1. The **Claude desktop app** with a paid plan.
2. **Node.js** (free): go to [nodejs.org](https://nodejs.org), download the LTS version and install it.
3. **Claude in Chrome** extension: [install it from the Chrome Web Store](https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn), click **Add to Chrome**, then sign in with your Claude account. Log in to Naukri and LinkedIn in Chrome yourself.

## Install

**Claude desktop, Code tab or Claude Code:**

```
/plugin marketplace add singhgautam7/auto-job-hunt
/plugin install auto-job-hunt@auto-job-hunt
```

**Claude desktop, Cowork:** download `auto-job-hunt.plugin` from the releases page, drop it into the chat and click to install.

Then say **"start"**. Claude asks its questions and opens your dashboard.

## How to use it

Nothing runs by itself. Open Claude in your `Auto Job Hunt` folder and say what you want:

- **"find jobs"**: Claude searches, scores every job, and if you turned on **Apply automatically**, applies to the good matches right away.
- **"apply to the top 5"** or **"apply to job 12"**: Claude writes a cover letter or a job-specific resume when the job needs one, fills the form and submits.
- **"I got an interview at Zscaler"**: Claude updates your dashboard.

## Your dashboard

It starts by itself when you open a chat with Claude. Click `http://localhost:4747` in any Claude reply, or double-click **Open Dashboard** in the `Documents/Auto Job Hunt` folder. It works only on your computer. Bookmark it.

## Good to know

- Claude never types your passwords or OTPs, never creates accounts, and never solves CAPTCHAs. When a site needs one of these, it tells you and moves on.
- Naukri and LinkedIn do not allow automatic tools and can restrict accounts that apply too fast. Auto Job Hunt applies to at most 10 jobs a day on each (you can change this) and stops on any warning.
- Your data stays in the `Auto Job Hunt` folder on your computer: `profile.md` (your answers), `jobs.md` (every job), `resumes/`.

## Credits

Job board scanning approach inspired by [career-ops](https://github.com/career-ops-hq/career-ops) (MIT). Dashboard ideas inspired by [dossier](https://github.com/AienTech/dossier).

MIT License.
