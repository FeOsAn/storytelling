import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CreatorView } from "@/lib/types";
import { ProfileView } from "@/components/ProfileView";
import { SprintPackView } from "@/components/SprintPackView";
import { downloadMarkdown, packToMarkdown, profileToMarkdown } from "@/lib/exportProfile";
import { Badge, Button, Card, CardBody, Input } from "@/components/ui";

const PACK_STAGES = [
  "Mapping the citation landscape — live web search across the target queries…",
  "Ranking the pages the engines actually cite…",
  "Drafting the comparison page and FAQ in the client's voice…",
  "Drafting community answers, outreach emails and directory entries…",
  "Assembling the pack…",
];

function PackProgress() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const stage = Math.min(Math.floor(elapsed / 25), PACK_STAGES.length - 1);
  return (
    <Card>
      <CardBody className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">{PACK_STAGES[stage]}</p>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{elapsed}s</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-primary/70 transition-all duration-1000"
            style={{ width: `${Math.min(6 + elapsed * 0.75, 96)}%` }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground/70">
          This runs real web searches per query — usually 1–2 minutes. Stay on this page.
        </p>
      </CardBody>
    </Card>
  );
}

export function Profile() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery<CreatorView>({ queryKey: [`/api/creators/${id}`] });
  const { data: auth } = useQuery<{ operator: boolean }>({ queryKey: ["/api/auth/me"] });
  const [receipt, setReceipt] = useState("");
  const [brandFacing, setBrandFacing] = useState(false);
  const [packBusy, setPackBusy] = useState(false);
  const [packError, setPackError] = useState("");
  const packRef = useRef<HTMLDivElement>(null);

  async function generatePack() {
    setPackBusy(true);
    setPackError("");
    try {
      await apiRequest("/api/sprint-pack", { body: { creatorId: id } });
      await queryClient.invalidateQueries({ queryKey: [`/api/creators/${id}`] });
      setTimeout(() => packRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch (err) {
      setPackError((err as Error).message || "Sprint Pack generation failed — try again.");
    } finally {
      setPackBusy(false);
    }
  }

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
                profileToMarkdown(data.name, data.profile!) +
                  (data.sprintPack ? packToMarkdown(data.sprintPack) : ""),
              )
            }
          >
            ↓ Export Markdown
          </Button>
          {auth?.operator && (
            <Button onClick={generatePack} disabled={packBusy}>
              {packBusy ? "Building pack…" : data.sprintPack ? "Rebuild Sprint Pack" : "Generate Sprint Pack"}
            </Button>
          )}
          <Button variant="ghost" onClick={() => setBrandFacing((b) => !b)}>
            {brandFacing ? "Internal view" : "Client-facing view"}
          </Button>
          {data.approved ? (
            <Badge tone="accent">approved</Badge>
          ) : auth?.operator ? (
            <Button onClick={approve}>Approve</Button>
          ) : null}
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

      <div ref={packRef}>
        {packBusy ? (
          <PackProgress />
        ) : (
          <>
            {packError && (
              <Card className="mb-4">
                <CardBody>
                  <p className="text-sm text-destructive">{packError}</p>
                </CardBody>
              </Card>
            )}
            {data.sprintPack && <SprintPackView pack={data.sprintPack} />}
          </>
        )}
      </div>
    </div>
  );
}
