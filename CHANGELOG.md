# Changelog: teacher site

The teacher site is released together with the student site and the backend, and the version numbers are the **backend** versions. The complete notes for each release (backend, student app and teacher site) are in the `fluentpath` repo's `CHANGELOG.md`; this file lists what changed **here**.

## [0.57.0] - 2026-10-13
- **Archive and delete a student** (Student Profile, "Archive or delete this student"). Archive and Restore with progress messages; Delete permanently needs the typed name. The portal lists "Archived students" with Restore and Open. Fixes after device testing: space above the archive card, all three buttons switch off while working, the pressed one says "Archiving…", "Restoring…" or "Deleting…", a spinner status line, and a clear message before returning to the portal.
- Shared fixes: header buttons have room above and below; the password dialogs (set, forgot, change, "Password updated") have proper spacing.

## [0.56.0] - 2026-10-13
- **Create account:** the password is optional (leave it empty); the student is emailed a link to choose their own password. The portal says whether the email was sent and what to do if not.

## [0.55.0] - 2026-10-13
- **Portal inbox:** "Account requests" from the brochure (Create account prefills the form, Dismiss) and "Student feedback" (Mark done, Reopen, collapsed Done list).
- **Fixed:** a declined topic request offered Approve again. Adjust Difficulty now shows a table of requests with their decisions; only a waiting request has Approve and Decline.

## [0.54.0] - 2026-10-13
- **Topic requests:** a "Topic requests waiting for you" notice on the dashboard (review opens Adjust Difficulty) and a card with Approve and Decline. Approved topics only steer future lessons.

## [0.53.0] - 2026-10-13
- **Teacher Settings** page: your name, the one notification email used for ALL notifications, password.
- **Student Profile loads from the sheet**, so course permissions persist across devices; the Teacher card and the "(required)" label are gone (the email shows `*`).
- "Mark as Done" on a video call shows progress and result; the pending-call link opens the student's Video Call card.

## [0.51.0] - 2026-10-13
- Placement test and lesson scores are plain numbers; writing and speaking show "Pending" until graded.
- **Send Link** emails the call link to the student and reports it; the "Ungraded" badge updates after Save to sheet; the attendance "today" marker is more visible.

## [0.50.0] - 2026-10-13
- **Visual rebuild (Phases B and C):** design tokens and self-hosted Montserrat, Material Symbols icons instead of emoji, a navy left rail with an off-canvas menu under 768px, in-page confirmations and toasts instead of `confirm()` and `alert()`, answer chips with icon and word, status lines with an icon, a restyled portal. English only (`data-english-only`); the dead approval-queue code was removed.
- A new student appears in the student list as soon as the account is created.
- The login page no longer reloads in a loop on "Unauthorized"; the portal links back to the brochure.

## [0.49.0] to [0.47.0] - 2026-10-12
- Recordings of placement-test speaking play in the grading panel; the panel tolerates answers truncated in old rows and shows a notice for new ones (DATA-5); recording ids read from the sheet are validated before they reach the page (N-2); every teacher write now reports a failure instead of looking saved (N-5). A syntax error in an early version of this release broke the live dashboard for a few hours; it was fixed in the next deploy.

## [0.46.0] - 2026-09-11 and earlier
- The teacher site was split into its own repo (June 2026) and moved to `teacher.fluentpath.ca`. Teacher login uses a session (no public token), the portal can create student accounts, and teachers can reset their password by email.
