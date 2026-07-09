# No Show Sync

## Purpose
Reads the `Attendance` tab from the source spreadsheet, extracts every real no-show name found in source columns `P:R`, then appends new rows into the target `2026` tab.

This workflow fills only the fields the user requested:
- `DATE`
- `SLOT`
- `NAME`
- `FLOOR DIRECTOR`
- `TECHNICAL DIRECTOR`

Target columns `A:B` are left blank on append because the current source columns do not expose a reliable `QUARTER` or `DUTY LOCATION` field.

## Source
- Spreadsheet ID: `141eVqlrhYY8vCJCmVRmhWewswWi2F4MoAG1NNu0gUj4`
- Tab: `Attendance`
- User-provided gid: `1067041877`
- Source columns used:
  - `B`: `Production name`
  - `C`: `Date`
  - `D`: `Production Director`
  - `F`: `Floor Director`
  - `P:Q:R`: three repeated `No Show` columns

## Target
- Spreadsheet ID: `1EI_JuouZEBsnXo7M0zddsp9g26vfWzCxC8GEUyDH_rw`
- Tab: `2026`
- Header row: `3`
- First data row: `4`
- Target columns written:
  - `A`: blank
  - `B`: blank
  - `C`: `DATE`
  - `D`: `SLOT`
  - `E`: `NAME`
  - `F`: `FLOOR DIRECTOR`
  - `G`: `TECHNICAL DIRECTOR`

## Mapping Rules
- Every non-empty, non-`N/A` value in source `P`, `Q`, or `R` becomes its own target row.
- Target `TECHNICAL DIRECTOR` is populated from source `Production Director` (`D`) because that is what the user explicitly asked to extract.
- Slot normalization:
  - `Production Sunday (MAIN SLOT)` -> `Mainslot`
  - `Production Sunday (MID SLOT)` -> `Midslot`
  - `Revival Night/TWS` -> `TWS`
  - `Empowered Night` -> `Enight`
  - anything else falls back to cleaned `Production name`
- Date normalization:
  - source date is converted to display like `Jan 11`, `March 7`, `June 21`

## Important Source Caveat
The source header row contains three identical `No Show` column names. Because structured Google Sheets reads can collapse duplicate headers, this workflow reads the source with a raw Google Sheets API HTTP request instead of the regular structured Sheets read node.

## De-duplication
Before append, workflow reads current target rows and skips any row already present by this key:

`DATE | SLOT | NAME | FLOOR DIRECTOR | TECHNICAL DIRECTOR`

This keeps reruns safe for backfills.

## Credentials Required
The workflow uses the local n8n `Google Service Account account` credential:

`n8n-portfolio@operating-bolt-453212-b6.iam.gserviceaccount.com`

Both source and target spreadsheets must be shared with that service-account email. Current live check:
- Source spreadsheet is accessible.
- Target spreadsheet `1EI_JuouZEBsnXo7M0zddsp9g26vfWzCxC8GEUyDH_rw` returns `403 Forbidden`, so the workflow cannot read existing target rows or append until the target sheet is shared.

## Files
- `no-show-sync.workflow.json` - importable n8n workflow JSON
- `build-new-no-show-rows.js` - source-controlled JavaScript embedded in the n8n Code node
- `google-sheets-menu.gs` - Apps Script menu handler for the target Google Sheet

## Validation Notes
- Source live inspection confirmed `Attendance` tab for gid `1067041877`.
- Target live inspection confirmed `2026` tab headers in row `3`.
- Local n8n import succeeded as workflow id `NoShowSync01`.
- Live run reaches `Read Existing Target Rows`, then fails with `Forbidden - perhaps check your credentials?` because the target spreadsheet is not shared with the service account.

## Sheet Interface
The target spreadsheet has an `Automation` tab with:
- `B3`: `Fill What?`
- `B4`: `Month`
- `B5`: `Year`
- `B6`: webhook URL
- `B7`: last run status

The n8n workflow has a `Run From Sheet` webhook at `/webhook/no-show-sync`.

Important: Google Apps Script cannot call a local-only `http://localhost:5678` webhook because Apps Script runs on Google infrastructure. For a real sheet add-on/menu button, put a public n8n webhook URL in `Automation!B6`, such as n8n Cloud or an HTTPS tunnel to the local n8n instance.
