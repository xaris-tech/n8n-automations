import fs from "node:fs/promises";
import path from "node:path";

const OUTPUT_DIR = path.resolve("data", "n8n-templates");
const TYPE_LIBRARY_DIR = path.join(OUTPUT_DIR, "type-library");
const FILTERS_URL = "https://api.n8n.io/api/templates/search/filters";
const WORKFLOWS_URL = "https://api.n8n.io/api/templates/workflows";
const AI_NAME_RE =
  /\b(ai|agent|rag|openai|claude|gemini|anthropic|ollama|llm|gpt|summari[sz]e|vector|embedding)\b/i;

function parseArgs(argv) {
  const args = {
    aiOnly: false,
    keepRaw: false,
    max: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--ai-only") {
      args.aiOnly = true;
      continue;
    }

    if (arg === "--keep-raw") {
      args.keepRaw = true;
      continue;
    }

    if (arg === "--max") {
      const value = Number(argv[i + 1]);
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error("--max must be positive integer");
      }
      args.max = value;
      i += 1;
      continue;
    }

    throw new Error(`Unknown arg: ${arg}`);
  }

  return args;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "n8n-portfolio-template-scraper/1.0",
    },
  });

  if (!res.ok) {
    throw new Error(`Fetch failed ${res.status} for ${url}`);
  }

  return res.json();
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeTypeName(value) {
  const slug = slugify(value);
  return slug || "uncategorized";
}

