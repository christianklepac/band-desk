# Bronco Forte Desk

A personal band-admin tool, installable as a phone app (PWA). It shows one band task for the
day, what is due in the next seven days, and who is owed a reply, and it captures new entries.

## How it fits together

- **Tracker:** the `Entries` tab of the Bronco Forte Tracker Google Sheet. The app reads columns
  A to M and writes status, closed date, deadline and new rows. Column M (`Days left`) is a
  formula in the sheet; the app never writes to it.
- **On the device:** the last copy of the tracker, entries set aside with "Not today" (for that
  day only), and any changes made while signed out or offline. Those upload on the next sync.
- **Sign-in:** Google OAuth with the `spreadsheets` scope, by full-page redirect, using the same
  web client as Practice Console. The client ID in `index.html` is public by design. Access
  tokens last about an hour, so the app shows **Connect** when it needs a fresh one.
- **Daily brief:** a separate scheduled task reads the same sheet each morning. It does not
  depend on this app.

## Files

- `index.html`: the whole app (markup, styles, script)
- `sw.js`: service worker, network-first with a cached copy when offline
- `manifest.webmanifest`, `icons/`: install metadata

Hosted with GitHub Pages from the `main` branch root.
