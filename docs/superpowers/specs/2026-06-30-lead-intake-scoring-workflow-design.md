# Lead Intake Scoring Workflow Design

## Goal

Create a portfolio-ready n8n workflow that reads lead rows from Google Sheets, calculates a weighted score using transparent in-workflow rules, assigns a lead tier, and writes the results back to the same sheet.

## Scope

This first version focuses on simple lead qualification only.

Included:

- Google Sheets-based lead intake
- adjustable scoring weights stored inside the workflow
- weighted score calculation
- tier assignment based on score thresholds
- same-row update of workflow outputs

Excluded from version 1:

- follow-up messaging
- separate output sheets
- AI-based lead scoring
- `next_step` routing logic

## Lead Data Model

Each lead row should include these input fields:

- `name`
- `email`
- `company`
- `source`
- `budget`
- `interest`
- `notes`

The workflow will write back these output fields:

- `score`
- `tier`

## Workflow Shape

The workflow should:

1. Trigger when a lead row is added or updated in Google Sheets.
2. Read the lead fields from that row.
3. Load a small in-workflow scoring configuration block.
4. Calculate weighted points from selected fields.
5. Sum the points into a final numeric `score`.
6. Convert that score into a `tier`.
7. Update the same row with `score` and `tier`.

## Scoring Model

The workflow uses a transparent rules-based weighted scoring model.

### Weight Storage

Weights should live inside the workflow so the demo stays self-contained and easy to explain.

The scoring config should be visibly editable in n8n, making it clear that values can be tuned without redesigning the workflow.

### Suggested Weight Categories

Version 1 should score from fields such as:

- `budget`
- `source`
- `interest`

`notes` may be retained as context but does not need to affect the score yet unless the implementation can do so simply and transparently.

### Tiering

The total score maps to a business-friendly tier:

- `hot`
- `warm`
- `cold`

The exact numeric thresholds should be kept simple and easy to demonstrate.

## Portfolio Positioning

This workflow should feel like real business automation rather than a toy demo.

It should be easy to explain in a walkthrough:

- lead enters through a sheet
- transparent scoring rules are applied
- the same sheet is updated with qualification results

This makes the workflow useful for showing business logic, data handling, and maintainability without relying on hidden AI behavior.

## Upgrade Path

The natural next improvement is to add `next_step` logic on top of the existing score and tier outputs.

Examples for a later version:

- `book_call`
- `send_nurture_email`
- `manual_review`

Version 1 should be structured so that adding `next_step` later is an additive change rather than a redesign.

## Validation

The workflow is considered successful if:

1. Sample lead rows with different values produce different numeric scores.
2. Those scores map cleanly into `hot`, `warm`, and `cold`.
3. The same source row is updated correctly with `score` and `tier`.
4. The scoring configuration is understandable during a portfolio walkthrough.
