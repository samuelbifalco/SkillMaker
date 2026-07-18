"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type SkillDraft = {
  id: string;
  title: string;
  summary: string;
  purpose: string;
  audience: string;
  triggers: string;
  inputs: string;
  workflow: string;
  materials: string;
  output: string;
  guardrails: string;
};

type ValidationCheck = {
  label: string;
  passed: boolean;
  detail: string;
};

const templates: SkillDraft[] = [
  {
    id: "template-code-review",
    title: "Code Review",
    summary: "Review code changes for correctness, risk, and missing tests.",
    purpose:
      "Help an agent inspect a pull request or patch and return concise, actionable findings before any summary.",
    audience: "Software engineers and agents reviewing application code.",
    triggers:
      "User asks for a review\nUser shares a diff, pull request, or changed file set\nUser asks for risk assessment before merge",
    inputs:
      "Changed files or diff\nRelevant tests or build output\nProduct requirements or acceptance criteria\nKnown risky modules",
    workflow:
      "Read the changed files and nearest tests\nIdentify behavior changes and user-visible risk\nCheck edge cases, error handling, and data contracts\nVerify whether tests cover the changed behavior\nReturn findings first with file and line references",
    materials:
      "Findings should be ordered by severity.\nUse this shape:\n- [P1] Title - file:line - why it matters - suggested fix",
    output:
      "A prioritized review with findings first, then open questions, then a short change summary.",
    guardrails:
      "Do not mention unrelated style issues unless they hide a defect.\nDo not approve risky changes without evidence from tests or code.",
  },
  {
    id: "template-data-validation",
    title: "Data Validation",
    summary: "Validate a dataset or metric before it is used in a report.",
    purpose:
      "Guide an agent through schema checks, freshness checks, outlier review, and caveat reporting.",
    audience: "Analysts preparing dashboards, reports, or KPI readouts.",
    triggers:
      "User asks whether data is reliable\nA report or dashboard depends on a new dataset\nA metric changed unexpectedly",
    inputs:
      "Dataset sample\nSchema or query\nMetric definition\nExpected grain and time window",
    workflow:
      "Confirm the business question and metric definition\nCheck row counts, nulls, duplicates, and data types\nVerify time coverage and freshness\nInspect outliers and suspicious segments\nSummarize limitations and whether the data is fit for use",
    materials:
      "Useful checks:\nSELECT COUNT(*) AS rows FROM table;\nSELECT key, COUNT(*) FROM table GROUP BY key HAVING COUNT(*) > 1;",
    output:
      "A data quality verdict, supporting checks, caveats, and recommended fixes.",
    guardrails:
      "Do not claim data is complete without checking freshness and expected grain.\nCall out assumptions explicitly.",
  },
  {
    id: "template-docs-generator",
    title: "Documentation Generator",
    summary: "Turn source material into clear, maintainable documentation.",
    purpose:
      "Help an agent produce docs that explain what changed, how to use it, and what readers need to know next.",
    audience: "Developers, maintainers, and product teams writing technical docs.",
    triggers:
      "User asks for documentation\nUser provides code and wants usage docs\nUser needs README, changelog, or migration notes",
    inputs:
      "Source code or API surface\nTarget reader\nRequired documentation format\nKnown caveats or migration details",
    workflow:
      "Identify the reader and their goal\nInspect the source material and existing docs\nDraft concise sections in reading order\nInclude runnable examples where useful\nCall out caveats, assumptions, and follow-up tasks",
    materials:
      "Prefer short headings, runnable examples, and concrete behavior over marketing language.",
    output:
      "Documentation ready to paste into the requested file or publish as a standalone page.",
    guardrails:
      "Do not invent APIs, flags, or behavior.\nMark uncertain details as assumptions.\nKeep examples minimal and accurate.",
  },
];

const starterSkills: SkillDraft[] = templates.slice(0, 2).map((skill) => ({
  ...skill,
  id: skill.id.replace("template", "skill"),
}));

const blankSkill = (): SkillDraft => ({
  id: `skill-${Date.now()}`,
  title: "New Skill",
  summary: "",
  purpose: "",
  audience: "",
  triggers: "",
  inputs: "",
  workflow: "",
  materials: "",
  output: "",
  guardrails: "",
});

