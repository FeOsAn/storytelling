import { Link } from "wouter";
import { Button, Card, CardBody } from "@/components/ui";

/**
 * Marketing landing for the pivot: narrative → AI-answer visibility for expert
 * firms. The scorecard below is an illustrative format example (labelled as
 * such), filled with real query runs per prospect — never fabricated results.
 */

function ShareBar({
  name,
  value,
  max,
  tone,
}: {
  name: string;
  value: number;
  max: number;
  tone: "win" | "mid" | "you";
}) {
  const pct = Math.max(2, Math.round((value / max) * 100));
  const fill =
    tone === "win" ? "bg-primary" : tone === "you" ? "bg-accent" : "bg-muted-foreground/50";
  return (
    <div className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3">
      <span className={"truncate text-sm " + (tone === "you" ? "font-semibold" : "")}>{name}</span>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div className={"h-full rounded-full " + fill} style={{ width: `${pct}%` }} />
      </div>
      <span
        className={
          "text-right font-mono text-xs tabular-nums " + (tone === "you" ? "text-accent" : "")
        }
      >
        {value}/15
      </span>
    </div>
  );
}

function Step({ n, name, desc }: { n: string; name: string; desc: string }) {
  return (
    <Card>
      <CardBody className="space-y-1.5 p-4">
        <span className="font-mono text-xs font-semibold text-primary">{n}</span>
        <h3 className="font-semibold">{name}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
      </CardBody>
    </Card>
  );
}

