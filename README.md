# Bronco Forte Desk

A personal band-admin tool, installable as a phone app (PWA). It shows one band task for the
day, what is due in the next seven days, and who is owed a reply, and it captures new entries.
The Directory tab lists the band's resources: venues, studios, bands, people, vendors and so on.

## How it fits together

- **Tracker:** the `Entries` tab of the Bronco Forte Tracker Google Sheet. The app reads columns
  A to N and writes status, closed date, deadline and new rows. Column M (`Days left`) is a
  formula in the sheet; the app never writes to it. Column N (`Links`) holds resource IDs.
- **Directory:** the `Resources` tab (A to P, one row per R-### resource), read-only in the app
  for now. Entries take their city and state from the resources they link to.
- **Tags:** the `Tags` tab (Tag, Description, Added, Parent, Kind, Related). Parent rolls a tag
  up into a broader one; Kind groups tags, and Kind `project` marks a project.
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
