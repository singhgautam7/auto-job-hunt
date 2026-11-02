---
name: dashboard
description: Starts the Auto Job Hunt dashboard and explains how to open it in the browser. Use when the user says "open dashboard", "show my jobs", "where is my dashboard", "dashboard not working", or "run the server".
---

# Dashboard

Follow the talking rules in the workspace `CLAUDE.md`.

## Start it

1. Check: `curl -s -o /dev/null -w "%{http_code}" http://localhost:4747/api/jobs`. If it prints 200, it is running.
2. If not, from the workspace run in the background: `node app/scripts/dashboard.mjs --dir "<workspace>"`, then check again.
3. If `node` is missing, give the Node install steps from `CLAUDE.md`.
4. In Cowork, you cannot start it. Ask the user to double-click **Open Dashboard** in their Auto Job Hunt folder.

## Tell the user how to open it

"Your dashboard: http://localhost:4747
Click the link. It opens in your browser and only works on this computer.
Next time: open the Auto Job Hunt folder in Documents and double-click Open Dashboard. Bookmark the page to make it one click."

Explain what they can do there, only the first time:
- See every job: company, role, city, work mode, when it was posted, when I found it, pay, match score and the reason.
- Click a number at the top to filter (New, Applied, Interview...). Click a column name to sort.
- Write notes on any job. They save by themselves.
- To change anything else, just ask me in chat. The page updates by itself.

## If it does not work

- "Cannot reach" in the browser: start it again (step 2).
- Port 4747 busy with something else: start with `--port 4748` and give that link.
- Mac says "Open Dashboard cannot be opened": right-click it, choose Open, then Open again.
- Windows shows a black window: keep it open while using the dashboard.