async function resetDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function writeTypeLibrary(templates) {
  const index = new Map();

  await resetDir(TYPE_LIBRARY_DIR);

  for (const template of templates) {
    const types = new Set(template.nodeCategoryNames.map(normalizeTypeName));

    if (template.isAiRelevant) {
      types.add("ai-relevant");
    }

    if (types.size === 0) {
      types.add("uncategorized");
    }

    for (const type of types) {
      if (!index.has(type)) {
        index.set(type, []);
      }

      index.get(type).push({
        ...template,
        referenceType: type,
      });
    }
  }

  const typeIndex = [...index.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([type, templatesForType]) => ({
      type,
      count: templatesForType.length,
      folder: `type-library/${type}`,
      topTemplates: templatesForType
        .slice()
        .sort((a, b) => (b.totalViews - a.totalViews) || (b.recentViews - a.recentViews))
        .slice(0, 50)
        .map((template) => ({
          id: template.id,
          name: template.name,
          creator: template.creator,
          totalViews: template.totalViews,
          recentViews: template.recentViews,
          nodeCount: template.nodeCount,
        })),
    }));

  for (const [type, templatesForType] of index.entries()) {
    const typeDir = path.join(TYPE_LIBRARY_DIR, type);
    const manifestPath = path.join(typeDir, "manifest.json");
    const templatesPath = path.join(typeDir, "templates.jsonl");
    const sortedTemplates = templatesForType
      .slice()
      .sort((a, b) => (b.totalViews - a.totalViews) || (b.recentViews - a.recentViews));

    await fs.mkdir(typeDir, { recursive: true });
    await fs.writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          type,
          count: sortedTemplates.length,
          createdAt: new Date().toISOString(),
          topTemplates: sortedTemplates.slice(0, 25).map((template) => ({
            id: template.id,
            name: template.name,
            creator: template.creator,
            totalViews: template.totalViews,
            recentViews: template.recentViews,
            nodeCount: template.nodeCount,
          })),
        },
        null,
        2,
      )}\n`,
    );
    await fs.writeFile(templatesPath, toJsonLines(sortedTemplates));
  }

  await fs.writeFile(path.join(OUTPUT_DIR, "type-index.json"), `${JSON.stringify(typeIndex, null, 2)}\n`);
}

function normalizeTemplate(workflow) {
  const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
  const nodeNames = uniqueSorted(nodes.map((node) => node.name));
  const nodeDisplayNames = uniqueSorted(nodes.map((node) => node.displayName));
  const nodeCategoryNames = uniqueSorted(
    nodes.flatMap((node) =>
      Array.isArray(node.nodeCategories)
        ? node.nodeCategories.map((category) => category?.name)
        : [],
    ),
  );
  const creator = workflow.user?.username ?? null;
  const verifiedCreator = Boolean(workflow.user?.verified);
  const aiSignals = [];

  if (AI_NAME_RE.test(workflow.name ?? "")) aiSignals.push("name");
  if (nodeNames.some((name) => name.startsWith("@n8n/n8n-nodes-langchain."))) aiSignals.push("langchain-node");
  if (nodeCategoryNames.some((name) => /^(AI|Langchain)$/i.test(name))) aiSignals.push("ai-node-category");
  if (
    nodeDisplayNames.some((name) =>
      /\b(ai|agent|chat model|embeddings|vector store|classifier|retriever|openai|claude|gemini)\b/i.test(
        name,
      ),
    )
  ) {
    aiSignals.push("ai-node-display-name");
  }

  return {
    id: workflow.id,
    name: workflow.name,
    createdAt: workflow.createdAt,
    totalViews: workflow.totalViews ?? 0,
    recentViews: workflow.recentViews ?? 0,
    readyToDemo: workflow.readyToDemo ?? null,
    creator,
    verifiedCreator,
    nodeCount: nodes.length,
    nodeNames,
    nodeDisplayNames,
    nodeCategoryNames,
    aiSignals,
    isAiRelevant: aiSignals.length > 0,
  };
}

function toJsonLines(items) {
  return items.map((item) => JSON.stringify(item)).join("\n") + "\n";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();

  console.log(`Fetch filters: ${FILTERS_URL}`);
  const filters = await fetchJson(FILTERS_URL);

  console.log(`Fetch workflows: ${WORKFLOWS_URL}`);
  const rawWorkflows = await fetchJson(WORKFLOWS_URL);
  const workflows = Array.isArray(rawWorkflows.workflows) ? rawWorkflows.workflows : [];

  const normalized = workflows.map(normalizeTemplate);
  const aiTemplates = normalized.filter((template) => template.isAiRelevant);
  const selectedTemplates = args.aiOnly ? aiTemplates : normalized;
  const limitedTemplates = args.max ? selectedTemplates.slice(0, args.max) : selectedTemplates;

  const summary = {
    scrapedAt: startedAt,
    source: {
      filtersUrl: FILTERS_URL,
      workflowsUrl: WORKFLOWS_URL,
    },
    counts: {
      totalTemplates: normalized.length,
      aiRelevantTemplates: aiTemplates.length,
      exportedTemplates: limitedTemplates.length,
    },
    topWorkflowCategories: (filters.categories ?? [])
      .slice()
      .sort((a, b) => (b.hitCount ?? 0) - (a.hitCount ?? 0))
      .slice(0, 15)
      .map((category) => ({
        id: category.id,
        name: category.name,
        hitCount: category.hitCount,
      })),
    topNodes: (filters.nodes ?? [])
      .slice()
      .sort((a, b) => (b.hitCount ?? 0) - (a.hitCount ?? 0))
      .slice(0, 25)
      .map((node) => ({
        id: node.id,
        name: node.name,
        displayName: node.displayName,
        hitCount: node.hitCount,
      })),
  };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const summaryPath = path.join(OUTPUT_DIR, "summary.json");
  const filtersPath = path.join(OUTPUT_DIR, "filters.json");
  const catalogJsonlPath = path.join(OUTPUT_DIR, "catalog.jsonl");
  const aiJsonlPath = path.join(OUTPUT_DIR, "ai-catalog.jsonl");

  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  await fs.writeFile(filtersPath, `${JSON.stringify(filters, null, 2)}\n`);
  await fs.writeFile(catalogJsonlPath, toJsonLines(limitedTemplates));
  await fs.writeFile(aiJsonlPath, toJsonLines(aiTemplates));
  await writeTypeLibrary(limitedTemplates);

  if (args.keepRaw) {
    const rawPath = path.join(OUTPUT_DIR, "raw-workflows.json");
    await fs.writeFile(rawPath, `${JSON.stringify(rawWorkflows)}\n`);
  }

  console.log(`Wrote ${summaryPath}`);
  console.log(`Wrote ${filtersPath}`);
  console.log(`Wrote ${catalogJsonlPath}`);
  console.log(`Wrote ${aiJsonlPath}`);
  console.log(`Wrote ${path.join(OUTPUT_DIR, "type-index.json")}`);
  console.log(`Wrote ${TYPE_LIBRARY_DIR}`);
  console.log(
    JSON.stringify(
      {
        totalTemplates: normalized.length,
        aiRelevantTemplates: aiTemplates.length,
        exportedTemplates: limitedTemplates.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
