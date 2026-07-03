# Repository Guidelines

## Workflow Folder Convention
- Each new n8n workflow gets its own folder at the repo root named `n8n_<workflow-title>/`
- The folder contains the importable workflow JSON and a `CONTEXT.md` describing the workflow

## Project Structure & Module Organization
- Root workflow examples live in files like `lead-intake-easy-setup-workflow.js` and `lead-scoring-via-sheets-api-update.js`.
- Reusable export and curation scripts live in [`scripts/`](C:/Users/Vidad/Documents/n8n-portfolio/scripts).
- Generated template reference data lives in [`data/n8n-templates/`](C:/Users/Vidad/Documents/n8n-portfolio/data/n8n-templates):
  - `catalog.jsonl`, `filters.json`, `summary.json` for scraped metadata
  - `importable-by-type/` for importable n8n workflow JSON files
  - `reference-packs/` for curated goal-based packs such as `ai-agents` and `rag`
- Design notes and plans live in [`docs/superpowers/specs/`](C:/Users/Vidad/Documents/n8n-portfolio/docs/superpowers/specs) and [`docs/superpowers/plans/`](C:/Users/Vidad/Documents/n8n-portfolio/docs/superpowers/plans).
- Credentials are stored under `credentials/`; treat this folder as sensitive.

## Template Reference Sources
- Future workflow work should start from existing template references in this repo before inventing new structures.
- First search [`data/n8n-templates/reference-packs/`](C:/Users/Vidad/Documents/n8n-portfolio/data/n8n-templates/reference-packs) for goal-based examples such as `ai-agents`, `rag`, `lead-gen`, `social-content`, and `email-agents`.
- If no good match exists, search [`data/n8n-templates/importable-by-type/`](C:/Users/Vidad/Documents/n8n-portfolio/data/n8n-templates/importable-by-type) for importable workflow JSON grouped by primary type.
- Use [`data/n8n-templates/type-library/`](C:/Users/Vidad/Documents/n8n-portfolio/data/n8n-templates/type-library) when metadata-only browsing is enough and you want faster AI scanning through `templates.jsonl` and `manifest.json`.
- Treat these folders as the basis for future automation design, node selection, naming patterns, and workflow structure.

## Build, Test, and Development Commands
- `node .\scripts\scrape-n8n-templates.mjs`  
  Pulls live template metadata from n8n into `data/n8n-templates/`.
- `node .\scripts\export-importable-n8n-templates.mjs`  
  Exports importable workflow JSON files into `data/n8n-templates/importable-by-type/`.
- `node .\scripts\build-reference-packs.mjs`  
  Builds curated packs in `data/n8n-templates/reference-packs/`.
- `node <script>.js`  
  Use for local workflow helper scripts when validating payload shape or transforms.

## Local n8n Workflow Lessons
- Prefer verifying against the live local n8n instance and the real Google Sheets output, not only exported workflow JSON.
- For local n8n runs, use the n8n UI `Execute workflow` button when the server is already running. The CLI command `n8n execute --id=<workflow-id>` can fail because the task broker port `5679` is already in use.
- After running a workflow, confirm the n8n Executions tab shows a successful execution and that node item counts match the expected outputs. For multi-tab Google Sheets reports, item count should usually match the number of target reports.
- When a workflow uses Google Sheets API `sheetId` values, refresh spreadsheet metadata before editing or rerunning. Sheet tab IDs can change after tabs are copied, deleted, or recreated, even when visible tab names stay the same.
- If a Google Sheets HTTP Request node fails with a generic `Bad request`, inspect the saved n8n execution data for the real Google API error. In Docker-backed local n8n, the SQLite DB is under `/home/node/.n8n/database.sqlite`, with details in `execution_data`.
- For Google Sheets report workflows, separate content generation from formatting. Build rows from source headers and business rules first, then apply template formatting and end borders after values are written.
- Do not blindly copy accidental template artifacts. Preserve intentional layout, but keep generated body rules explicit, such as repeating the Team value per row instead of relying on merged cells.
- For weekly IR reports, row selection should be explicit and explainable: read source rows, map headers by name, filter by configured date window, then filter by supported `LOCATION` values before grouping by tab.
- Store workflow-specific lessons in the workflow folder `CONTEXT.md` when creating a new `n8n_<workflow-title>/` directory, especially source/target sheet IDs, expected item counts, known credentials, and verification ranges.

## Coding Style & Naming Conventions
- Use JavaScript/Node with 2-space indentation and semicolons omitted, matching existing `.mjs` scripts.
- Prefer descriptive kebab-case filenames for generated workflow JSON, for example `01954-ai-agent-chat.json`.
- Keep generated data under `data/`; keep handwritten logic under `scripts/` or root `.js` workflow helpers.
- Avoid hardcoding secrets in workflow JSON or scripts.

## Testing Guidelines
- No formal test suite exists yet. Validate changes by rerunning the relevant script and checking output counts in `summary.json`.
- For workflow JSON exports, verify a sample file can be imported into n8n and that `index.jsonl` paths resolve correctly.
- When changing categorization logic, spot-check at least one file in each affected folder.

## Commit & Pull Request Guidelines
- This workspace currently has no Git metadata, so use clear imperative commit titles when versioning elsewhere, for example: `Add importable n8n template exporter`.
- Keep commits focused: one script change, one data regeneration, or one workflow update per commit.
- PRs should include:
  - purpose and scope
  - commands run
  - affected output folders
  - sample before/after paths when regenerating template libraries

## Agent skills

### Issue tracker

Issues are tracked as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical labels — all use their default names. See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context layout — `CONTEXT-MAP.md` at the root points to per-context files. See `docs/agents/domain.md`.

## Security & Configuration Tips
- Do not commit live credentials or tokens.
- Review `credentials/n8n-sa-portfolio.json` carefully before sharing the workspace.
- Treat generated workflow JSON as untrusted input until reviewed; some templates reference external APIs and placeholder credentials.
