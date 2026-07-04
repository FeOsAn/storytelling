import { useState } from "react";
import type { StoryProfile } from "@/lib/types";
import { Badge, Button, Card, CardBody, Section } from "@/components/ui";

/** Copy-to-clipboard with inline confirmation — profiles are made to be reused. */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      className="px-2.5 py-1 text-xs"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard unavailable — no-op */
        }
      }}
    >
      {copied ? "✓ Copied" : label}
    </Button>
  );
}

const TIER_LABEL: Record<string, string> = {
  head: "Head — the long game",
  intent: "Buyer intent — wins first",
  comparison: "Comparison",
};

/** Renders a generated StoryProfile — the commercial deliverable. */
export function ProfileView({
  profile,
  brandFacing = false,
}: {
  profile: StoryProfile;
  /** Brand-facing view surfaces neverSayThis as a trust signal (roadmap #4). */
  brandFacing?: boolean;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">{profile.archetype}</Badge>
            <Badge tone={profile.fitScore >= 75 ? "accent" : "muted"}>fit score {profile.fitScore}</Badge>
            {profile.lowSpecificity && <Badge tone="destructive">low specificity</Badge>}
          </div>
          <p className="text-lg font-semibold">{profile.positioningLine}</p>
          {profile.fitRationale && (
            <p className="text-sm text-muted-foreground">{profile.fitRationale}</p>
          )}
          {profile.lowSpecificity && profile.specificityNote && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {profile.specificityNote}
            </p>
          )}
        </CardBody>
      </Card>

      {/* Marketing playbook — what the whole team aims at. */}
      {(profile.entityLine || profile.targetQueries?.length || profile.plantPlan?.length) && (
        <Card className="shadow-[inset_0_1px_0_rgba(214,246,229,0.1),inset_0_0_0_1px_rgba(63,214,143,0.3),0_20px_50px_rgba(0,0,0,0.45)]">
          <CardBody className="space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-serif text-xl tracking-tight">The marketing playbook</h2>
              <Badge tone="primary">what everything aims at</Badge>
            </div>

            {profile.entityLine && (
              <Section title="The entity line — say it verbatim, everywhere">
                <div className="flex items-start justify-between gap-3 rounded-lg bg-primary/[0.07] p-3">
                  <p className="font-serif text-lg leading-snug">{profile.entityLine}</p>
                  <CopyButton text={profile.entityLine} />
                </div>
              </Section>
            )}

            {profile.targetQueries && profile.targetQueries.length > 0 && (
              <Section title="The queries this narrative is built to win">
                <div className="space-y-2.5">
                  {(["intent", "comparison", "head"] as const).map((tier) => {
                    const qs = profile.targetQueries!.filter((q) => q.tier === tier);
                    if (qs.length === 0) return null;
                    return (
                      <div key={tier}>
                        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                          {TIER_LABEL[tier]}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {qs.map((q, i) => (
                            <span
                              key={i}
                              className="rounded-md bg-muted px-2.5 py-1 font-mono text-xs"
                            >
                              {q.query}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {profile.plantPlan && profile.plantPlan.length > 0 && (
              <Section title="First placements — where this story goes next">
                <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                  {profile.plantPlan.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ol>
              </Section>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="space-y-5">
          <Section title="The edge">
            <p className="text-base">{profile.edge}</p>
          </Section>

          {profile.leadWithThis.length > 0 && (
            <Section title="Lead with this">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {profile.leadWithThis.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </Section>
          )}

          {profile.neverSayThis.length > 0 && (
            <Section title={brandFacing ? "Guardrails (why you can trust this outreach)" : "Never say this"}>
              <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
                {profile.neverSayThis.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </Section>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardBody className="space-y-4">
            <Section title="Origin story">
              <p className="text-sm">{profile.originStory}</p>
            </Section>
            <Section title="Transformation arc">
              <p className="text-sm">{profile.transformationArc}</p>
            </Section>
            <Section title="Audience relationship">
              <p className="text-sm">{profile.audienceRelationship}</p>
            </Section>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <Section title="Values">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {profile.values.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </Section>
            <Section title="Anti-values">
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {profile.antiValues.map((v, i) => (
                  <li key={i}>{v}</li>
                ))}
              </ul>
            </Section>
            <Section title="Hard-no categories">
              <div className="flex flex-wrap gap-2">
                {profile.hardNoCategories.map((h, i) => (
                  <Badge key={i} tone="destructive">
                    {h}
                  </Badge>
                ))}
              </div>
            </Section>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <Section title="Proof points">
            <ul className="space-y-2 text-sm">
              {profile.proofPoints.map((p, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <span>{p.evidence}</span>
                  {p.status && <Badge tone={p.status === "verified" ? "accent" : "muted"}>{p.status}</Badge>}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Client-fit map">
            <div className="grid gap-2 sm:grid-cols-2">
              {profile.brandFitMap.map((b, i) => (
                <div key={i} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{b.category}</span>
                    <Badge tone={b.congruence === "high" ? "accent" : "muted"}>{b.congruence}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{b.rationale}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Campaign angles">
            <ul className="space-y-2 text-sm">
              {profile.campaignAngles.map((c, i) => (
                <li key={i}>
                  <span className="font-medium">{c.title}</span> — {c.premise}{" "}
                  <span className="text-muted-foreground">({c.format})</span>
                </li>
              ))}
            </ul>
          </Section>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <Section title="Bio">
            <p className="text-sm">{profile.profileBio}</p>
          </Section>
          <Section title="Outbound narrative">
            <p className="text-sm">{profile.brandNarrative}</p>
          </Section>
          <Section title="Pitch — DM">
            <div className="rounded-md bg-muted p-3">
              <p className="whitespace-pre-wrap text-sm">{profile.pitchDM}</p>
              <div className="mt-2 flex justify-end">
                <CopyButton text={profile.pitchDM} />
              </div>
            </div>
          </Section>
          <Section title="Pitch — email">
            <div className="rounded-md bg-muted p-3">
              <p className="whitespace-pre-wrap text-sm">{profile.pitchEmail}</p>
              <div className="mt-2 flex justify-end">
                <CopyButton text={profile.pitchEmail} />
              </div>
            </div>
          </Section>
        </CardBody>
      </Card>
    </div>
  );
}
