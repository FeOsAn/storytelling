import type { StoryProfile } from "@shared/schema";

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

export function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
