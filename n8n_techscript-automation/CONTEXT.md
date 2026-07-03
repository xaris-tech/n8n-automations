# Techscript Automation

## Purpose
Creates Techscript lyric rows for Production Directors from only:
- a Voice Arrangement (VA) Google Sheets link
- the full lyrics text

The workflow parses the VA sheet for section-to-WHO assignments, parses lyrics into ordered song sections, then writes `SEQ`, `PRODUCTION`, and `WHO` into the Techscript format.

## Target Techscript Format
- Spreadsheet: `1nNk3LAOXbkqWm2d8352qPQ3awp1cLH6-j2IKrOKpLVA`
- Example tab: `07/05/2026`
- Header row: row `4`
- Write area starts at row `9`
- Columns written:
  - `B`: `SEQ`
  - `C`: `PRODUCTION`
  - `D`: `WHO`

The workflow writes only columns `B:D` so existing Techscript columns for time, staging, visuals, lights, and audio are preserved.

## Inputs
The Webhook or Manual Test node should provide:
- `vaLink`: Google Sheets link for the Voice Arrangement
- `lyricsText`: all lyrics pasted as plain text
- `targetSheetName` optional, defaults to `07/05/2026`
- `startRow` optional, defaults to `9`

## Expected Lyrics Text Format
Use clear section labels when possible:

```text
Heaven & Earth - COG Worship (D)

INTRO:
Tara!
Na na na na

VERSE 1:
Heto na ang hinihintay
Na maranasan Kang tunay

CHORUS:
God of all heaven and earth
You have been with me through it all
```

Song titles are detected as lines that do not end in `:` and are followed by section labels. Section labels like `INTRO:`, `VERSE 1:`, `PRE-CHORUS:`, `CHORUS:`, `BRIDGE:`, `TAG:`, `OUTRO`, `INSTRUMENTAL`, and `INTERLUDE` become Techscript production rows.

## WHO Mapping
The workflow reads the VA sheet and tries to infer `WHO` from rows that mention a known section label plus singer direction.

Examples it can map:
- `VERSE 1 | SOLO WL`
- `CHORUS | UNISON`
- `BRIDGE | SATB`
- `INTRO - SOLO W2`

If no VA match is found for a lyrics section, `WHO` is left blank for the PD to review.

## Credentials Required
HTTP Request nodes need a Google API credential attached in n8n:
- `Read VA Metadata`
- `Read VA Values`
- `Clear Techscript Rows`
- `Write Techscript Rows`

Use the existing Google Service Account credential if the VA sheet and Techscript sheet are shared with that service account.

## Files
- `techscript-automation.workflow.json` - importable n8n workflow JSON
- `techscript-parser-test.mjs` - local parser smoke test
- `sample-input.json` - sample manual payload

