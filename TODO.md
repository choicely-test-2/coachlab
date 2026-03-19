# CoachLab TODO

## Completed
- [x] Team creation (UX + backend)
- [x] Team detail view
- [x] Basic scaffolding: Next.js + Tachyons + Prisma
- [x] Git workflow fix: GH_TOKEN in remote
- [x] Add TODO.md and open PR #3

## Roadmap (mirrors README.md)
- [ ] Basic tactic board with draggable players
- [ ] Season planner with calendar view
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
- [ ] Tactic board — canvas/drag-drop, player positioning, formations
- [ ] Season planner — calendar/schedule UI, match planning, lineup builder
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
