# CoachLab

A modern platform for football coaches to organize strategies, share them, and plan seasons.

## Features (in progress)

- Authentication (Google & email/password)
- Tactic board (drag-and-drop players)
- Season planning (matches, lineup)
- Achievements & gamification
- Team collaboration

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tachyons CSS
- Prisma ORM (SQLite for dev, Postgres for production)
- NextAuth.js
- Vercel-ready

## Getting Started

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in required secrets.
3. Install dependencies:

```bash
pnpm install
```

4. Push Prisma schema and seed the database:

```bash
pnpm dlx prisma generate
pnpm db:push
pnpm db:seed
```

5. Run the development server:

```bash
pnpm dev
```

Open http://localhost:3000 in your browser.

## Scripts

- `pnpm dev` — start Next.js dev server
- `pnpm build` — production build
- `pnpm start` — start production server
- `pnpm db:push` — push Prisma schema to database
- `pnpm db:seed` — seed demo data

## Roadmap

- [x] Basic tactic board with draggable players
- [x] Season planner with calendar view
- [ ] Achievement system (streaks, badges)
- [ ] Team sharing and collaboration
- [ ] Export tactics as images/PDF
- [ ] Mobile app (React Native)
- [ ] Public tactic library

## License

MIT
