import fs from "node:fs/promises";
import path from "node:path";

const CATALOG_PATH = path.resolve("data", "n8n-templates", "catalog.jsonl");
const OUTPUT_ROOT = path.resolve("data", "n8n-templates", "importable-by-type");
const API_URL = "https://api.n8n.io/api/workflows";
const PAGE_SIZE = 250;

const TYPE_PRIORITY = [
  "ai-relevant",
  "ai",
  "marketing",
  "sales",
  "communication",
  "analytics",
  "productivity",
  "finance-accounting",
  "data-storage",
  "utility",
  "miscellaneous",
  "developer-tools",
  "development",
  "langchain",
  "core-nodes",
  "hitl",
  "uncategorized",
];

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

function choosePrimaryType(template) {
  const types = new Set(template.nodeCategoryNames.map(normalizeTypeName));

  if (template.isAiRelevant) {
    types.add("ai-relevant");
  }

  for (const type of TYPE_PRIORITY) {
    if (types.has(type)) {
      return type;
    }
  }

  return [...types][0] ?? "uncategorized";
}

async function readCatalog() {
  const raw = await fs.readFile(CATALOG_PATH, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const map = new Map();

  for (const line of lines) {
    const template = JSON.parse(line);
    map.set(template.id, {
      ...template,
      primaryType: choosePrimaryType(template),
    });
  }

  return map;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "n8n-portfolio-importable-exporter/1.0",
    },
  });

  if (!res.ok) {
    throw new Error(`Fetch failed ${res.status} for ${url}`);
  }

  return res.json();
}

function buildPageUrl(page) {
  return `${API_URL}?pagination[page]=${page}&pagination[pageSize]=${PAGE_SIZE}`;
}

async function ensureCleanDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  const catalog = await readCatalog();

  if (catalog.size === 0) {
    throw new Error("Catalog empty. Run scrape-n8n-templates.mjs first.");
  }

  await ensureCleanDir(OUTPUT_ROOT);

  const firstPage = await fetchJson(buildPageUrl(1));
  const totalPages = firstPage.meta?.pagination?.pageCount ?? 1;
  const matched = [];
  const typeCounts = new Map();
  let matchedCount = 0;

  async function processPageData(items) {
    for (const item of items) {
      const template = catalog.get(item.id);

      if (!template || !item.workflow) {
        continue;
      }

      const typeDir = path.join(OUTPUT_ROOT, template.primaryType);
      const fileName = `${String(item.id).padStart(5, "0")}-${slugify(template.name)}.json`;
      const relativePath = path.join(template.primaryType, fileName).replaceAll("\\", "/");

      await fs.mkdir(typeDir, { recursive: true });
      await fs.writeFile(path.join(typeDir, fileName), `${JSON.stringify(item.workflow, null, 2)}\n`);

      matched.push({
        id: template.id,
        name: template.name,
        createdAt: template.createdAt,
        totalViews: template.totalViews,
        recentViews: template.recentViews,
        creator: template.creator,
        verifiedCreator: template.verifiedCreator,
        nodeCount: template.nodeCount,
        primaryType: template.primaryType,
        allTypes: [
          ...new Set([
            ...template.nodeCategoryNames.map(normalizeTypeName),
            ...(template.isAiRelevant ? ["ai-relevant"] : []),
          ]),
        ].sort(),
        file: relativePath,
      });

      typeCounts.set(template.primaryType, (typeCounts.get(template.primaryType) ?? 0) + 1);
      matchedCount += 1;
    }
  }

  console.log(`Fetch page 1/${totalPages}`);
  await processPageData(firstPage.data ?? []);

  for (let page = 2; page <= totalPages; page += 1) {
    console.log(`Fetch page ${page}/${totalPages}`);
    const payload = await fetchJson(buildPageUrl(page));
    await processPageData(payload.data ?? []);
  }

  matched.sort((a, b) => a.primaryType.localeCompare(b.primaryType) || a.name.localeCompare(b.name));

  const indexPath = path.join(OUTPUT_ROOT, "index.jsonl");
  const summaryPath = path.join(OUTPUT_ROOT, "summary.json");

  await fs.writeFile(indexPath, matched.map((row) => JSON.stringify(row)).join("\n") + "\n");
  await fs.writeFile(
    summaryPath,
    `${JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        sourceApi: API_URL,
        pageSize: PAGE_SIZE,
        requestedTemplateCount: catalog.size,
        exportedTemplateCount: matchedCount,
        typeCounts: Object.fromEntries([...typeCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]))),
      },
      null,
      2,
    )}\n`,
  );

  console.log(`Wrote ${summaryPath}`);
  console.log(`Wrote ${indexPath}`);
  console.log(`Exported ${matchedCount} importable workflow JSON files`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
