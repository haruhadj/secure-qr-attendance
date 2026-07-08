# Operator Runbook

A plain-language checklist for the person who runs the attendance system day to day. No coding required.

## Everyday

- **Teachers** take attendance by opening **Scanner**, choosing the subject, and scanning each student's QR code. Present/Late is decided automatically from the class start time.
- **Students** show their QR code (from their dashboard or a printed ID card) to be scanned.
- Attendance can always be corrected by hand from the teacher **Roster** or the admin **Masterlist**.

## Start of a new school year

1. Sign in as an administrator → **Dashboard** → **School Year / Term** card.
2. Type the new year's name (e.g. `AY 2026-2027`) and click **Start & activate**.
3. Go to **Masterlist → Import CSV** and upload this year's student list.
   - Past years are kept — nothing is deleted. You can switch back to view any previous year from the same card.

## Adding people

- **A teacher:** Admin → **Staff** → add. They get a temporary password and must change it at first login.
- **A student:** Admin → **Masterlist** → add (or bulk import a CSV). Their first password is their Student ID; they must change it at first login.

## Passwords

- Everyone is forced to set their own password the first time they sign in.
- Forgot a password? Use **Forgot password** on the sign-in page (needs email set up), or an admin can set a temporary one from **Staff** / **Masterlist**.

## Backups (important)

- **Automatic:** a full backup is saved every week automatically.
- **Manual:** Admin → **Dashboard → Data Management → Export Backup (.json)**. Keep a copy somewhere safe.
- **Restore:** Data Management → **Restore Backup (.json)**. A safety backup is also downloaded automatically before any data reset.
- The database host (Neon) also keeps its own automatic backups you can restore from its console.

## Is the system healthy?

- The admin dashboard shows a **green “System healthy”** dot when everything is reachable; red means there's a problem — see Troubleshooting.
- For proactive alerts, point a free uptime monitor at `https://your-site/api/health`.

## Printing QR ID cards

- Admin → **Masterlist** → open a student to download their QR card, or use **bulk download** for a whole section.
