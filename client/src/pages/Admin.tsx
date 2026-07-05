import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { StoryProfile } from "@/lib/types";
import { Badge, Button, Card, CardBody, Input } from "@/components/ui";

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

/** Password gate for the operator pipeline. */
function LoginGate({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login() {
    setBusy(true);
    setError("");
    try {
      await apiRequest("/api/auth/login", { body: { password } });
      queryClient.invalidateQueries();
    } catch (e) {
      setError((e as Error).message || "login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-5 py-16">
      <div className="space-y-2 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
          Operators only
        </p>
        <h1 className="font-serif text-2xl tracking-tight text-foreground">Client pipeline</h1>
        <p className="text-sm text-muted-foreground">
          {configured
            ? "This area holds client interviews and profiles."
            : "Locked: set CITED_ADMIN_PASSWORD on the server, then log in here."}
        </p>
      </div>
      <Card>
        <CardBody className="space-y-3">
          <Input
            type="password"
            placeholder="Operator password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && password && login()}
            autoFocus
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={login} disabled={busy || !password} className="w-full">
            {busy ? "Checking…" : "Log in"}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

export function Admin() {
  const { data: auth, isLoading: authLoading } = useQuery<{ operator: boolean; configured: boolean }>({
    queryKey: ["/api/auth/me"],
  });
  const { data, isLoading } = useQuery<{ creators: CohortRow[] }>({
    queryKey: ["/api/admin/cohort"],
    enabled: !!auth?.operator,
  });

  async function toggleShortlist(id: string, shortlisted: boolean) {
    await apiRequest("/api/admin/shortlist", { body: { creatorId: id, shortlisted: !shortlisted } });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/cohort"] });
  }

  async function logout() {
    await apiRequest("/api/auth/logout", { body: {} });
    queryClient.invalidateQueries();
  }

  if (authLoading) return <p className="text-muted-foreground">Checking access…</p>;
  if (!auth?.operator) return <LoginGate configured={!!auth?.configured} />;
  if (isLoading) return <p className="text-muted-foreground">Loading cohort…</p>;
  const creators = data?.creators ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold tracking-tight">Client pipeline</h1>
        {auth.configured && (
          <Button variant="ghost" className="text-xs" onClick={logout}>
            Log out
          </Button>
        )}
      </div>
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
