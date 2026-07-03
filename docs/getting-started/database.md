# Database Setup

The system uses **PostgreSQL** through **Prisma ORM**. The schema lives at
`prisma/schema.prisma` and the seed script at `prisma/seed.ts`.

## Create the schema

With `DATABASE_URL` set, push the Prisma schema to your database:

```bash
pnpm db:push
```

`prisma db push` creates all tables (`User`, `Student`, `Teacher`, `Section`,
`Subject`, `Attendance`, and so on) to match the schema without generating a
migration history. It's ideal for development and initial setup.

::: tip Regenerating the Prisma client
The Prisma client is regenerated automatically on `pnpm install` (via
`postinstall`). To regenerate it manually after schema changes, run
`pnpm exec prisma generate`.
:::

## Seed demo data

```bash
pnpm db:seed
```

This runs `tsx prisma/seed.ts` and **upserts** the following demo records
(re-running it will not create duplicates, and it does not delete anything):

| Entity | What's created |
|---|---|
| **Admin** | `admin@school.com` — *System Administrator* |
| **Teacher** | `teacher@school.com` — *Prof. Michael Fernandez* |
| **Section** | *BSCS 3rd Year* (advised by the seeded teacher) |
| **Subjects** | `OS101` Operating Systems, `SE102` Software Engineering, `DB103` Database Management — all taught by the seeded teacher |
| **Students** | 5 students `2022-0001` … `2022-0005`, each enrolled in all 3 subjects, each with a generated `qrToken` |

The default passwords assigned by the seed are listed under
[Default Accounts](/getting-started/running#default-accounts).

## Backups and recovery

Before a large import or a data reset, take a database snapshot with the
standard PostgreSQL tools:

```bash
# Backup
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql

# Restore
psql "$DATABASE_URL" < backup_20260101.sql
```

The app also offers an in-browser **JSON backup export** from the admin
dashboard — see [Data Management](/features/data-management).

## Inspecting the database

Prisma ships with a visual data browser:

```bash
pnpm exec prisma studio
```

Continue to [Running the App](/getting-started/running).
