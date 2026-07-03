import type { StoryProfile } from "@/lib/types";
import { Badge, Card, CardBody, Section } from "@/components/ui";

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
            <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{profile.pitchDM}</p>
          </Section>
          <Section title="Pitch — email">
            <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{profile.pitchEmail}</p>
          </Section>
        </CardBody>
      </Card>
    </div>
  );
}
