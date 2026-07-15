# Raspberry Pi attendance scheduler

Use an always-on Raspberry Pi to call the protected automatic-absence endpoint
every five minutes while the application remains hosted on Vercel Hobby.

## Configure the host

The Pi needs `curl`, systemd, working internet access, and synchronized system
time. The application still performs all timezone and attendance calculations;
the Pi holds no database credentials.

Create `/etc/secure-qr-attendance/auto-absent.env` as root:

```ini
APP_URL=https://your-production-domain.example
CRON_SECRET=the-same-secret-configured-in-vercel
```

Do not add quotes, trailing slashes, or spaces around `=`. Protect the file with
mode `0600`.

Copy the units from `ops/systemd/` to `/etc/systemd/system/`, then enable them:

```sh
sudo install -d -m 0700 /etc/secure-qr-attendance
sudo install -m 0644 ops/systemd/secure-qr-auto-absent.service /etc/systemd/system/
sudo install -m 0644 ops/systemd/secure-qr-auto-absent.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now secure-qr-auto-absent.timer
```

## Verify and operate

Run one sweep immediately and inspect its response and logs:

```sh
sudo systemctl start secure-qr-auto-absent.service
sudo systemctl status secure-qr-auto-absent.service
sudo journalctl -u secure-qr-auto-absent.service -n 20 --no-pager
systemctl list-timers secure-qr-auto-absent.timer
```

A successful call logs a JSON response with `"status":"ok"`. A `401` means
the Pi and Vercel `CRON_SECRET` values differ. Other HTTP failures are retried
three times and remain visible in the system journal. The sweep is idempotent,
so retrying or manually starting the service does not overwrite existing
attendance records.