function cloneSkill(skill: SkillDraft, title = skill.title): SkillDraft {
  return {
    ...skill,
    id: `skill-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
  };
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "custom-skill"
  );
}

function listLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function cleanListLine(line: string) {
  return line.replace(/^[-*0-9. ]+/, "").trim();
}

function sectionList(value: string, fallback: string) {
  const lines = listLines(value);
  if (!lines.length) {
    return `- ${fallback}`;
  }
  return lines.map((line) => `- ${cleanListLine(line)}`).join("\n");
}

function numberedList(value: string) {
  const lines = listLines(value);
  if (!lines.length) {
    return "1. Clarify the user's goal and available inputs.\n2. Gather the relevant context.\n3. Execute the workflow carefully.\n4. Return the requested artifact with caveats.";
  }
  return lines.map((line, index) => `${index + 1}. ${cleanListLine(line)}`).join("\n");
}

function generateSkillMarkdown(skill: SkillDraft) {
  const name = slugify(skill.title);
  const description =
    skill.summary || `Use when a user needs help with ${skill.title}.`;
  const materials = skill.materials.trim()
    ? `\n## Reference Materials\n\nUse these notes, examples, or code snippets when they are relevant:\n\n\`\`\`text\n${skill.materials.trim()}\n\`\`\`\n`
    : "";

  return `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${skill.title || "Custom Skill"}\n\n## Purpose\n\n${skill.purpose || "Define what this skill helps the agent accomplish."}\n\n## Audience\n\n${skill.audience || "Describe who benefits from this skill and the context they work in."}\n\n## When To Use\n\n${sectionList(skill.triggers, "Use when the user request matches this skill's purpose.")}\n\n## Required Inputs\n\n${sectionList(skill.inputs, "Ask for the minimum missing context needed to proceed.")}\n\n## Workflow\n\n${numberedList(skill.workflow)}\n${materials}\n## Output\n\n${skill.output || "Return a complete, user-ready result in the format requested by the user."}\n\n## Guardrails\n\n${sectionList(skill.guardrails, "Be explicit about assumptions, risks, and verification gaps.")}\n`;
}

function validationChecks(skill: SkillDraft): ValidationCheck[] {
  return [
    {
      label: "Frontmatter description",
      passed: Boolean(skill.summary.trim()),
      detail: "Add a one-line description so agents know when the skill applies.",
    },
    {
      label: "Trigger conditions",
      passed: listLines(skill.triggers).length >= 2,
      detail: "List at least two situations where this skill should be used.",
    },
    {
      label: "Required inputs",
      passed: listLines(skill.inputs).length >= 2,
      detail: "Name the context an agent should gather before starting.",
    },
    {
      label: "Workflow depth",
      passed: listLines(skill.workflow).length >= 4,
      detail: "Use at least four ordered steps so execution is repeatable.",
    },
    {
      label: "Expected output",
      passed: Boolean(skill.output.trim()),
      detail: "Tell the agent what final artifact or answer to return.",
    },
    {
      label: "Guardrails",
      passed: Boolean(skill.guardrails.trim()),
      detail: "Add constraints that prevent overreach, guessing, or unsafe behavior.",
    },
    {
      label: "Reference material",
      passed: Boolean(skill.materials.trim()),
      detail: "Optional but recommended: include examples, code, or source notes.",
    },
  ];
}

function extractSection(markdown: string, heading: string) {
  const pattern = new RegExp(
    `## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |\\n# |$)`,
    "i",
  );
  return markdown.match(pattern)?.[1]?.trim() ?? "";
}

function normalizeListSection(value: string) {
  return listLines(value)
    .filter((line) => !line.startsWith("```"))
    .map(cleanListLine)
    .filter(Boolean)
    .join("\n");
}

function normalizeWorkflow(value: string) {
  return listLines(value)
    .map(cleanListLine)
    .filter(Boolean)
    .join("\n");
}

function parseSkillMarkdown(markdown: string): SkillDraft {
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---/);
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "Imported Skill";
  const description =
    frontmatter?.[1]
      ?.match(/^description:\s*(.+)$/m)?.[1]
      ?.replace(/^["']|["']$/g, "")
      .trim() ?? "";
  const materials = extractSection(markdown, "Reference Materials").replace(
    /^```[a-z]*\n?|```$/g,
    "",
  );

  return {
    id: `skill-${Date.now()}`,
    title,
    summary: description,
    purpose: extractSection(markdown, "Purpose"),
    audience: extractSection(markdown, "Audience"),
    triggers: normalizeListSection(extractSection(markdown, "When To Use")),
    inputs: normalizeListSection(extractSection(markdown, "Required Inputs")),
    workflow: normalizeWorkflow(extractSection(markdown, "Workflow")),
    materials: materials.trim(),
    output: extractSection(markdown, "Output"),
    guardrails: normalizeListSection(extractSection(markdown, "Guardrails")),
  };
}

function suggestFromIdea(idea: string, current: SkillDraft): SkillDraft {
  const clean = idea.trim();
  if (!clean) {
    return current;
  }

  const titleWords = clean
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 3);
  const title =
    current.title && current.title !== "New Skill"
      ? current.title
      : titleWords.length
        ? titleWords.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ")
        : "Custom Skill";

  return {
    ...current,
    title,
    summary:
      current.summary ||
      `Turn requests about ${title.toLowerCase()} into a repeatable expert workflow.`,
    purpose:
      current.purpose ||
      `Help an agent handle ${clean} with consistent context gathering, execution steps, and a polished final artifact.`,
    audience:
      current.audience ||
      "People using Codex or another AI assistant to repeat a specialized workflow.",
    triggers:
      current.triggers ||
      `User asks for help with ${title.toLowerCase()}\nUser provides raw notes and wants a finished artifact\nUser needs a repeatable process rather than one-off advice`,
    inputs:
      current.inputs ||
      "User goal\nRelevant source material\nConstraints or preferences\nDesired output format",
    workflow:
      current.workflow ||
      "Restate the goal and identify missing context\nInspect the provided information or code\nApply the specialized procedure step by step\nValidate the result against the user's constraints\nReturn the final artifact and note any assumptions",
    output:
      current.output ||
      "A complete answer or file-ready artifact, with concise notes about assumptions and validation.",
    guardrails:
      current.guardrails ||
      "Ask for clarification only when missing context blocks progress.\nDo not invent unavailable facts, files, or credentials.\nKeep edits and recommendations scoped to the user's goal.",
  };
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [skills, setSkills] = useState<SkillDraft[]>(starterSkills);
  const [selectedId, setSelectedId] = useState("");
  const [idea, setIdea] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("skillmaker-drafts");
    if (!saved) {
      setSelectedId((current) => current || skills[0]?.id || "");
      return;
    }
    try {
      const parsed = JSON.parse(saved) as SkillDraft[];
      if (Array.isArray(parsed) && parsed.length) {
        setSkills(parsed);
        setSelectedId(parsed[0].id);
      }
    } catch {
      window.localStorage.removeItem("skillmaker-drafts");
    }
  }, []);

  useEffect(() => {
    if (!selectedId && skills[0]) {
      setSelectedId(skills[0].id);
    }
    window.localStorage.setItem("skillmaker-drafts", JSON.stringify(skills));
  }, [selectedId, skills]);

  const selected = skills.find((skill) => skill.id === selectedId) ?? skills[0];
  const markdown = useMemo(() => generateSkillMarkdown(selected), [selected]);
  const checks = useMemo(() => validationChecks(selected), [selected]);
  const quality = checks.filter((check) => check.passed).length;

  const addedTemplateSlugs = useMemo(
    () => new Set(skills.map((skill) => slugify(skill.title))),
    [skills],
  );

  function updateSelected(patch: Partial<SkillDraft>) {
    setSkills((current) =>
      current.map((skill) =>
        skill.id === selected.id ? { ...skill, ...patch } : skill,
      ),
    );
  }

  function addSkill() {
    const next = blankSkill();
    setSkills((current) => [next, ...current]);
    setSelectedId(next.id);
    setIdea("");
  }

  function addTemplate(template: SkillDraft) {
    const existing = skills.find(
      (skill) => slugify(skill.title) === slugify(template.title),
    );
    if (existing) {
      setSelectedId(existing.id);
      setIdea("");
      return;
    }

    const next = cloneSkill(template);
    setSkills((current) => [next, ...current]);
    setSelectedId(next.id);
    setIdea("");
  }

  function duplicateSkill() {
    const copy = cloneSkill(selected, `${selected.title} Copy`);
    setSkills((current) => [copy, ...current]);
    setSelectedId(copy.id);
  }

  function deleteSkill() {
    deleteSkillById(selected.id);
  }

  function deleteSkillById(id: string) {
    if (skills.length === 1) {
      const next = blankSkill();
      setSkills([next]);
      setSelectedId(next.id);
      return;
    }
    const remaining = skills.filter((skill) => skill.id !== id);
    setSkills(remaining);
    if (selectedId === id) {
      setSelectedId(remaining[0].id);
    }
  }

  async function copyText(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1400);
  }

  function downloadText(contents: string, filename: string) {
    const blob = new Blob([contents], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadMarkdown() {
    downloadText(markdown, `${slugify(selected.title)}.skill.md`);
  }

  function downloadBundle() {
    const bundle = skills
      .map(
        (skill) =>
          `<!-- ${slugify(skill.title)}/SKILL.md -->\n\n${generateSkillMarkdown(skill)}`,
      )
      .join("\n\n---\n\n");
    downloadText(bundle, "skillmaker-bundle.md");
  }

  async function importSkill(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const imported = parseSkillMarkdown(text);
    setSkills((current) => [imported, ...current]);
    setSelectedId(imported.id);
    event.target.value = "";
  }

  const installPrompt = `Use this skill in an agent workspace:\n\n1. Create a folder named ${slugify(selected.title)}.\n2. Save the following content as ${slugify(selected.title)}/SKILL.md.\n3. Restart or reload the agent so it can discover the skill.\n\n${markdown}`;

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Skill drafts">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            S
          </div>
          <div>
            <p className="eyebrow">Open-source skill builder</p>
            <h1>SkillMaker</h1>
          </div>
        </div>

        <button className="primary-action" type="button" onClick={addSkill}>
          <span aria-hidden="true">+</span>
          New Skill
        </button>

        <input
          ref={fileInputRef}
          className="file-input"
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          onChange={importSkill}
          aria-label="Import an existing SKILL.md file"
        />

        <div className="template-box">
          <p className="eyebrow">Templates</p>
          <div className="template-grid">
            {templates.map((template) => {
              const isAdded = addedTemplateSlugs.has(slugify(template.title));
              return (
                <button
                  className={isAdded ? "template-added" : ""}
                  key={template.id}
                  type="button"
                  onClick={() => addTemplate(template)}
                  aria-label={
                    isAdded
                      ? `Select existing ${template.title} draft`
                      : `Add ${template.title} template`
                  }
                >
                  <span>{template.title}</span>
                  {isAdded ? <small>Added</small> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="skill-list">
          {skills.map((skill) => (
            <div
              className={`skill-row ${skill.id === selected.id ? "active" : ""}`}
              key={skill.id}
            >
              <button
                className="skill-card"
                onClick={() => setSelectedId(skill.id)}
                type="button"
              >
                <span className="skill-icon" aria-hidden="true">
                  #
                </span>
                <span>
                  <strong>{skill.title || "Untitled Skill"}</strong>
                  <small>{skill.summary || "No summary yet"}</small>
                </span>
              </button>
              <button
                className="skill-delete"
                type="button"
                onClick={() => deleteSkillById(skill.id)}
                aria-label={`Delete ${skill.title || "untitled skill"}`}
                title="Delete draft"
              >
                x
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            Import
          </button>
          <button type="button" onClick={downloadBundle}>
            Export All
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Design, validate, and export SKILL.md</p>
            <h2>Turn repeatable AI workflows into clean skill files.</h2>
          </div>
          <div className="topbar-actions">
            <button type="button" onClick={deleteSkill}>
              Delete
            </button>
            <button type="button" onClick={duplicateSkill}>
              Duplicate
            </button>
            <button type="button" onClick={() => copyText(markdown, "markdown")}>
              {copied === "markdown" ? "Copied" : "Copy"}
            </button>
            <button className="accent-action" type="button" onClick={downloadMarkdown}>
              Download
            </button>
          </div>
        </header>

        <div className="panels">
          <section className="editor-panel" aria-label="Skill information">
            <div className="assist-box">
              <label htmlFor="idea">Explain the skill you want</label>
              <textarea
                id="idea"
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                placeholder="Example: A skill that reviews launch plans, checks risks, and writes an executive-ready readiness memo."
              />
              <div className="utility-actions">
                <button
                  className="primary-action"
                  type="button"
                  onClick={() => updateSelected(suggestFromIdea(idea, selected))}
                >
                  Assist Draft
                </button>
                <button
                  type="button"
                  onClick={() => copyText(installPrompt, "prompt")}
                >
                  {copied === "prompt" ? "Copied" : "Copy Install Prompt"}
                </button>
              </div>
              <p className="privacy-note">
                Drafts stay in this browser unless you copy, download, import, or export them.
              </p>
            </div>

            <div className="field-grid">
              <label>
                <span>Skill title</span>
                <input
                  value={selected.title}
                  onChange={(event) => updateSelected({ title: event.target.value })}
                />
              </label>
              <label>
                <span>One-line description</span>
                <input
                  value={selected.summary}
                  onChange={(event) => updateSelected({ summary: event.target.value })}
                />
              </label>
              <label>
                <span>Purpose</span>
                <textarea
                  value={selected.purpose}
                  onChange={(event) => updateSelected({ purpose: event.target.value })}
                />
              </label>
              <label>
                <span>Audience or operating context</span>
                <textarea
                  value={selected.audience}
                  onChange={(event) => updateSelected({ audience: event.target.value })}
                />
              </label>
              <label>
                <span>When to use</span>
                <textarea
                  value={selected.triggers}
                  onChange={(event) => updateSelected({ triggers: event.target.value })}
                />
              </label>
              <label>
                <span>Required inputs</span>
                <textarea
                  value={selected.inputs}
                  onChange={(event) => updateSelected({ inputs: event.target.value })}
                />
              </label>
            </div>
          </section>

          <section className="process-panel" aria-label="How the skill works">
            <div className="panel-heading">
              <p className="eyebrow">How it works</p>
              <h3>Workflow, materials, and checks</h3>
            </div>

            <label>
              <span>Step-by-step workflow</span>
              <textarea
                className="tall-input"
                value={selected.workflow}
                onChange={(event) => updateSelected({ workflow: event.target.value })}
              />
            </label>
            <label>
              <span>Information, examples, or code</span>
              <textarea
                className="code-input"
                value={selected.materials}
                onChange={(event) => updateSelected({ materials: event.target.value })}
              />
            </label>
            <label>
              <span>Expected output</span>
              <textarea
                value={selected.output}
                onChange={(event) => updateSelected({ output: event.target.value })}
              />
            </label>
            <label>
              <span>Guardrails</span>
              <textarea
                value={selected.guardrails}
                onChange={(event) => updateSelected({ guardrails: event.target.value })}
              />
            </label>

            <div className="quality-card">
              <div>
                <strong>{quality}/{checks.length}</strong>
                <span>Readiness checks complete</span>
              </div>
              <progress
                value={quality}
                max={checks.length}
                aria-label="Skill readiness"
              />
              <ul className="validation-list">
                {checks.map((check) => (
                  <li
                    className={`validation-item ${check.passed ? "passed" : ""}`}
                    key={check.label}
                  >
                    <span aria-hidden="true">{check.passed ? "OK" : "TODO"}</span>
                    <div>
                      <strong>{check.label}</strong>
                      <small>{check.detail}</small>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="preview-panel" aria-label="Generated Skill markdown">
            <div className="panel-heading preview-heading">
              <div>
                <p className="eyebrow">Generated result</p>
                <h3>SKILL.md preview</h3>
              </div>
              <span className="file-pill">{slugify(selected.title)}/SKILL.md</span>
            </div>
            <pre className="markdown-preview">
              <code>{markdown}</code>
            </pre>
          </section>
        </div>
      </section>
    </main>
  );
}
