# WeeklyFlow — Weekly Report Collaboration Platform

Streamline your weekly reporting — from field updates to executive insights, all in one place.

```
Staff → Team Lead → Strategy Team → Executive
  ↑         ↑            ↑              │
  └─ feedback ← feedback ← feedback ←──┘
```

## Live Demo

> **https://hazajous-code.github.io/reporting-/**
>
> No server needed — runs entirely in the browser with localStorage.

## Deploy to GitHub Pages

1. Create a repo on GitHub (this project uses `reporting-`)
2. Push this code:
   ```bash
   git remote add origin https://github.com/hazajous-code/reporting-.git
   git add -A && git commit -m "Initial commit"
   git branch -M main
   git push -u origin main
   ```
3. Go to **Settings → Pages → Source** → select **GitHub Actions**
4. The workflow runs automatically — your site is live in ~1 minute

> If you rename the repo, update `base` in `client/vite.config.js` to match `'/your-repo-name/'`.

## Local Development

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Staff | `staff1@test.com` — `staff6@test.com` | `1234` |
| Team Lead | `leader1@test.com` — `leader3@test.com` | `1234` |
| Strategy | `strategy@test.com` | `1234` |
| Executive | `exec@test.com` | `1234` |

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router 7
- **Data:** localStorage (no backend required)
- **Deploy:** GitHub Pages via GitHub Actions