export function Home() {
  return (
    <div className="space-y-20 pb-8">
      {/* Hero */}
      <section className="grid items-center gap-10 pt-6 md:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            AI is becoming the new referral engine
          </p>
          <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            When your buyers ask AI who to hire, three names come back.
            <br />
            <span className="text-primary">Is yours one of them?</span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            A growing share of B2B buyers check ChatGPT, Perplexity or Claude before they
            shortlist. Cited measures what the engines actually say about your category — run by
            run, engine by engine — then shifts the odds with the story only your firm can tell,
            and re-measures with the same protocol. No rank promises. Provable movement.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/audit">
              <Button className="px-5 py-2.5 text-base">Get your free AI Visibility Audit</Button>
            </Link>
            <a href="#how" className="text-sm font-medium text-primary hover:underline">
              How it works ↓
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            15 real buyer queries · 4 AI engines · one scorecard · no pitch attached
          </p>
        </div>

        {/* Scorecard mock */}
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold">Share of AI answers</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                illustrative format
              </span>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              "best [your vertical] firm for [use case]" × 15
            </p>
            <div className="space-y-2.5 pt-1">
              <ShareBar name="Competitor A" value={11} max={15} tone="win" />
              <ShareBar name="Competitor B" value={6} max={15} tone="mid" />
              <ShareBar name="Competitor C" value={3} max={15} tone="mid" />
              <ShareBar name="Your firm" value={0} max={15} tone="you" />
            </div>
            <p className="border-t border-border pt-3 text-xs text-muted-foreground">
              This is what invisibility looks like. Your audit fills this chart with real runs for
              your firm and your actual competitors — every query run multiple times, variance
              reported.{" "}
              <Link href="/methodology" className="font-medium text-primary hover:underline">
                How we measure →
              </Link>
            </p>
          </CardBody>
        </Card>
      </section>

      {/* Problem */}
      <section className="space-y-6">
        <h2 className="font-serif text-2xl font-bold tracking-tight">
          Generic isn't just weak marketing anymore. To a language model, generic is invisible.
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [
              "Discovery moved",
              "“Ask a friend” became “Google it” became “ask the AI.” Your next client gets three names and reasons — before they ever visit a website.",
            ],
            [
              "Invisible by default",
              "Models recommend firms they can describe: a named niche, quotable claims, third-party mentions. Most expert firms give them nothing to work with.",
            ],
            [
              "Story is the input",
              "You can't SEO your way into an answer. The firms that get cited have a specific, consistently-told story everywhere the model reads.",
            ],
          ].map(([t, d]) => (
            <Card key={t}>
              <CardBody className="space-y-2">
                <h3 className="font-semibold">{t}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{d}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="font-serif text-2xl font-bold tracking-tight">
            Extract → Translate → Plant → Prove
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Step
            n="01"
            name="Extract"
            desc="A structured narrative interview with your partners pulls out the story only your firm can tell — the edge, not the About-page version."
          />
          <Step
            n="02"
            name="Translate"
            desc="We map that narrative to the exact questions your buyers ask AI, as concrete, quotable claims."
          />
          <Step
            n="03"
            name="Plant"
            desc="Answer-shaped content on your site plus the third-party mentions models actually retrieve from."
          />
          <Step
            n="04"
            name="Prove"
            desc="We track your share of AI answers on your buyers' real queries and deliver the 30-day before/after."
          />
        </div>
      </section>

      {/* The honest guarantee */}
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Straight answer
          </p>
          <h2 className="font-serif text-2xl font-bold tracking-tight">
            Can anyone guarantee you a top-3 AI answer? No. Here's the closest honest thing.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
          <Card className="border-accent/40">
            <CardBody className="space-y-2">
              <h3 className="font-semibold">What nobody can promise</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Closed AI models are probabilistic: answers vary run to run, differ between users,
                and shift with every model update. A vendor who guarantees you a ranking is either
                lying or doesn't understand the systems — which is worth knowing when you compare
                us to anyone else.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-3">
              <h3 className="font-semibold">What we put our fee behind instead</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">1 · You see real data before you pay.</strong>{" "}
                  The free audit is your category's actual answers — if AI isn't recommending
                  anyone in your space yet, the audit says that too.
                </li>
                <li>
                  <strong className="text-foreground">2 · Protocol-grade measurement.</strong>{" "}
                  Every query run multiple times, fresh sessions, four engines, frequencies with
                  variance — not one lucky screenshot.{" "}
                  <Link href="/methodology" className="font-medium text-primary hover:underline">
                    The protocol is public →
                  </Link>
                </li>
                <li>
                  <strong className="text-foreground">3 · The 60-day movement clause.</strong>{" "}
                  Retainers are month-to-month. If your measured share of answers hasn't moved by
                  day 60, you walk. Our fee sits behind the movement, not the promise.
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Offer */}
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            The offer
          </p>
          <h2 className="font-serif text-2xl font-bold tracking-tight">
            Start free. Pay when you've seen the gap.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardBody className="flex h-full flex-col space-y-3">
              <div>
                <h3 className="font-semibold">AI Visibility Audit</h3>
                <p className="font-mono text-sm text-primary">Free</p>
              </div>
              <ul className="flex-1 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                <li>15 real buyer queries, run across ChatGPT, Perplexity, Claude &amp; AI Overviews</li>
                <li>Your share-of-voice vs. your top 3 competitors</li>
                <li>What the AI actually says about you — verbatim</li>
                <li>First three fixes, yours either way</li>
              </ul>
              <Link href="/audit">
                <Button className="w-full">Request the audit</Button>
              </Link>
            </CardBody>
          </Card>
          <Card className="border-primary">
            <CardBody className="flex h-full flex-col space-y-3">
              <div>
                <h3 className="font-semibold">Narrative + Visibility Sprint</h3>
                <p className="font-mono text-sm text-primary">from £6,000 · 30–45 days</p>
              </div>
              <ul className="flex-1 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                <li>The narrative-extraction interview with your partners</li>
                <li>Your differentiated story, translated into answer-shaped content</li>
                <li>Priority assets shipped, placements initiated</li>
                <li>A 30-day before/after of your AI share of voice</li>
              </ul>
              <Link href="/audit">
                <Button variant="secondary" className="w-full">
                  Starts with the audit
                </Button>
              </Link>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="flex h-full flex-col space-y-3">
              <div>
                <h3 className="font-semibold">Ongoing AI Presence</h3>
                <p className="font-mono text-sm text-primary">from £1,500/mo</p>
              </div>
              <ul className="flex-1 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                <li>Continuous answer monitoring — models change monthly</li>
                <li>Narrative &amp; content iteration as competitors move</li>
                <li>New placement outreach</li>
                <li>Quarterly re-audit against your buyers' queries</li>
                <li>Month-to-month, with the 60-day movement clause</li>
              </ul>
              <Link href="/audit">
                <Button variant="secondary" className="w-full">
                  After your sprint
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Differentiation */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold tracking-tight">
          Measurement tools count mentions. Consultants write decks. We close the loop.
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardBody className="space-y-2">
              <h3 className="font-semibold">Not another AI-visibility dashboard</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Tracking tells you you're invisible; it can't tell you what story would change
                that. Our engagements start where dashboards stop — with the narrative the model
                needs before it can recommend you.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-2">
              <h3 className="font-semibold">Not a strategy deck that stops at the deck</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Positioning that never reaches the places models read is a beautiful secret. We
                ship the story into the answer path — and show you the before/after on the exact
                queries your buyers ask.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="rounded-lg border border-primary/30 bg-primary/5 px-6 py-10 text-center">
        <h2 className="font-serif text-2xl font-bold tracking-tight">
          Find out what the AI says about you. It takes us three days.
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Fifteen buyer queries, four engines, one honest scorecard — including the verbatim
          answers, even the ones that sting. Free, and useful even if we never speak again.
        </p>
        <div className="mt-5">
          <Link href="/audit">
            <Button className="px-6 py-2.5 text-base">Get your free AI Visibility Audit</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
