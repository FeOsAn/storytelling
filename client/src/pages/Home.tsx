import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, CardBody } from "@/components/ui";

export function Home() {
  const { data } = useQuery<{ engine: string }>({ queryKey: ["/api/health"] });

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight">
          Creators are more than their follower count.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          StoryFit turns a short, adaptive interview into a unique, brand-ready story profile —
          built around the one thing that wins brand deals: your <strong>edge</strong>, the lived
          contradiction that&apos;s hard to copy.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/intake">
            <Button>Start the interview</Button>
          </Link>
          <Link href="/admin">
            <Button variant="secondary">Browse the cohort</Button>
          </Link>
        </div>
        {data && (
          <p className="text-xs text-muted-foreground">
            Live engine: <span className="font-mono">{data.engine}</span>
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Adaptive 3-interview intake", "Foundation → Edge → Proof & Fit, with voice or typing."],
          ["Live edge confirmation", "We reflect your edge back — confirm, refine, or reject it."],
          ["Brand-safe by design", "Unverified numbers are fenced; we never overclaim."],
        ].map(([t, d]) => (
          <Card key={t}>
            <CardBody>
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </CardBody>
          </Card>
        ))}
      </section>
    </div>
  );
}
