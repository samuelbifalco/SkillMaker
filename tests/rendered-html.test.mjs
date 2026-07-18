import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the SkillMaker workspace shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>SkillMaker<\/title>/i);
  assert.match(html, /open-source workspace/i);
  assert.match(html, /Design, validate, and export/);
  assert.match(html, /SKILL\.md preview/);
  assert.match(html, /Assist Draft/);
  assert.match(html, /Copy Install Prompt/);
  assert.match(html, /Templates/);
  assert.match(html, /Added/);
  assert.match(html, /Import/);
  assert.match(html, /Dedupe/);
  assert.match(html, /Delete draft/);
  assert.match(html, /disabled=""/);
  assert.match(html, /Code Review/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/);
});

test("uses finished site metadata and removes starter preview files", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /generateSkillMarkdown/);
  assert.match(page, /downloadMarkdown/);
  assert.match(page, /parseSkillMarkdown/);
  assert.match(page, /validationChecks/);
  assert.match(page, /addedTemplateSlugs/);
  assert.match(page, /deleteSkillById/);
  assert.match(page, /removeDuplicateDrafts/);
  assert.match(layout, /title:\s*"SkillMaker"/);
  assert.match(layout, /images:\s*\["\/og\.png"\]/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview|_sites-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await access(new URL("../public/og.png", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});

test("includes open-source project hygiene files", async () => {
  await Promise.all([
    access(new URL("../LICENSE", import.meta.url)),
    access(new URL("../CONTRIBUTING.md", import.meta.url)),
    access(new URL("../CODE_OF_CONDUCT.md", import.meta.url)),
    access(new URL("../SECURITY.md", import.meta.url)),
    access(new URL("../ROADMAP.md", import.meta.url)),
    access(new URL("../.github/ISSUE_TEMPLATE/bug_report.md", import.meta.url)),
    access(new URL("../.github/ISSUE_TEMPLATE/feature_request.md", import.meta.url)),
    access(new URL("../.github/PULL_REQUEST_TEMPLATE.md", import.meta.url)),
  ]);

  const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
  assert.match(readme, /^# SkillMaker/m);
  assert.match(readme, /open-source workspace/);
  assert.doesNotMatch(readme, /vinext-starter/);
});
