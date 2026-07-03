# n8n Portfolio

This workspace is configured to use the local `n8n-local` MCP server in Codex.

Configured MCP URL:

- `http://localhost:5678/mcp-server/http`

Notes:

- the bearer token is stored in the Windows user environment variable `N8N_MCP_TOKEN`
- the Codex MCP entry has already been registered as `n8n-local`
- if you later expose n8n through `ngrok`, update the MCP server URL instead of rebuilding the whole setup
- if the configured MCP URL returns `404`, enable instance-level MCP access in n8n or copy the exact MCP URL from n8n's MCP settings

Template scraper:

- run `node .\scripts\scrape-n8n-templates.mjs` to pull live n8n workflow templates into `data\n8n-templates`
- main outputs: `summary.json`, `filters.json`, `catalog.jsonl`, `ai-catalog.jsonl`
- AI-ready folder library: `data\n8n-templates\type-library\{type}\templates.jsonl`
- each type folder also gets `manifest.json` with top templates
- type index: `data\n8n-templates\type-index.json`
- use `--ai-only` to export only AI-relevant templates
- use `--max 200` to cap exported records during quick experiments

Importable workflow JSON export:

- run `node .\scripts\export-importable-n8n-templates.mjs`
- output root: `data\n8n-templates\importable-by-type`
- each workflow is saved as an importable `.json` file inside one primary type folder
- global lookup file: `data\n8n-templates\importable-by-type\index.jsonl`

Reference packs:

- run `node .\scripts\build-reference-packs.mjs`
- output root: `data\n8n-templates\reference-packs`
- each pack contains `workflows\*.json`, `index.jsonl`, and `manifest.json`
- current packs: `ai-agents`, `rag`, `lead-gen`, `social-content`, `email-agents`
