import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { StoryProfile } from "@/lib/types";
import { Badge, Button, Card, CardBody } from "@/components/ui";

interface CohortRow {
  id: string;
  name: string;
  handle?: string | null;
  niche?: string | null;
  status: string;
  approved: boolean;
  shortlisted: boolean;
  turnsCount: number;
  profile: StoryProfile | null;
}

/** Pipeline stage, so audit leads and interview clients don't blur together. */
function stageOf(c: CohortRow): { label: string; tone: "muted" | "primary" | "accent" } {
  if (c.profile) return { label: c.approved ? "approved" : "profile ready", tone: "accent" };
  if (c.turnsCount > 0) return { label: "interview in progress", tone: "primary" };
  return { label: "audit lead", tone: "muted" };
}

export function Admin() {
  const { data, isLoading } = useQuery<{ creators: CohortRow[] }>({ queryKey: ["/api/admin/cohort"] });

  async function toggleShortlist(id: string, shortlisted: boolean) {
    await apiRequest("/api/admin/shortlist", { body: { creatorId: id, shortlisted: !shortlisted } });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/cohort"] });
  }

  if (isLoading) return <p className="text-muted-foreground">Loading cohort…</p>;
  const creators = data?.creators ?? [];

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-bold tracking-tight">Client pipeline</h1>
      {creators.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No clients yet. Audit requests land here, and{" "}
          <Link href="/intake" className="text-primary">the narrative interview</Link> adds sprint
          clients.
        </p>
      )}
      <div className="grid gap-3">
        {creators.map((c) => (
          <Card key={c.id}>
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{c.name}</span>
                  <Badge tone="muted">{c.niche}</Badge>
                  <Badge tone={stageOf(c).tone}>{stageOf(c).label}</Badge>
                  {c.profile?.lowSpecificity && <Badge tone="destructive">low specificity</Badge>}
                  {typeof c.profile?.fitScore === "number" && (
                    <Badge tone="primary">fit {c.profile.fitScore}</Badge>
                  )}
                </div>
                {c.profile?.edge && (
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">{c.profile.edge}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={c.shortlisted ? "primary" : "secondary"}
                  onClick={() => toggleShortlist(c.id, c.shortlisted)}
                >
                  {c.shortlisted ? "★ Shortlisted" : "☆ Shortlist"}
                </Button>
                <Link href={`/profile/${c.id}`}>
                  <Button variant="ghost">View</Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
