---
name: interview-prep
description: Prepares the user for a job interview - company research, likely questions with answers built from their own experience, a salary answer, and questions to ask. Use when the user says "I have an interview at X", "I got a call from X", "prepare me for X", "interview tomorrow", or when a job's Status becomes Interview.
---

# Interview prep

Follow the talking rules and hard rules in the workspace `CLAUDE.md`. Every answer you suggest must come from the user's resume, CV or `profile.md`. Never invent a story, number or result for them.

## 1. Record it

Find the job in `jobs.md` (ask which one if unclear). Set Status to `Interview` and add to Notes: the date, time, round and interviewer if the user gave them. Ask for the date if they did not say.

## 2. Research (keep it short and true)

Read the job description again. Look up the company: what it sells, who its customers are, its size in India, and recent news from the last 6 months. Use public pages only. Note where each fact came from.

## 3. Write the prep sheet

Save `interviews/<ID>-<company>.md` in the workspace with:

1. **The company in 5 lines**: what they do, recent news, why this role exists (from the job post).
2. **Why you fit**: 3 points, each matching a job requirement to something real the user did.
3. **Likely questions, with answers**: 8 to 10. Mix the usual ones ("Tell me about yourself", "Why are you leaving", "Why us") with ones for the role:
   - sales: targets and how often they hit them, pipeline, biggest deal, a lost deal, handling objections, territory or key accounts;
   - operations, HR, finance and others: the main tasks in the job post;
   - tech: the systems in the job post, a hard problem they solved, design questions at their level.
   Write each answer in the user's voice, short, with their real numbers. Where the resume has no story, write "Your story here:" and ask the user for one.
4. **Salary answer**: using their expected and minimum in `profile.md`, a one-line answer that states their expected range and notice period. Never mention the minimum to the employer.
5. **Questions to ask them**: 4 good ones about the team, targets or success in the first 90 days.
6. **Checklist**: time and link or address, resume version sent (from the Resume column), documents if asked, a quiet place and charged phone for calls.

## 4. Practise (if they want)

Offer: "Want to practise? I will ask the questions one by one and give quick feedback." Ask one question at a time, keep feedback to two lines (what was good, one thing to improve).

## 5. After the interview

When the user tells you how it went, add a one-line note to the job, update Status (`Offer`, `Rejected`, or keep `Interview` for the next round), and save any new true facts they mentioned under "Extra facts from me" in `profile.md`.

End with the dashboard line.
