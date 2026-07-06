# Installation

This guide gets the application running on your machine for development.

## Prerequisites

| Requirement | Notes |
|---|---|
| **Node.js 20+** | The app targets modern Node and Next.js 16. |
| **pnpm** | The project's package manager (a `pnpm-lock.yaml` is committed). Install with `npm install -g pnpm`. |
| **PostgreSQL** | A reachable PostgreSQL database (local install, Docker, or a hosted provider such as Neon/Supabase). |

::: tip Camera access
QR **scanning** requires a camera and a *secure context*. Browsers only expose
the camera on `https://` or on `http://localhost`. On `localhost` during
development this works out of the box; on a LAN IP you will need HTTPS.
:::

## Steps

**1. Clone and enter the project**

```bash
git clone https://github.com/haruhadj/secure-qr-attendance.git
cd secure-qr-attendance
```

**2. Install dependencies**

```bash
pnpm install
```

`postinstall` automatically runs `prisma generate` to build the Prisma client.

**3. Configure environment variables**

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

See [Configuration](/getting-started/configuration) for the full list of
variables and how to generate `NEXTAUTH_SECRET`.

**4. Set up the database**

```bash
pnpm db:push   # create the tables from prisma/schema.prisma
pnpm db:seed   # (optional) load demo accounts and sample data
```

Details and the seed contents are covered in
[Database Setup](/getting-started/database).

**5. Start the dev server**

```bash
pnpm dev
```

Open <http://localhost:3000> and log in with one of the
[demo accounts](/getting-started/running#default-accounts).

## Next steps

- [Configuration](/getting-started/configuration) — every environment variable explained.
- [Running the App](/getting-started/running) — scripts and default accounts.
- [Architecture Overview](/architecture/overview) — how the app is structured.
