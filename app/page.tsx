"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type Mode = "skill" | "design";

type Draft = {
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

type ModeConfig = {
  mode: Mode;
  fileName: "SKILL.md" | "DESIGN.md";
  noun: "Skill" | "Design";
  plural: "skills" | "designs";
  storageKey: string;
  title: string;
  eyebrow: string;
  headline: string;
  ideaLabel: string;
  ideaPlaceholder: string;
  titleLabel: string;
  summaryLabel: string;
  purposeLabel: string;
  audienceLabel: string;
  triggersLabel: string;
  inputsLabel: string;
  workflowLabel: string;
  materialsLabel: string;
  outputLabel: string;
  guardrailsLabel: string;
};

const modeConfigs: Record<Mode, ModeConfig> = {
  skill: {
    mode: "skill",
    fileName: "SKILL.md",
    noun: "Skill",
    plural: "skills",
    storageKey: "skillmaker-skill-drafts",
    title: "SkillMaker",
    eyebrow: "Design, validate, and export SKILL.md",
    headline: "Turn repeatable AI workflows into clean skill files.",
    ideaLabel: "Explain the skill you want",
    ideaPlaceholder:
      "Example: A skill that reviews launch plans, checks risks, and writes an executive-ready readiness memo.",
    titleLabel: "Skill title",
    summaryLabel: "One-line description",
    purposeLabel: "Purpose",
    audienceLabel: "Audience or operating context",
    triggersLabel: "When to use",
    inputsLabel: "Required inputs",
    workflowLabel: "Step-by-step workflow",
    materialsLabel: "Information, examples, or code",
    outputLabel: "Expected output",
    guardrailsLabel: "Guardrails",
  },
  design: {
    mode: "design",
    fileName: "DESIGN.md",
    noun: "Design",
    plural: "designs",
    storageKey: "skillmaker-design-drafts",
    title: "DesignMaker",
    eyebrow: "Design, validate, and export DESIGN.md",
    headline: "Turn product ideas into clear design briefs and system notes.",
    ideaLabel: "Explain the design you want",
    ideaPlaceholder:
      "Example: A calm dashboard for founders to review usage, conversion, and onboarding risk before a weekly meeting.",
    titleLabel: "Design title",
    summaryLabel: "One-line design brief",
    purposeLabel: "Product goal",
    audienceLabel: "Target users or context",
    triggersLabel: "When this design applies",
    inputsLabel: "Required content and constraints",
    workflowLabel: "Design process",
    materialsLabel: "Visual system, references, or code",
    outputLabel: "Expected design deliverable",
    guardrailsLabel: "Design constraints",
  },
};

const skillTemplates: Draft[] = [
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

const designTemplates: Draft[] = [
  {
    id: "template-saas-dashboard",
    title: "SaaS Dashboard",
    summary: "Design a dense operating dashboard for weekly product and revenue review.",
    purpose:
      "Define a practical dashboard experience that helps teams scan health, diagnose changes, and decide what to do next.",
    audience: "Founders, product leads, revenue teams, and operators.",
    triggers:
      "User needs a dashboard or internal tool design\nUser has metrics and wants a decision surface\nUser needs a product spec before implementation",
    inputs:
      "Primary user and job to be done\nMetrics, dimensions, and time range\nDecision cadence\nRequired filters and actions\nBrand or visual constraints",
    workflow:
      "Clarify the user's primary decision and audience\nDefine the information hierarchy and default view\nSpecify key components, filters, and empty states\nDescribe responsive behavior and interaction states\nCall out implementation notes and open questions",
    materials:
      "Prefer dense, scannable layouts for operational tools.\nAvoid marketing-style hero sections for dashboards.\nUse restrained color and clear table/chart hierarchy.",
    output:
      "A complete DESIGN.md brief with layout, components, states, visual system, and implementation notes.",
    guardrails:
      "Do not invent unavailable metrics.\nKeep visual choices tied to the user workflow.\nMake mobile constraints explicit.",
  },
  {
    id: "template-landing-page",
    title: "Product Landing Page",
    summary: "Design a public landing page with clear positioning and conversion flow.",
    purpose:
      "Create a design brief that explains the page structure, visual direction, and calls to action for a public product page.",
    audience: "Potential users evaluating a product, tool, venue, or service.",
    triggers:
      "User asks for a website or landing page\nUser needs a public product introduction\nUser wants a launch page design before build",
    inputs:
      "Product name\nTarget audience\nPrimary offer or category\nProof points\nCalls to action\nBrand constraints",
    workflow:
      "Identify the first-viewport promise and conversion goal\nDefine page sections in reading order\nSpecify imagery and visual tone\nDescribe calls to action and trust signals\nNote responsive layout and content priorities",
    materials:
      "Hero headline should be the product, brand, or literal offer.\nSupporting copy carries the value proposition.\nUse real or generated imagery when the subject needs visual inspection.",
    output:
      "A DESIGN.md brief that can guide implementation or design review.",
    guardrails:
      "Do not bury the product name.\nAvoid generic stock-like visuals.\nKeep claims specific and supportable.",
  },
  {
    id: "template-mobile-flow",
    title: "Mobile App Flow",
    summary: "Design a focused mobile workflow with screens, states, and edge cases.",
    purpose:
      "Help an agent or designer specify a mobile experience that is easy to scan, tap, and recover from errors.",
    audience: "Product designers and engineers building mobile-first workflows.",
    triggers:
      "User needs mobile screens\nUser describes a multi-step flow\nUser wants interaction states before build",
    inputs:
      "User goal\nScreen list\nRequired data or actions\nError and empty states\nPlatform constraints",
    workflow:
      "Map the happy path and fallback paths\nDefine screen-by-screen content and controls\nSpecify navigation and state transitions\nDescribe loading, empty, error, and success states\nList implementation and accessibility notes",
    materials:
      "Prefer platform-native controls where possible.\nKeep tap targets large and copy short.\nAvoid relying on hover or dense desktop-only controls.",
    output:
      "A DESIGN.md brief with screen inventory, interactions, states, and build notes.",
    guardrails:
      "Do not add extra screens without user value.\nMake destructive actions reversible or confirmable.\nKeep text readable on small screens.",
  },
];

const templatesByMode: Record<Mode, Draft[]> = {
  skill: skillTemplates,
  design: designTemplates,
};

const starterDrafts: Record<Mode, Draft[]> = {
  skill: skillTemplates.slice(0, 2).map((draft) => ({
    ...draft,
    id: draft.id.replace("template", "skill"),
  })),
  design: designTemplates.slice(0, 2).map((draft) => ({
    ...draft,
    id: draft.id.replace("template", "design"),
  })),
};

const blankDraft = (mode: Mode): Draft => ({
  id: `${mode}-${Date.now()}`,
  title: mode === "skill" ? "New Skill" : "New Design",
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

function cloneDraft(draft: Draft, title = draft.title): Draft {
  return {
    ...draft,
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title,
  };
}

function slugify(value: string, fallback = "custom-document") {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || fallback
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

function numberedList(value: string, fallback: string[]) {
  const lines = listLines(value);
  const source = lines.length ? lines.map(cleanListLine) : fallback;
  return source.map((line, index) => `${index + 1}. ${line}`).join("\n");
}

function referenceSection(draft: Draft, heading: string) {
  if (!draft.materials.trim()) {
    return "";
  }

  return `\n## ${heading}\n\nUse these notes, examples, or code snippets when they are relevant:\n\n\`\`\`text\n${draft.materials.trim()}\n\`\`\`\n`;
}

function generateSkillMarkdown(draft: Draft) {
  const name = slugify(draft.title, "custom-skill");
  const description =
    draft.summary || `Use when a user needs help with ${draft.title}.`;

  return `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${draft.title || "Custom Skill"}\n\n## Purpose\n\n${draft.purpose || "Define what this skill helps the agent accomplish."}\n\n## Audience\n\n${draft.audience || "Describe who benefits from this skill and the context they work in."}\n\n## When To Use\n\n${sectionList(draft.triggers, "Use when the user request matches this skill's purpose.")}\n\n## Required Inputs\n\n${sectionList(draft.inputs, "Ask for the minimum missing context needed to proceed.")}\n\n## Workflow\n\n${numberedList(draft.workflow, ["Clarify the user's goal and available inputs.", "Gather the relevant context.", "Execute the workflow carefully.", "Return the requested artifact with caveats."])}\n${referenceSection(draft, "Reference Materials")}\n## Output\n\n${draft.output || "Return a complete, user-ready result in the format requested by the user."}\n\n## Guardrails\n\n${sectionList(draft.guardrails, "Be explicit about assumptions, risks, and verification gaps.")}\n`;
}

function generateDesignMarkdown(draft: Draft) {
  const name = slugify(draft.title, "custom-design");
  const description =
    draft.summary || `Design a clear experience for ${draft.title}.`;

  return `---\nname: ${name}\ndescription: ${description}\ntype: design\n---\n\n# ${draft.title || "Custom Design"}\n\n## Design Goal\n\n${draft.purpose || "Define the product outcome this design should support."}\n\n## Users And Context\n\n${draft.audience || "Describe the primary users, use case, and operating context."}\n\n## When This Design Applies\n\n${sectionList(draft.triggers, "Use this design brief when the requested experience matches this product goal.")}\n\n## Required Inputs\n\n${sectionList(draft.inputs, "Gather the minimum content, data, constraints, and brand context needed to design responsibly.")}\n\n## Design Workflow\n\n${numberedList(draft.workflow, ["Clarify the user goal and product constraints.", "Define information hierarchy and core flows.", "Specify components, states, and responsive behavior.", "Document implementation notes and open questions."])}\n${referenceSection(draft, "Visual System And References")}\n## Deliverable\n\n${draft.output || "Return a complete design brief with layout, components, states, visual direction, and implementation notes."}\n\n## Constraints And Guardrails\n\n${sectionList(draft.guardrails, "Make assumptions explicit and keep visual decisions tied to the user's workflow.")}\n`;
}

function generateMarkdown(mode: Mode, draft: Draft) {
  return mode === "skill" ? generateSkillMarkdown(draft) : generateDesignMarkdown(draft);
}

function validationChecks(mode: Mode, draft: Draft): ValidationCheck[] {
  const config = modeConfigs[mode];
  return [
    {
      label: `${config.fileName} description`,
      passed: Boolean(draft.summary.trim()),
      detail:
        mode === "skill"
          ? "Add a one-line description so agents know when the skill applies."
          : "Add a one-line design brief so readers understand the intended experience.",
    },
    {
      label: mode === "skill" ? "Trigger conditions" : "Use context",
      passed: listLines(draft.triggers).length >= 2,
      detail:
        mode === "skill"
          ? "List at least two situations where this skill should be used."
          : "List at least two situations where this design brief applies.",
    },
    {
      label: "Required inputs",
      passed: listLines(draft.inputs).length >= 2,
      detail:
        mode === "skill"
          ? "Name the context an agent should gather before starting."
          : "Name the content, constraints, and product context needed before design starts.",
    },
    {
      label: mode === "skill" ? "Workflow depth" : "Design process depth",
      passed: listLines(draft.workflow).length >= 4,
      detail:
        mode === "skill"
          ? "Use at least four ordered steps so execution is repeatable."
          : "Use at least four ordered steps covering hierarchy, states, and implementation notes.",
    },
    {
      label: mode === "skill" ? "Expected output" : "Expected deliverable",
      passed: Boolean(draft.output.trim()),
      detail:
        mode === "skill"
          ? "Tell the agent what final artifact or answer to return."
          : "Define the final design artifact the reader should produce.",
    },
    {
      label: mode === "skill" ? "Guardrails" : "Design constraints",
      passed: Boolean(draft.guardrails.trim()),
      detail:
        mode === "skill"
          ? "Add constraints that prevent overreach, guessing, or unsafe behavior."
          : "Add constraints that prevent generic, inaccessible, or off-brief design choices.",
    },
    {
      label: mode === "skill" ? "Reference material" : "Visual references",
      passed: Boolean(draft.materials.trim()),
      detail:
        mode === "skill"
          ? "Optional but recommended: include examples, code, or source notes."
          : "Optional but recommended: include visual system notes, references, or CSS/component examples.",
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

function firstSection(markdown: string, headings: string[]) {
  for (const heading of headings) {
    const value = extractSection(markdown, heading);
    if (value) return value;
  }
  return "";
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

function parseMarkdown(markdown: string, mode: Mode): Draft {
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---/);
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? `Imported ${modeConfigs[mode].noun}`;
  const description =
    frontmatter?.[1]
      ?.match(/^description:\s*(.+)$/m)?.[1]
      ?.replace(/^["']|["']$/g, "")
      .trim() ?? "";
  const materials = firstSection(markdown, [
    "Reference Materials",
    "Visual System And References",
  ]).replace(/^```[a-z]*\n?|```$/g, "");

  return {
    id: `${mode}-${Date.now()}`,
    title,
    summary: description,
    purpose: firstSection(markdown, ["Purpose", "Design Goal"]),
    audience: firstSection(markdown, ["Audience", "Users And Context"]),
    triggers: normalizeListSection(
      firstSection(markdown, ["When To Use", "When This Design Applies"]),
    ),
    inputs: normalizeListSection(firstSection(markdown, ["Required Inputs"])),
    workflow: normalizeWorkflow(firstSection(markdown, ["Workflow", "Design Workflow"])),
    materials: materials.trim(),
    output: firstSection(markdown, ["Output", "Deliverable"]),
    guardrails: normalizeListSection(
      firstSection(markdown, ["Guardrails", "Constraints And Guardrails"]),
    ),
  };
}

function suggestFromIdea(mode: Mode, idea: string, current: Draft): Draft {
  const clean = idea.trim();
  if (!clean) {
    return current;
  }

  const titleWords = clean
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 3);
  const untouchedTitle =
    current.title === "New Skill" ||
    current.title === "New Design" ||
    !current.title.trim();
  const title =
    !untouchedTitle
      ? current.title
      : titleWords.length
        ? titleWords.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ")
        : modeConfigs[mode].noun;

  if (mode === "skill") {
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

  return {
    ...current,
    title,
    summary:
      current.summary ||
      `Turn a ${title.toLowerCase()} idea into a clear implementation-ready design brief.`,
    purpose:
      current.purpose ||
      `Define a usable, accessible, and visually coherent experience for ${clean}.`,
    audience:
      current.audience ||
      "Product teams, designers, and engineers who need a shared design direction before implementation.",
    triggers:
      current.triggers ||
      `User asks for a design brief\nUser describes a product experience or UI\nUser needs layout, interaction, and visual guidance before build`,
    inputs:
      current.inputs ||
      "Target user and job to be done\nPrimary content or data\nBrand or visual constraints\nRequired screens, sections, or states",
    workflow:
      current.workflow ||
      "Clarify the user goal and product constraints\nDefine information hierarchy and primary flows\nSpecify components, states, and responsive behavior\nDescribe visual system and accessibility requirements\nList implementation notes and open questions",
    output:
      current.output ||
      "A complete DESIGN.md brief with layout, components, states, visual direction, and implementation notes.",
    guardrails:
      current.guardrails ||
      "Do not invent unavailable product facts or metrics.\nKeep design choices tied to the user workflow.\nCall out assumptions and unresolved content gaps.",
  };
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<Mode>("skill");
  const [draftsByMode, setDraftsByMode] = useState<Record<Mode, Draft[]>>(starterDrafts);
  const [selectedIds, setSelectedIds] = useState<Record<Mode, string>>({
    skill: starterDrafts.skill[0].id,
    design: starterDrafts.design[0].id,
  });
  const [idea, setIdea] = useState("");
  const [copied, setCopied] = useState("");

  const config = modeConfigs[mode];
  const templates = templatesByMode[mode];
  const drafts = draftsByMode[mode];
  const selectedId = selectedIds[mode];
  const selected = drafts.find((draft) => draft.id === selectedId) ?? drafts[0];

  useEffect(() => {
    const hydration = window.setTimeout(() => {
      const legacy = window.localStorage.getItem("skillmaker-drafts");
      const nextDrafts: Record<Mode, Draft[]> = { ...starterDrafts };
      const nextSelected: Record<Mode, string> = {
        skill: starterDrafts.skill[0].id,
        design: starterDrafts.design[0].id,
      };
      let foundSavedDrafts = false;

      (["skill", "design"] as Mode[]).forEach((draftMode) => {
        const saved = window.localStorage.getItem(modeConfigs[draftMode].storageKey);
        if (!saved && draftMode === "skill" && legacy) {
          try {
            const parsed = JSON.parse(legacy) as Draft[];
            if (Array.isArray(parsed) && parsed.length) {
              nextDrafts.skill = parsed;
              nextSelected.skill = parsed[0].id;
              foundSavedDrafts = true;
            }
          } catch {
            window.localStorage.removeItem("skillmaker-drafts");
          }
          return;
        }

        if (!saved) return;
        try {
          const parsed = JSON.parse(saved) as Draft[];
          if (Array.isArray(parsed) && parsed.length) {
            nextDrafts[draftMode] = parsed;
            nextSelected[draftMode] = parsed[0].id;
            foundSavedDrafts = true;
          }
        } catch {
          window.localStorage.removeItem(modeConfigs[draftMode].storageKey);
        }
      });

      if (foundSavedDrafts) {
        setDraftsByMode(nextDrafts);
        setSelectedIds(nextSelected);
      }
    }, 0);

    return () => window.clearTimeout(hydration);
  }, []);

  useEffect(() => {
    (["skill", "design"] as Mode[]).forEach((draftMode) => {
      window.localStorage.setItem(
        modeConfigs[draftMode].storageKey,
        JSON.stringify(draftsByMode[draftMode]),
      );
    });
  }, [draftsByMode]);

  const markdown = useMemo(() => generateMarkdown(mode, selected), [mode, selected]);
  const checks = useMemo(() => validationChecks(mode, selected), [mode, selected]);
  const quality = checks.filter((check) => check.passed).length;
  const addedTemplateSlugs = useMemo(
    () => new Set(drafts.map((draft) => slugify(draft.title))),
    [drafts],
  );

  function setCurrentDrafts(updater: (current: Draft[]) => Draft[]) {
    setDraftsByMode((current) => ({
      ...current,
      [mode]: updater(current[mode]),
    }));
  }

  function setCurrentSelected(id: string) {
    setSelectedIds((current) => ({ ...current, [mode]: id }));
  }

  function updateSelected(patch: Partial<Draft>) {
    setCurrentDrafts((current) =>
      current.map((draft) =>
        draft.id === selected.id ? { ...draft, ...patch } : draft,
      ),
    );
  }

  function addDraft() {
    const next = blankDraft(mode);
    setCurrentDrafts((current) => [next, ...current]);
    setCurrentSelected(next.id);
    setIdea("");
  }

  function addTemplate(template: Draft) {
    setCurrentDrafts((current) => {
      const existing = current.find(
        (draft) => slugify(draft.title) === slugify(template.title),
      );
      if (existing) {
        setCurrentSelected(existing.id);
        return current;
      }

      const next = cloneDraft(template);
      setCurrentSelected(next.id);
      return [next, ...current];
    });
    setIdea("");
  }

  function removeDuplicateDrafts() {
    const seen = new Set<string>();
    const deduped = drafts.filter((draft) => {
      const slug = slugify(draft.title);
      if (seen.has(slug)) {
        return false;
      }
      seen.add(slug);
      return true;
    });

    const nextDrafts = deduped.length ? deduped : [blankDraft(mode)];
    setCurrentDrafts(() => nextDrafts);
    if (!nextDrafts.some((draft) => draft.id === selectedId)) {
      setCurrentSelected(nextDrafts[0].id);
    }
  }

  function duplicateDraft() {
    const copy = cloneDraft(selected, `${selected.title} Copy`);
    setCurrentDrafts((current) => [copy, ...current]);
    setCurrentSelected(copy.id);
  }

  function deleteDraft() {
    deleteDraftById(selected.id);
  }

  function deleteDraftById(id: string) {
    if (drafts.length === 1) {
      const next = blankDraft(mode);
      setCurrentDrafts(() => [next]);
      setCurrentSelected(next.id);
      return;
    }
    const remaining = drafts.filter((draft) => draft.id !== id);
    setCurrentDrafts(() => remaining);
    if (selectedId === id) {
      setCurrentSelected(remaining[0].id);
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
    const extension = mode === "skill" ? "skill" : "design";
    downloadText(markdown, `${slugify(selected.title)}.${extension}.md`);
  }

  function downloadBundle() {
    const bundle = drafts
      .map(
        (draft) =>
          `<!-- ${slugify(draft.title)}/${config.fileName} -->\n\n${generateMarkdown(mode, draft)}`,
      )
      .join("\n\n---\n\n");
    downloadText(bundle, `skillmaker-${mode}-bundle.md`);
  }

  async function importDraft(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const importMode: Mode =
      /type:\s*design/i.test(text) ||
      /## Design Goal|## Users And Context|## Design Workflow/i.test(text) ||
      file.name.toLowerCase().includes("design")
        ? "design"
        : "skill";
    const imported = parseMarkdown(text, importMode);
    setDraftsByMode((current) => ({
      ...current,
      [importMode]: [imported, ...current[importMode]],
    }));
    setSelectedIds((current) => ({ ...current, [importMode]: imported.id }));
    setMode(importMode);
    event.target.value = "";
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setIdea("");
    setCopied("");
  }

  const installPrompt = `Use this ${config.fileName} in an agent workspace:\n\n1. Create a folder named ${slugify(selected.title)}.\n2. Save the following content as ${slugify(selected.title)}/${config.fileName}.\n3. Restart or reload the agent so it can discover the document.\n\n${markdown}`;

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label={`${config.noun} drafts`}>
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            S
          </div>
          <div>
            <p className="eyebrow">Open-source document builder</p>
            <h1>SkillMaker</h1>
          </div>
        </div>

        <div className="mode-toggle" aria-label="Document type">
          <button
            className={mode === "skill" ? "active" : ""}
            type="button"
            onClick={() => switchMode("skill")}
          >
            SKILL.md
          </button>
          <button
            className={mode === "design" ? "active" : ""}
            type="button"
            onClick={() => switchMode("design")}
          >
            DESIGN.md
          </button>
        </div>

        <button className="primary-action" type="button" onClick={addDraft}>
          <span aria-hidden="true">+</span>
          New {config.noun}
        </button>

        <input
          ref={fileInputRef}
          className="file-input"
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          onChange={importDraft}
          aria-label={`Import an existing ${config.fileName} file`}
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
                  disabled={isAdded}
                  aria-label={
                    isAdded
                      ? `${template.title} template already added`
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
          {drafts.map((draft) => (
            <div
              className={`skill-row ${draft.id === selected.id ? "active" : ""}`}
              key={draft.id}
            >
              <button
                className="skill-card"
                onClick={() => setCurrentSelected(draft.id)}
                type="button"
              >
                <span className="skill-icon" aria-hidden="true">
                  #
                </span>
                <span>
                  <strong>{draft.title || `Untitled ${config.noun}`}</strong>
                  <small>{draft.summary || "No summary yet"}</small>
                </span>
              </button>
              <button
                className="skill-delete"
                type="button"
                onClick={() => deleteDraftById(draft.id)}
                aria-label={`Delete ${draft.title || `untitled ${config.noun.toLowerCase()}`}`}
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
          <button type="button" onClick={removeDuplicateDrafts}>
            Dedupe
          </button>
          <button type="button" onClick={downloadBundle}>
            Export All
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{config.eyebrow}</p>
            <h2>{config.headline}</h2>
          </div>
          <div className="topbar-actions">
            <button type="button" onClick={deleteDraft}>
              Delete
            </button>
            <button type="button" onClick={duplicateDraft}>
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
          <section className="editor-panel" aria-label={`${config.noun} information`}>
            <div className="assist-box">
              <label htmlFor="idea">{config.ideaLabel}</label>
              <textarea
                id="idea"
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                placeholder={config.ideaPlaceholder}
              />
              <div className="utility-actions">
                <button
                  className="primary-action"
                  type="button"
                  onClick={() => updateSelected(suggestFromIdea(mode, idea, selected))}
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
                <span>{config.titleLabel}</span>
                <input
                  value={selected.title}
                  onChange={(event) => updateSelected({ title: event.target.value })}
                />
              </label>
              <label>
                <span>{config.summaryLabel}</span>
                <input
                  value={selected.summary}
                  onChange={(event) => updateSelected({ summary: event.target.value })}
                />
              </label>
              <label>
                <span>{config.purposeLabel}</span>
                <textarea
                  value={selected.purpose}
                  onChange={(event) => updateSelected({ purpose: event.target.value })}
                />
              </label>
              <label>
                <span>{config.audienceLabel}</span>
                <textarea
                  value={selected.audience}
                  onChange={(event) => updateSelected({ audience: event.target.value })}
                />
              </label>
              <label>
                <span>{config.triggersLabel}</span>
                <textarea
                  value={selected.triggers}
                  onChange={(event) => updateSelected({ triggers: event.target.value })}
                />
              </label>
              <label>
                <span>{config.inputsLabel}</span>
                <textarea
                  value={selected.inputs}
                  onChange={(event) => updateSelected({ inputs: event.target.value })}
                />
              </label>
            </div>
          </section>

          <section className="process-panel" aria-label={`How the ${config.noun.toLowerCase()} works`}>
            <div className="panel-heading">
              <p className="eyebrow">How it works</p>
              <h3>Workflow, materials, and checks</h3>
            </div>

            <label>
              <span>{config.workflowLabel}</span>
              <textarea
                className="tall-input"
                value={selected.workflow}
                onChange={(event) => updateSelected({ workflow: event.target.value })}
              />
            </label>
            <label>
              <span>{config.materialsLabel}</span>
              <textarea
                className="code-input"
                value={selected.materials}
                onChange={(event) => updateSelected({ materials: event.target.value })}
              />
            </label>
            <label>
              <span>{config.outputLabel}</span>
              <textarea
                value={selected.output}
                onChange={(event) => updateSelected({ output: event.target.value })}
              />
            </label>
            <label>
              <span>{config.guardrailsLabel}</span>
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
                aria-label={`${config.noun} readiness`}
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

          <section className="preview-panel" aria-label={`Generated ${config.fileName} markdown`}>
            <div className="panel-heading preview-heading">
              <div>
                <p className="eyebrow">Generated result</p>
                <h3>{config.fileName} preview</h3>
              </div>
              <span className="file-pill">{slugify(selected.title)}/{config.fileName}</span>
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
