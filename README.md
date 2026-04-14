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
3. **Settings → Pages → Build and deployment**에서 **Source**를 **GitHub Actions**로 선택합니다. (여기가 **Deploy from a branch**로 되어 있으면 사이트가 비어 **404**가 납니다.)
4. **Actions** 탭에서 `Deploy to GitHub Pages` 워크플로가 초록색으로 끝났는지 확인합니다. 첫 배포는 **Settings → Environments → `github-pages`**에서 배포 승인이 필요할 수 있습니다.
5. 주소는 저장소 이름과 같습니다: `https://hazajous-code.github.io/reporting-/`

### 404가 날 때 (GitHub Pages)

| 증상 | 확인 |
|------|------|
| 브라우저 전체가 GitHub 404 페이지 | Pages 소스가 **GitHub Actions**인지, Actions 배포가 성공했는지 확인 |
| 메인은 되는데 새로고침만 404 | 빌드에 `404.html` 포함 여부 확인 (이 저장소 워크플로에서 `index.html`을 복사함) |
| 흰 화면 / 자산 로드 실패 | 주소의 경로가 저장소 이름과 같은지 확인 (`/reporting-/`). CI에서는 `GITHUB_REPOSITORY`로 `base`가 자동 설정됩니다. |

로컬에서 Pages와 동일하게 빌드하려면:

```powershell
cd client
$env:GITHUB_PAGES='true'
$env:GITHUB_REPOSITORY='hazajous-code/reporting-'
npm run build
```

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
