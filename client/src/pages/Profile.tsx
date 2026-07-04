import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CreatorView } from "@/lib/types";
import { ProfileView } from "@/components/ProfileView";
import { downloadMarkdown, profileToMarkdown } from "@/lib/exportProfile";
import { Badge, Button, Card, CardBody, Input } from "@/components/ui";

export function Profile() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery<CreatorView>({ queryKey: [`/api/creators/${id}`] });
  const [receipt, setReceipt] = useState("");
  const [brandFacing, setBrandFacing] = useState(false);

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!data?.profile) return <p className="text-muted-foreground">No profile yet.</p>;

  async function approve() {
    await apiRequest("/api/approve", { body: { creatorId: id } });
    queryClient.invalidateQueries({ queryKey: [`/api/creators/${id}`] });
  }

  async function addReceipt() {
    if (!receipt.trim()) return;
    const proofs = [...(data!.proofs || []), { claim: receipt.trim(), status: "self-reported" as const }];
    await apiRequest("/api/proofs", { body: { creatorId: id, proofs } });
    setReceipt("");
    queryClient.invalidateQueries({ queryKey: [`/api/creators/${id}`] });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{data.name}</h1>
          <p className="text-sm text-muted-foreground">
            {data.handle} · {data.niche} · engine <span className="font-mono">{data.engine}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              downloadMarkdown(
                `cited-profile-${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`,
                profileToMarkdown(data.name, data.profile!),
              )
            }
          >
            ↓ Export Markdown
          </Button>
          <Button variant="ghost" onClick={() => setBrandFacing((b) => !b)}>
            {brandFacing ? "Internal view" : "Client-facing view"}
          </Button>
          {data.approved ? <Badge tone="accent">approved</Badge> : <Button onClick={approve}>Approve</Button>}
        </div>
      </div>

      {/* Deferred receipts: strengthen the profile after generation, never mid-flow. */}
      {data.profile.fitScore < 75 && (
        <Card>
          <CardBody className="space-y-2">
            <p className="text-sm">
              Want to lift your fit score above {data.profile.fitScore}? Add a light receipt for a
              key number — a screenshot link, certificate, or dashboard reference.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. link to my UESCA certificate"
                value={receipt}
                onChange={(e) => setReceipt(e.target.value)}
              />
              <Button onClick={addReceipt} disabled={!receipt.trim()}>
                Add receipt
              </Button>
            </div>
            {data.proofs.length > 0 && (
              <ul className="list-disc pl-5 text-xs text-muted-foreground">
                {data.proofs.map((p, i) => (
                  <li key={i}>
                    {p.claim} — <span className="font-mono">{p.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      )}

      <ProfileView profile={data.profile} brandFacing={brandFacing} />
    </div>
  );
}
