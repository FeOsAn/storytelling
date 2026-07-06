import type { SprintPack, StoryProfile } from "@shared/schema";

/** Serialize a profile to Markdown — the deliverable has to leave the app. */
export function profileToMarkdown(name: string, p: StoryProfile): string {
  const lines: string[] = [
    `# ${name} — Narrative Profile (Cited)`,
    "",
    `**Archetype:** ${p.archetype}`,
    `**Fit score:** ${p.fitScore} — ${p.fitRationale}`,
    p.lowSpecificity ? `> ⚠ Low specificity: ${p.specificityNote ?? "answers stayed generic"}` : "",
    "",
    `## Positioning`,
    p.positioningLine,
    "",
    `## The edge`,
    p.edge,
    "",
  ];
  if (p.entityLine) lines.push(`## Entity line (say it verbatim, everywhere)`, p.entityLine, "");
  if (p.targetQueries?.length) {
    lines.push(`## Target queries`);
    for (const q of p.targetQueries) lines.push(`- **[${q.tier}]** ${q.query}`);
    lines.push("");
  }
  if (p.plantPlan?.length) {
    lines.push(`## First placements`);
    p.plantPlan.forEach((x, i) => lines.push(`${i + 1}. ${x}`));
    lines.push("");
  }
  lines.push(
    `## Origin story`, p.originStory, "",
    `## Transformation arc`, p.transformationArc, "",
    `## Audience`, p.audienceRelationship, "",
    `## Values`, ...p.values.map((v) => `- ${v}`), "",
    `## Anti-values`, ...p.antiValues.map((v) => `- ${v}`), "",
    `## Hard-no categories`, ...p.hardNoCategories.map((v) => `- ${v}`), "",
    `## Proof points`,
    ...p.proofPoints.map((x) => `- ${x.claim}: ${x.evidence}${x.status ? ` _(${x.status})_` : ""}`),
    "",
    `## Client-fit map`,
    ...p.brandFitMap.map((b) => `- **${b.category}** (${b.congruence}): ${b.rationale}`),
    "",
    `## Campaign angles`,
    ...p.campaignAngles.map((c) => `- **${c.title}** — ${c.premise} _(${c.format})_`),
    "",
    `## Lead with this`, ...p.leadWithThis.map((v) => `- ${v}`), "",
    `## Never say this`, ...p.neverSayThis.map((v) => `- ${v}`), "",
    `## Bio`, p.profileBio, "",
    `## Outbound narrative`, p.brandNarrative, "",
    `## Pitch — DM`, "```", p.pitchDM, "```", "",
    `## Pitch — email`, "```", p.pitchEmail, "```", "",
  );
  return lines.filter((l) => l !== undefined).join("\n");
}

/** Serialize the Sprint Pack — appended to the profile export when present. */
export function packToMarkdown(pack: SprintPack): string {
  const lines: string[] = [
    "",
    "---",
    "",
    `# The Sprint Pack _(generated ${pack.generatedAt.slice(0, 10)})_`,
    "",
  ];
  if (pack.targets?.length) {
    lines.push(`## Target list — pages the engines cite today`);
    for (const t of pack.targets.slice(0, 15)) lines.push(`- ${t.citations}× ${t.url}`);
    lines.push("");
  }
  if (pack.landscape?.length) {
    lines.push(`## Who the engines recommend, per query`);
    for (const e of pack.landscape) {
      lines.push(`- **${e.query}**${e.recommended?.length ? ` → ${e.recommended.join(", ")}` : ""}`);
    }
    lines.push("");
  }
  lines.push(`## Asset 1 — comparison page`, `### ${pack.comparisonPage.title}`, "", pack.comparisonPage.markdown, "");
  if (pack.faq.length) {
    lines.push(`## Asset 2 — answer-shaped FAQ`);
    for (const f of pack.faq) lines.push(`**Q: ${f.q}**`, "", f.a, "");
  }
  if (pack.communityAnswers.length) {
    lines.push(`## Asset 3 — community answers (post under your real name, affiliation stated)`);
    for (const c of pack.communityAnswers) lines.push(`_${c.context}_`, "", c.draft, "");
  }
  if (pack.outreachEmails.length) {
    lines.push(`## Asset 4 — placement outreach`);
    for (const o of pack.outreachEmails) {
      lines.push(`**To:** ${o.target}`, `**Subject:** ${o.subject}`, "", o.body, "");
    }
  }
  lines.push(
    `## Asset 5 — directory entries`,
    `**Short:** ${pack.directoryEntries.short}`,
    "",
    `**Long:** ${pack.directoryEntries.long}`,
    "",
  );
  return lines.join("\n");
}

export function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
