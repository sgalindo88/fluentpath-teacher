# FluentPath teacher site

The teacher portal and dashboard for [FluentPath](https://fluentpath.ca), served at **[teacher.fluentpath.ca](https://teacher.fluentpath.ca)** by GitHub Pages. English only (the teacher UI has no Spanish).

This repo holds **only the static teacher frontend**. The student app, the Google Apps Script backend (`apps-script.js`), the tests, the tooling and the full documentation live in the **`fluentpath`** repo (the canonical one). Read its README first for the architecture, the backend actions, the Google Sheets schema and the deploy runbook; release notes for both repos are in its `CHANGELOG.md` (see also this repo's `CHANGELOG.md`).

## What is here

```
fluentpath-teacher/
├── index.html                     # Teacher portal (login, inbox, student list, create account)
├── teacher.html                   # Redirect to the portal (old links, emailed links)
├── sw.js                          # GENERATED service worker (do not edit by hand)
├── manifest.webmanifest, CNAME, favicon.svg, apple-touch-icon.png, icon-*.png
└── src/
    ├── examiner-panel.html        # Teacher dashboard (one student at a time)
    ├── scripts/
    │   ├── teacher-portal.js      # Portal: login, account requests, feedback, archived students, create account
    │   ├── examiner-panel.js      # Dashboard logic (all panels)
    │   ├── config.js, api.js, utils.js, ui.js, icons.js,
    │   │   call-request.js, password-reset.js    # SHARED: copied from the student repo
    ├── styles/
    │   ├── teacher-portal.css, examiner-panel.css   # teacher only
    │   └── tokens.css, theme.css, components.css, mobile.css   # SHARED
    ├── fonts/, img/, icons/       # SHARED (Montserrat, logos, icon licence)
```

**Shared files are not edited here.** They are authored in the `fluentpath` repo and copied over with `npm run sync` (run there); `npm run sync:check` there fails if this repo drifts. That includes `sw.js`: its cache version is `TEACHER_CACHE_VERSION` in the student repo's `scripts/sync-shared.mjs`.

## Portal (`index.html`)

- **Login** (teacher accounts only), forgot password, back to the brochure.
- **Account requests** from the brochure: Create account (prefills the form) or Dismiss.
- **Student feedback** (bug reports and feature ideas): Mark done or Reopen; done items are collapsed.
- **Student list** (cards) and **Archived students** (Restore, Open).
- **Create student account:** name and email; the password is optional. The student is emailed a link (English and Spanish) to choose their own password. The portal says whether the email went.

## Dashboard (`src/examiner-panel.html?student=<name>`)

| Panel | What it does |
|---|---|
| Class Overview | Every student: level, days done, last active, ungraded lessons, attendance, status |
| Dashboard | Stats, progress, activity feed; notices for pending video-call requests and topic requests |
| Attendance | 20-day grid |
| Grade Placement Test | Loads the test, auto-scored chips, sliders for writing and speaking (with audio playback), CEFR level, saves to the sheet |
| Grade Lessons | Writing, Speaking (with recordings), All Responses, Final Score; saves to the sheet |
| Weekly Summaries | Four-week ratings and an AI-drafted narrative |
| Adjust Difficulty | Sliders, focus tags, custom AI instructions, and the student's **topic requests** as a table (waiting requests can be approved or declined; decided ones are listed with their decision) |
| Progress Tracker, Lesson Library | Lesson records and skills; the shared lesson pool by level and day |
| Student Profile | Name, email, level, month, notes, permissions (Spanish, skip test, retake, free course access), notifications, the video-call card, promotion to the next course, and the **Archive or delete this student** card |
| Settings (teacher) | Your name (shown to every student), the one email that receives ALL notifications, password |

State: the dashboard keeps the open student's working state in `localStorage` (`fluentpath_teacher`), but profile, permissions and teacher settings are read from the sheet each time, so they persist across devices.

## Archive and delete

- **Archive:** switches the student's login off, ends their sessions and hides them from every list. Nothing is erased. Restore from the dashboard or from the portal's "Archived students".
- **Delete permanently:** needs the student's name typed. Erases every row about them and moves their Drive recordings to the Drive trash. The daily spreadsheet backups and the Drive trash keep the data for a while (about 7 days and 30 days).

## Checks before a push

This repo has no package.json, linting or tests of its own. Its browser tests run from the `fluentpath` repo (`npm run test:ui`, `tests/ui/teacher.test.js`, which serves this repo when it sits next to the student repo). Before pushing, from the student repo: `npm run sync:check`, and from here: `node --check src/scripts/*.js sw.js` (a syntax error in a teacher script once broke the live dashboard).

## Deploying

GitHub Pages serves `main`. After a backend deploy (see the student README), fast-forward merge and `git push origin main`, wait about 10 minutes for caches, then hard refresh. Production pushes are done by the owner.
