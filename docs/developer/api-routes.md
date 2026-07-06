# API Routes

The application deliberately favours **Server Actions** over a REST API, so there
are only two real HTTP route handlers under `src/app/api/`.

## `POST /api/upload`

Handles file uploads (appeal proof images/documents). Implemented in
`src/app/api/upload/route.ts`.

**Request:** `multipart/form-data` with a `file` field.

**Authorization:** requires an authenticated session (any role); otherwise
returns `401`.

**Validation:**

| Rule | Detail |
|---|---|
| Allowed types | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` |
| Max size | 5 MB |
| Filename | Sanitised to alphanumerics, truncated to 30 chars, suffixed with a timestamp |

**Behaviour:** writes the file to `public/uploads/` (created if missing) and
returns JSON:

```json
{ "url": "/uploads/<safeName>_<timestamp>.<ext>", "filename": "..." }
```

**Errors:** `400` for missing/invalid/oversized files, `401` unauthenticated,
`500` on write failure.

## `/api/auth/[...nextauth]`

The NextAuth.js catch-all handler (`src/app/api/auth/[...nextauth]/route.ts`),
wired to the config in `src/lib/auth.ts`. It serves the standard NextAuth
endpoints — sign-in, sign-out, session, CSRF, and the JWT/callbacks pipeline
described in [Auth & Access Control](/architecture/auth). You generally don't
call these directly; the NextAuth client and `getServerSession()` do.

## Everything else is a Server Action

CRUD, scanning, appeals, imports, exports, and settings are all
[Server Actions](/developer/server-actions), not REST endpoints. This keeps
authorization co-located with each operation and avoids a parallel API surface to
secure.
