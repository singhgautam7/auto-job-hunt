# Auto Job Hunt

A Claude plugin that runs your job search for you. No tech skills needed.

- Asks you a few questions and reads your resume.
- Finds jobs on 50+ company career pages, Naukri and LinkedIn.
- Scores each job against what you want and skips the ones that do not fit.
- Applies for you, slowly and safely, after you say yes.
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

## Every day

- If you turned on **Apply automatically**, Claude finds and applies to good matches every morning by itself. You just check the dashboard.
- If not, say **"find jobs"**, then **"apply to the top 5"** and say yes.
- Tell Claude when you get an interview, offer or rejection, and it updates the dashboard.

## Your dashboard

Click `http://localhost:4747` in any Claude reply, or double-click **Open Dashboard** in the `Documents/Auto Job Hunt` folder. It works only on your computer. Bookmark it.

## Good to know

- Claude never types your passwords or OTPs, never creates accounts, and never solves CAPTCHAs. When a site needs one of these, it tells you and moves on.
- Naukri and LinkedIn do not allow automatic tools and can restrict accounts that apply too fast. Auto Job Hunt applies to at most 10 jobs a day on each (you can change this) and stops on any warning.
- Your data stays in the `Auto Job Hunt` folder on your computer: `profile.md` (your answers), `jobs.md` (every job), `resumes/`.

## Credits

Job board scanning approach inspired by [career-ops](https://github.com/career-ops-hq/career-ops) (MIT). Dashboard ideas inspired by [dossier](https://github.com/AienTech/dossier).

MIT License.
