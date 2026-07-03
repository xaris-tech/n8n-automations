# Weekly IR By Location Summary

## Description
Fires when a new row is added to the MASTERLIST sheet, reads all incident rows, groups incidents by location for the configured backfill window, clears the target summary range, then writes a grouped-by-location weekly summary to the WEEKLY IR BY LOCATION sheet using a Google Service Account.

## Source
- **Source Sheet**: `19A1DCQEEKa97NzcK8XBdsqk8LXC03jVMQSI0jHwfmFI` — reads range `MASTERLIST!A1:R`
- **Target Sheet**: `1uIpT3WTbjPNnyF4LkKuJ0dzbqynUnztwS9EF8MshehI` — writes to `WEEKLY IR BY LOCATION` tab
- **Auth**: Google Service Account (via Google API credential in n8n)

## Nodes

1. **Manual Run** — Manual trigger for testing
2. **Row Added Trigger** — Google Sheets Trigger (polls on `rowAdded` event) for the MASTERLIST sheet; fires whenever a new row is added
3. **Workflow Config** — Set node that defines all config values (spreadsheet IDs, date window, location/team sort order)
4. **Read Source Rows** — Google Sheets node that reads incident data from the source spreadsheet using structured output (one item per row with column headers as property names)
5. **Build Weekly Summary** — Code node (`runOnceForAllItems`) that:
   - Reconstructs a 2D array from the Google Sheets structured items via `$input.all()`
   - Parses raw sheet rows into structured incident objects
   - Filters by the configured date window
   - Normalizes event names, severity levels, and text
   - Sorts by location order → team order → event → timestamp
   - Groups incidents by location
   - Builds a formatted summary array (location header → preacher/worship leader row → table header → incident rows)
   - Handles empty results with a "NO INCIDENTS FOUND" fallback
6. **Clear Target Range** — HTTP POST to clear the target sheet range before writing
7. **Write Summary Range** — HTTP PUT to write the built summary values to the target sheet

## Current Configuration
- Backfill window: `2026-06-28` to `2026-07-02`
- Locations (in order): COG Marilag, COG Trece, COG Jabez, COG Silang
- Teams (in order): Audio, Broadcast, Stage Management, Arts, Tech, Maintenance, Light, Musician, Praise and Worship, Ushering, Housekeeping, Theatre
- Trigger: Google Sheets Trigger on `rowAdded` event for MASTERLIST (polls every minute by default)

## Credentials Required
All three Google-authenticated nodes need credentials assigned manually in the n8n UI:
- **Read Source Rows** — uses `googleApi` credential type, assign **"Google Service Account account"**
- **Clear Target Range** — uses `googleApi` credential type, assign **"Google Service Account account"**
- **Write Summary Range** — uses `googleApi` credential type, assign **"Google Service Account account"**
- **Row Added Trigger** — may need OAuth2 credential (Service Account not supported by trigger node type); configure in n8n UI

The Service Account key file is at `credentials/n8n-sa-portfolio.json`.

## Changes Made (2026-07-03)

### Fixed trigger sheetName parameter (RL object mode correction)
- ```expr("'MASTERLIST'")``` generated a broken `sheetName` with `mode: ""` and `value: "='MASTERLIST'"`
- The Google Sheets Trigger v1 doesn't support `mode: 'name'` — only `'list'`, `'url'`, or `'id'`
- Fixed by using RL object with `mode: 'id'` and `value: '0'` (gid `0` = first sheet, MASTERLIST)
- Validated clean (no warnings) and pushed to n8n

### Swapped Scheduled Sync to Google Sheets Row Added Trigger
- Replaced `Scheduled Sync` (schedule trigger, every 1 minute) with `Row Added Trigger` (Google Sheets Trigger, `event: rowAdded`)
- Configures `documentId` and `sheetName` for the MASTERLIST sheet
- Uses `specifyRangeA1` with range `A:R`, unformatted values with formatted dates
- Trigger has no credential pre-assigned (the Google Sheets Trigger supports OAuth2 only; configure manually)

### Swapped Read Source Rows from HTTP Request to Google Sheets dedicated node
- Changed `Read Source Rows` from HTTP GET to Google Sheets (read) node
- Uses `documentId` from Workflow Config via expression
- Configured with `rangeDefinition: specifyRangeA1`, range `A1:R`, unformatted values with formatted dates

### Changed Build Weekly Summary to runOnceForAllItems
- Changed from `runOnceForEachItem` (one item at a time, expecting `$json.values`) to `runOnceForAllItems`
- Now reconstructs the 2D array from `$input.all()` using the first item's keys as column headers
- Processing logic (filtering, normalization, sorting, grouping, output building) unchanged

### SDK security sandbox fixes
- Moved `jsCode` from array+`.join(NL)` to template literal to pass SDK validator
- Changed top-level `NL` from `String.fromCharCode(10)` to `'\n'` to avoid security violation

## Fixed Bug (2026-07-02)
The Code node's `jsCode` had incorrect escape sequences: `\n`, `\s`, and `\b` were being stored as literal control characters instead of escape sequences, causing a `SyntaxError: Invalid or unexpected token`. Fixed by:
- Using `\\n` (double-escaped) for newlines in output strings
- Replacing `\s+` regex with `[ \t]+` character class
- Replacing `\b` word boundary with `(?<!\w)` / `(?!\w)` lookarounds

## Files
- `weekly-ir-by-location-summary.workflow.json` — Importable n8n workflow JSON
- `weekly-ir-by-location-summary.js` — n8n Workflow SDK source (for development/version control)
