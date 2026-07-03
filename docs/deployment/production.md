# Production Build

Deploying the **application** (not the docs — those are covered on the next page).

## Build & run

```bash
pnpm install
pnpm build      # next build
pnpm start      # serves the production build on port 3000
```

Before first start in a new environment, apply the schema and (optionally) seed:

```bash
pnpm db:push
pnpm db:seed    # optional demo data
```

## Environment variables

Set these in your host's environment (never commit them):

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | Production PostgreSQL connection string. |
| `NEXTAUTH_SECRET` | ✅ | Long random string (`openssl rand -base64 32`). |
| `NEXTAUTH_URL` | ✅ | Your public URL, e.g. `https://attendance.example.edu`. |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | optional | Only if email features are used. |

See [Configuration](/getting-started/configuration) for the full list.

## Hosting notes

- **Vercel** is the most natural fit for Next.js (the repo includes Vercel/Prisma
  template env variables). Point it at a managed PostgreSQL provider (Neon,
  Supabase, RDS, etc.).
- **HTTPS is required** for QR scanning in the browser, so a production TLS
  certificate isn't optional — it's needed for the core feature to work off
  `localhost`.
- `@prisma/client` is configured as an external server package in
  `next.config.ts`; ensure `prisma generate` runs during the build (it runs via
  `postinstall`).

## Pre-launch checklist

- [ ] Strong, unique `NEXTAUTH_SECRET` set
- [ ] `NEXTAUTH_URL` matches the real domain
- [ ] Database reachable; schema applied (`db:push` or migrations)
- [ ] HTTPS enabled and verified
- [ ] Default seed passwords changed (or seed not run in production)
- [ ] A backup/restore procedure in place (see [Database Setup](/getting-started/database#backups-and-recovery))
- [ ] Consider replacing the in-memory login rate limiter for multi-instance
      deployments (see [Limitations](/thesis/limitations))
