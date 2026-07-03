# Lead Intake Easy Setup Design

## Goal

Create a portfolio-friendly n8n workflow for lead intake scoring that uses native Google Sheets nodes and feels easy for a non-technical user to set up. The workflow should avoid JWT and service-account complexity in the visible setup path.

## User Outcome

A user should be able to open the workflow, connect their Google account with a normal Google sign-in flow, point the workflow at a `Leads` sheet, and run it without understanding APIs, bearer tokens, PEM keys, or Google Cloud setup.

## Recommended Approach

Use the native Google Sheets nodes with a reusable Google OAuth credential in n8n. Optimize the workflow canvas and description so the only required setup action is clicking `Connect with Google`, selecting the sheet, and running the workflow.

This is preferred over the JWT/API workaround because it is more familiar, easier to trust, easier to explain in a portfolio, and less fragile in a live demo.

## Workflow Shape

The portfolio-facing workflow should use this structure:

1. `Manual Trigger`
2. `Google Sheets Trigger` (disabled by default or clearly marked optional)
3. `Normalize Lead Data`
4. `Score Lead`
5. `Update Row in Google Sheets`

The `Manual Trigger` exists for easy first-run testing and demos. The `Google Sheets Trigger` exists as the upgrade path for real automation once the user is comfortable and the credential is connected.

## Data Model

The target sheet is expected to use a `Leads` tab with these columns:

- `name`
- `email`
- `company`
- `source`
- `budget`
- `interest`
- `notes`
- `score`
- `tier`

The scoring logic remains simple and adjustable:

- budget contributes the largest score weight
- referral/linkedin/website sources contribute source weight
- automation/AI/consulting interest contributes interest weight
- total score maps to `hot`, `warm`, or `cold`

## Setup Experience

The workflow should be designed so the user experience reads like:

1. Open the Google Sheets nodes.
2. Click `Connect with Google`.
3. Sign in with your Google account.
4. Select the spreadsheet and the `Leads` tab.
5. Run the workflow once with `Manual Trigger`.
6. Optionally enable the live trigger later.

The setup should not ask the user to create a Google Cloud project, generate keys, or understand credentials beyond ordinary Google sign-in.

## Canvas Design

The workflow canvas should include plain-English guidance:

- sticky note: `Start Here`
- sticky note: `What This Workflow Does`
- sticky note: `Optional: Turn On Live Trigger`

The workflow title should be user-friendly, such as:

- `Lead Intake Scoring (Easy Setup)`

The workflow description should repeat the short setup instructions in a way that matches what the user sees on the canvas.

## Credential Strategy

Use a normal Google OAuth credential attached to the Google Sheets nodes.

Important constraint:

- Google authorization cannot be fully automated away in a safe and user-friendly way
- the final Google sign-in and consent step is still required

The design goal is not zero auth steps. The goal is one familiar auth step instead of a technical setup flow.

## Portfolio Positioning

This workflow should present well in a portfolio because it shows:

- business automation
- structured lead scoring logic
- Google Sheets integration
- a realistic path from manual demo to live automation

The easy-setup version should be the public-facing or demo-facing workflow. The JWT/API version can remain an advanced internal variant if needed, but it should not be the main portfolio workflow.

## Error Handling

The workflow should fail in understandable ways:

- if Google is not connected, the node should clearly prompt for connection
- if the sheet or tab is wrong, the error should point to spreadsheet selection rather than auth internals
- if required columns are missing, the scoring step should fail clearly or skip incomplete rows safely

## Testing

The workflow should be verified with:

1. a manual run against the existing mock `Leads` sheet
2. confirmation that `score` and `tier` write back correctly
3. confirmation that the workflow still makes sense visually to a first-time viewer
4. optional validation that enabling the live trigger works once credentials are connected

## Scope

This spec covers the portfolio-friendly rebuild of the lead scoring workflow and its onboarding experience.

This spec does not include:

- automatic Google Cloud project creation
- service-account or JWT setup
- secret management
- multi-user enterprise credential automation

## Success Criteria

The design is successful when:

1. the main workflow uses Google Sheets nodes rather than the JWT/API workaround
2. a new user can understand setup from the canvas alone
3. the only required auth action is a normal `Connect with Google` flow
4. the workflow can score and update leads in the target sheet
5. the workflow looks clean and portfolio-ready in the n8n editor
