import { Link } from "wouter";
import { Button, Card, CardBody } from "@/components/ui";

/**
 * Proof page. Rule: nothing on this page is ever manufactured. Case studies
 * appear only when complete, protocol attached. Until then, Client #0 — Cited
 * itself, run in public — is the proof-of-method. Placeholders are explicit
 * and get replaced with real baseline numbers, never invented ones.
 */
export function Proof() {
  return (
    <div className="mx-auto max-w-3xl space-y-12 py-4">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Proof · published as it happens
        </p>
        <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
          No logo wall. No "trusted by". Results with the protocol attached — or nothing.
        </h1>
        <p className="text-muted-foreground">
          Every result on this page comes with the full{" "}
          <Link href="/methodology" className="font-medium text-primary hover:underline">
            measurement protocol
          </Link>
          : the frozen query set, the run counts, the variance, the verbatim answers. Case
          studies are published as engagements complete — anonymized until clients approve their
          names. If this page looks sparse, that's what honest looks like early.
        </p>
      </header>

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Client #0 — ourselves, in public
          </p>
          <h2 className="font-serif text-2xl font-bold tracking-tight">
            We run the playbook on Cited first. Live, dated, unedited.
          </h2>
          <p className="text-sm text-muted-foreground">
            The fastest way to judge a method is to watch it applied where failure would be
            public. Our own target queries are below; the baseline and every re-measure publish
            here on protocol cadence — including any run where the needle doesn't move.
          </p>
        </div>
        <Card>
          <CardBody className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                The frozen query set (ours)
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  "who helps firms get recommended by AI assistants?",
                  "best generative engine optimization consultancy for professional-services firms",
                  "how do I show up when buyers ask ChatGPT for the best [vertical] firm?",
                  "AI visibility audit for consultancies — who does this?",
                  "alternatives to doing GEO in-house",
                ].map((q) => (
                  <span
                    key={q}
                    className="rounded-md border border-border bg-muted px-2.5 py-1 font-mono text-xs"
                  >
                    {q}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-dashed border-border p-4 text-center">
              <p className="text-sm font-medium">Baseline: first protocol run pending</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Published here the day it's run — real frequencies, variance, and verbatim
                answers, whatever they say. Re-measures every two weeks after.
              </p>
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold tracking-tight">Category teardowns</h2>
        <p className="text-sm text-muted-foreground">
          The same analysis we sell, done in public on real categories: who the engines recommend,
          why those narratives win, who's invisible. Published on LinkedIn and collected here —
          each one with screenshots and the query list, so you can re-run every claim yourself.
        </p>
        <Card>
          <CardBody className="rounded-md text-center">
            <p className="text-sm font-medium">First teardowns publishing now</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Want your category done next — anonymously or named? That's a free audit with the
              results made public.
            </p>
          </CardBody>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold tracking-tight">Client case studies</h2>
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <p className="text-sm font-medium">None published yet — deliberately.</p>
          <p className="mx-auto mt-1 max-w-lg text-xs text-muted-foreground">
            A case study appears here when an engagement completes: baseline, day-30 and day-60
            share-of-answers with variance, the narrative work that drove it, and what didn't
            work. Anonymized until the client approves their name. We'd rather show you an empty
            section than a fabricated one.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-primary/30 bg-primary/5 px-6 py-8 text-center">
        <h2 className="font-serif text-xl font-bold tracking-tight">
          Be the first case study — with first-cohort pricing to match.
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Early clients get the sprint at founding rates and full veto over what publishes. Start
          with the free audit; decide after you've seen your baseline.
        </p>
        <div className="mt-4">
          <Link href="/audit">
            <Button>Get your free AI Visibility Audit</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
