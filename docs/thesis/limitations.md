# Limitations & Future Work

An honest account of the system's boundaries — valuable for the thesis and for
anyone extending the project.

## Known limitations

### 1. QR tokens are static and unsigned
The QR code encodes a plain UUID. It is not signed, encrypted, or time-limited, so
a copied/screenshotted code keeps working until an admin regenerates it. Security
relies on **server-side validation** and **manual scanning of the right person**,
not on the token format. (See [QR Token Design](/security/qr-tokens).)

### 2. Login rate limiting is in-memory
The limiter is a process-local `Map`. It resets on restart and is **not shared
across instances**, so it offers weak protection in a horizontally-scaled
deployment.

### 3. No offline mode
Scanning requires connectivity because validation happens on the server. A dropped
connection means attendance can't be captured until it returns (manual entry can
backfill later, within the time-lock).

### 4. Approved appeals mark a single subject
Approving an appeal marks the student PRESENT for **today** in the *first* subject
they're enrolled in, not necessarily the specific class the appeal concerned.

### 5. No automated test suite
Verification is currently manual/scenario-based (see [Testing](/thesis/testing)).

### 6. Web-only, camera-dependent
It's a responsive web app, not a native app, and the scanner needs a working
camera and a secure context (HTTPS/localhost).

### 7. Local file storage for uploads
Appeal proof files are written to `public/uploads/` on the server's filesystem,
which doesn't suit ephemeral or multi-instance hosting without shared/object
storage.

### 8. Documentation drift in the repo
Some in-repo notes referenced older versions or an earlier CSV layout. This site
documents the **current** code; the authoritative CSV format is the one in
[Masterlist CSV Import](/features/masterlist-import).

## Future work

| Area | Improvement |
|---|---|
| **QR security** | Signed and/or rotating tokens (e.g. short-lived signed codes refreshed by the student's device) to defeat screenshot reuse. |
| **Scalability** | Move rate limiting and any shared state to Redis; use object storage for uploads. |
| **Appeals** | Let the student (and reviewer) target a specific subject/date, and surface attached proof images in the review UI. |
| **Testing** | Add unit, integration, and end-to-end tests (Playwright). |
| **Reporting** | Richer analytics — per-student/section trends, exportable dashboards. |
| **Notifications** | Notify students/guardians of absences (email/SMS/push). |
| **Offline capture** | Queue scans locally and sync when back online. |
| **Accessibility & i18n** | Formal a11y audit and multi-language support. |

These directions build directly on the current architecture without requiring a
rewrite.
