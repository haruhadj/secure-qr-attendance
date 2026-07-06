# Configuration

All configuration is done through environment variables in a `.env` file at the
project root. Use `.env.example` as your template.

::: danger Never commit secrets
`.env` is git-ignored (only `.env.example` is tracked). Do not commit real
credentials, and rotate `NEXTAUTH_SECRET` if it is ever exposed.
:::

## Required variables

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by Prisma. | `postgresql://user:pass@host:5432/attendance?sslmode=require` |
| `NEXTAUTH_SECRET` | Secret used by NextAuth to sign/encrypt JWTs. Must be a long random string. | *(see below)* |
| `NEXTAUTH_URL` | The app's base URL. | `http://localhost:3000` |

Generate a strong `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

## Optional variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL_UNPOOLED` | A non-pooled connection string, if your host distinguishes pooled vs. direct connections. |
| `RESEND_API_KEY` | API key for [Resend](https://resend.com), used by the email helper (`src/lib/email.ts`). |
| `RESEND_FROM_EMAIL` | The verified "from" address for outgoing email. |
| `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` | Individual Postgres parameters, as an alternative to a single URL for some tooling. |
| `POSTGRES_URL`, `POSTGRES_PRISMA_URL` | Vercel/Prisma template variables some deployment setups expect. |

::: info Email is optional
Recent versions replaced the self-service email password-reset flow with a
"contact your administrator" notice, so the app runs fine without `RESEND_*`
configured. Admins reset passwords directly from the Staff/Masterlist screens.
:::

## Minimal working `.env`

```ini
DATABASE_URL="postgresql://user:password@localhost:5432/attendance_db"
NEXTAUTH_SECRET="paste-a-long-random-string-here"
NEXTAUTH_URL="http://localhost:3000"
```

That's enough to run the whole system locally. Continue to
[Database Setup](/getting-started/database).
