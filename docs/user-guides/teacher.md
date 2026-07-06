# Teacher Guide

Teachers record attendance for the subjects they teach. After logging in you land
on your **roster** (`/teacher/roster`).

## Scanning QR codes

Go to **Scanner** (`/teacher/scanner`).

1. **Select the subject** you're taking attendance for. You can only pick
   subjects you teach.
2. **Point your camera** at a student's QR code. The scanner uses your device's
   rear camera.
3. On a successful scan, the student is marked **PRESENT** and you'll see a
   confirmation toast with their name and ID.

::: tip Practical scanning notes
- There's a short **cooldown** between scans to avoid accidentally recording the
  same code twice in a row.
- A student who is **already PRESENT** today for that subject is skipped with a
  friendly message — no duplicate is created.
- The camera only works over **HTTPS** or on **localhost** (a browser security
  requirement).
:::

### Why a scan might be rejected

| Message | Meaning |
|---|---|
| *Invalid QR code — student not found* | The code doesn't match any student (or was regenerated). |
| *You are not the teacher for …* | You selected/own a subject you don't teach. |
| *… is not enrolled in …* | The student isn't enrolled in the selected subject. |
| *… is already marked PRESENT today* | Already recorded — nothing to do. |

## Manual roster

Go to **Roster** (`/teacher/roster`) when scanning isn't possible. You can toggle
each student's status directly:

- **Present**, **Absent**, or **Late**, for the selected date and subject.

Every manual change is audited just like a scan.

::: warning Time-lock
You can only edit attendance within the **time-lock window** set by the admin
(default 24 hours). Older records are read-only for teachers — ask an admin to
make corrections beyond the window.
:::

## Reviewing appeals

Go to **Appeals** (`/teacher/appeals`) to see appeals from students enrolled in
your subjects. For each appeal you can **Approve** or **Reject** it.

- **Approving** an appeal automatically marks the student **PRESENT for today**
  (in one of their enrolled subjects).
- Once reviewed, an appeal can't be reviewed again.

See [Appeals Workflow](/features/appeals) for the full lifecycle.

## Exporting attendance

You can export a **date-range attendance report** as CSV for your own subjects
(the export action is scoped so teachers only see subjects they teach).
