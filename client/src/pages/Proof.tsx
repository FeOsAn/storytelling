import { Link } from "wouter";
import { Button, Card, CardBody } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

/**
 * Proof page. Rule: nothing on this page is ever manufactured. Case studies
 * appear only when complete, protocol attached. Until then, Client #0 — Cited
 * itself, run in public — is the proof-of-method. Placeholders are explicit
 * and get replaced with real baseline numbers, never invented ones.
 */
export function Proof() {
  return (
    <div className="mx-auto max-w-3xl space-y-12 py-4">
      <Reveal>
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
      </Reveal>

      <Reveal>
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
            <div className="space-y-3 rounded-md bg-white/[0.03] p-4 shadow-[inset_0_0_0_1px_rgba(190,235,210,0.1)]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium">Baseline #1 — 4 July 2026</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  Claude (claude-sonnet-5, API) · 5 queries × 3 runs
                </p>
              </div>
              <div className="space-y-1.5">
                {[
                  ["Cited (us)", 0],
                  ["Profound", 1],
                  ["Scrunch", 0],
                  ["Evertune", 0],
                  ["Writesonic", 0],
                ].map(([nm, v]) => (
                  <div key={nm as string} className="grid grid-cols-[8rem_1fr_2.6rem] items-center gap-2.5">
                    <span className={"truncate text-xs " + (nm === "Cited (us)" ? "font-semibold" : "text-muted-foreground")}>
                      {nm}
                    </span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className={"h-full rounded-full " + ((v as number) > 0 ? "bg-primary" : "bg-white/20")}
                        style={{ width: `${Math.max(3, ((v as number) / 15) * 100)}%` }}
                      />
                    </div>
                    <span className="text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                      {v as number}/15
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Zero. That's the honest starting line — watch this chart on re-measure cadence.
                Full disclosure from run #1: our tool initially credited us 3 mentions, because
                "cited" is an English word and our matcher was case-insensitive. All three were
                phrases like "well-cited case studies". We fixed the tool and kept the zero —
                that choice is the methodology. API-based run; consumer-app protocol runs follow
                per the{" "}
                <Link href="/methodology" className="text-primary hover:underline">
                  measurement caveat
                </Link>
                .
              </p>
            </div>
          </CardBody>
        </Card>
      </section>
      </Reveal>

      <Reveal>
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
      </Reveal>

      <Reveal>
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
      </Reveal>

      <Reveal>
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
      </Reveal>
    </div>
  );
}
