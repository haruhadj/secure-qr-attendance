# Tech Stack

The versions below reflect what is actually pinned in `package.json` (some older
docs in the repo referenced earlier versions).

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | Next.js `^16.2.4` | App Router (not Pages Router). |
| **Language** | TypeScript `~5.8` | `tsconfig.json` currently sets `"strict": false`. |
| **UI runtime** | React `^19` + React DOM `^19` | Server and Client Components. |
| **Database** | PostgreSQL | Accessed only through Prisma. |
| **ORM** | Prisma `^6.19` (`@prisma/client`) | Schema at `prisma/schema.prisma`. |
| **Auth** | NextAuth.js v4 (`^4.24`) | Credentials provider, JWT strategy, Prisma adapter. |
| **Password hashing** | bcryptjs `^3.0` | Cost factor 10. |
| **QR scanning** | `html5-qrcode` `^2.3` | Camera-based, rear camera. |
| **QR generation** | `qrcode.react` `^4.2` | Renders the student's `qrToken`. |
| **Styling** | Tailwind CSS v4 + Shadcn/UI | Primitives in `src/components/ui/`. |
| **Icons** | `lucide-react` | |
| **Animation** | Framer Motion (`motion` / `framer-motion`) | Login shake, transitions. |
| **Toasts** | `sonner` | `toast.success()` / `toast.error()`. |
| **Theme** | `next-themes` | Dark/light toggle (dark default). |
| **Progress bar** | `next-nprogress-bar` | Top navigation progress. |
| **Dates** | `date-fns` + custom `src/lib/date.ts` | UTC normalisation helpers. |
| **Email** | `resend` `^6.12` | Optional; used by `src/lib/email.ts`. |
| **Font** | Geist (`@fontsource-variable/geist`) | |
| **Package manager** | pnpm | Lockfile committed. |

## Notable design constraints

- **PostgreSQL-only, no Firebase.** All data and authentication are backed by
  PostgreSQL through Prisma. There is no external BaaS.
- **`@prisma/client` is treated as an external server package** in
  `next.config.ts`, so it is not bundled into the client.
- **Server Actions are the primary API surface.** The app deliberately avoids a
  large REST layer; mutations are server actions with inline authorization.

## Documentation tooling

This documentation site is built with **VitePress** (`docs/`), with Mermaid
diagrams provided by `vitepress-plugin-mermaid`. It is independent of the Next.js
app build and has its own `docs:*` scripts.
