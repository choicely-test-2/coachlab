# CoachLab TODO

## Completed
- [x] Team creation (UX + backend)
- [x] Team detail view
- [x] Basic scaffolding: Next.js + Tachyons + Prisma
- [x] Git workflow fix: GH_TOKEN in remote
- [x] Add TODO.md and open PR #3

## Roadmap (mirrors README.md)
- [x] Basic tactic board with draggable players
- [x] Season planner with calendar view
- [ ] Achievement system (streaks, badges)
- [ ] Team sharing and collaboration
- [ ] Export tactics as images/PDF
- [ ] Mobile app (React Native)
- [ ] Public tactic library

## In Progress
- [ ] Roadmap synchronization (ensuring TODO covers README items)

## Backlog (Detailed breakdown)

### Foundation
- [ ] Authentication (email + OAuth) — NextAuth.js setup
- [ ] User profiles and roles (coach, admin, viewer)
- [ ] Database schema refinement (tactics, sessions, achievements)
- [ ] PWA configuration (manifest, service worker) — mobile experience
- [ ] Environment/config for SQLite (dev) and Postgres (prod)

### Core Features
- [x] Tactic board — canvas/drag-drop, player positioning, formations
- [x] Season planner — calendar/schedule UI, match planning, lineup builder
- [ ] Session planning and logging — drills, objectives, outcomes
- [ ] Player development tracking — attributes, progress over time
- [ ] Export tactics as images/PDF

### Gamification Layer
- [ ] Points system — actions → points, rules table
- [ ] Achievements engine — badges, trophies, conditions
- [ ] Streak tracking — daily/weekly consistency rewards
- [ ] Leaderboards — opt-in, privacy-aware, monthly rankings
- [ ] Quest/challenge system — monthly challenges, completion rewards
- [ ] Notifications — push/in-app for streaks/new achievements

### Sharing & Community
- [ ] Sharing system — per-tactic privacy controls, team sharing
- [ ] Public tactic library — marketplace/browse, likes, comments
- [ ] Team collaboration — multi-coach editing, comments
- [ ] Community status — top contributors featured, peer recognition

### Monetization
- [ ] Free tier — basic planning, 100 shared tactics, limited achievements
- [ ] Pro plan ($9–15/mo) — advanced analytics, unlimited sharing, custom trophies, priority support
- [ ] Team plan — collaborative features, coach network, billing per seat

### Infrastructure
- [ ] Error monitoring — Sentry integration
- [ ] Analytics — usage tracking, cost insights
- [ ] Deployment pipeline — CI/CD (GitHub Actions, Vercel)
- [ ] Performance — image optimization, code splitting, caching
- [ ] Testing — unit/integration (Vitest + Testing Library)

### Future / Stretch
- [ ] Mobile app (React Native) — after web feature parity

## Polish / Review Follow-ups

Items identified during PR reviews that are minor but worth addressing later.

### Tactic Board (PR #5)
- [ ] Replace custom mouse drag with `dnd-kit` for robustness (if UX issues arise)
- [ ] Add unit/integration tests for API routes (tactics)
- [ ] Consider server component for tactics list (avoid client fetch)

### Season Planner (PR #7)
- [ ] Confirm deletion dialog explicitly mentions matches are also deleted
- [ ] Consider adding a "no matches" empty state illustration

### Achievements (PR #8)
- [ ] Batch DB queries in `checkAndAwardAchievements` for performance (avoid N+1)
- [ ] Expand `season_complete` to count seasons of teams where user is a member (not just owner)
- [ ] Expose `user.points` in session to show on dashboard
- [ ] Remove unused `totalPoints` variable from dashboard
- [ ] Achievements page: call Prisma directly instead of API (optional)
- [ ] Add rate limiting to `/api/me/activity` (future)
- [ ] Add tests for achievements engine (coverage)
- [ ] Ensure timezone handling in streak calculation is consistent (UTC)
