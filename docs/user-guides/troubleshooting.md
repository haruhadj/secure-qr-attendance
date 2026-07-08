# Troubleshooting

Common problems and how to fix them without a developer. Work top to bottom.

## The app won't load / shows an error page

1. Refresh the page, then try again in a private/incognito window.
2. Open `https://your-site/api/health`:
   - `{"status":"ok"}` → the app and database are fine; the issue is likely your device or network.
   - `503` / no response → the database or hosting is down. Check the Vercel and Neon dashboards for outages; the database may have been paused for inactivity (open the Neon console to resume it).
3. If a specific page crashed, the error screen has a **Try again** button and a link back to sign-in.

## The scanner camera won't open

- The camera only works over **HTTPS** (your live site) or on `localhost`. It will not work over a plain IP address.
- Allow camera permission when the browser asks. If you denied it, re-enable it in the browser's site settings and reload.
- Make sure no other app is already using the camera. On phones, use the rear camera.

## Password reset emails aren't arriving

- Email needs to be configured (Resend API key + verified sender). If it isn't, the site says *“Email service is not configured.”*
- Meanwhile, an administrator can set a temporary password from **Staff** (teachers/admins) or **Masterlist** (students).
- Check spam folders; confirm the account actually has an email address saved.

## A student can't sign in

- Their first password is their **Student ID** (unless it was reset). They must change it at first login.
- If they were imported without an email, they sign in with the **username** shown on their record, not an email.
- Still stuck? Admin → **Masterlist** → open the student → **Reset password**.

## Attendance looks wrong / from the wrong year

- Check the **active School Year/Term** on the admin dashboard — attendance and class lists are scoped to it. Switch terms to view a previous year.

## How do I restore a backup?

- Admin → **Dashboard → Data Management → Restore Backup (.json)** and choose your backup file.
- Recreated accounts come back with their default password and must change it at next login.
- For a full database-level restore, use the point-in-time restore in the Neon console.

## Nothing here helped

- Take a screenshot of the error and note what you were doing.
- Check the **Vercel** (hosting) and **Neon** (database) dashboards for service status and logs.
