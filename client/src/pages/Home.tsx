import { Link } from "wouter";
import { Button, Card, CardBody, Eyebrow } from "@/components/ui";
import { ClaudeMark, EngineStrip, GeminiMark, OpenAIMark } from "@/components/EngineMarks";
import { Reveal } from "@/components/Reveal";

/**
 * Midnight-instrument landing. The hero is a centered serif display over a fan
 * of three floating glass artifacts — the product's real deliverables as the
 * visual. Every artifact is an illustrative *format* (labelled as such) that
 * real audits fill with receipted runs; nothing here fakes a client result.
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
  const pct = Math.max(3, Math.round((value / max) * 100));
  const fill =
    tone === "win"
      ? "bg-primary shadow-[0_0_8px_rgba(63,214,143,0.5)]"
      : tone === "you"
        ? "bg-destructive"
        : "bg-white/25";
  return (
    <div className="grid grid-cols-[6.5rem_1fr_2.9rem] items-center gap-2.5">
      <span className={"truncate text-xs " + (tone === "you" ? "font-semibold text-foreground" : "text-muted-foreground")}>
        {name}
      </span>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div className={"h-full rounded-full " + fill} style={{ width: `${pct}%` }} />
      </div>
      <span
        className={
          "text-right font-mono text-[11px] tabular-nums " +
          (tone === "you" ? "text-destructive" : "text-muted-foreground")
        }
      >
        {value}/15
      </span>
    </div>
  );
}

/** Artifact A — the share-of-answers scorecard. */
function ScorecardArtifact() {
  return (
    <Card className="md:-rotate-[2.5deg] md:translate-y-8">
      <CardBody className="space-y-3.5 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-foreground">Share of AI answers</span>
          <span className="flex items-center gap-1.5 text-muted-foreground/70">
            <OpenAIMark size={13} />
            <ClaudeMark size={13} />
            <GeminiMark size={13} />
            <span className="font-mono text-[10px]">+2</span>
          </span>
        </div>
        <p className="font-mono text-[10px] text-muted-foreground">
          "best [vertical] firm for [use case]" × 15
        </p>
        <div className="space-y-2 pt-0.5">
          <ShareBar name="Competitor A" value={11} max={15} tone="win" />
          <ShareBar name="Competitor B" value={6} max={15} tone="mid" />
          <ShareBar name="Competitor C" value={3} max={15} tone="mid" />
          <ShareBar name="Your firm" value={0} max={15} tone="you" />
        </div>
      </CardBody>
    </Card>
  );
}

/** Artifact B — the answer itself, the moment the product exists for. */
function AnswerArtifact() {
  return (
    <Card className="relative z-10 shadow-[inset_0_1px_0_rgba(214,246,229,0.1),inset_0_0_0_1px_rgba(190,235,210,0.12),0_32px_70px_rgba(0,0,0,0.6)] md:scale-[1.04]">
      <CardBody className="space-y-4 p-6">
        <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-3">
          <GeminiMark size={15} className="text-primary" />
          <span className="font-mono text-[11px] text-muted-foreground">
            who should we hire for [use case]?
          </span>
        </div>
        <ol className="space-y-3">
          <li className="flex items-baseline gap-3">
            <span className="font-mono text-[11px] text-muted-foreground/60">1</span>
            <div>
              <p className="text-sm text-muted-foreground">Competitor A</p>
              <p className="text-[11px] text-muted-foreground/60">the category default</p>
            </div>
          </li>
          <li className="-mx-3 flex items-baseline gap-3 rounded-lg bg-primary/[0.08] px-3 py-2 shadow-[inset_0_0_0_1px_rgba(63,214,143,0.25)]">
            <span className="font-mono text-[11px] text-primary">2</span>
            <div>
              <p className="text-sm font-medium text-foreground">
                Your firm <span className="text-primary">●</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                named, with your edge as the reason
              </p>
            </div>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="font-mono text-[11px] text-muted-foreground/60">3</span>
            <div>
              <p className="text-sm text-muted-foreground">Competitor B</p>
              <p className="text-[11px] text-muted-foreground/60">strong on adjacent work</p>
            </div>
          </li>
        </ol>
        <p className="border-t border-white/[0.06] pt-3 text-[11px] text-muted-foreground/70">
          Answers vary run to run — we count frequencies, never one screenshot.
        </p>
      </CardBody>
    </Card>
  );
}

/** Artifact C — the day-0 → day-60 movement card. */
function MovementArtifact() {
  return (
    <Card className="md:rotate-[2.5deg] md:translate-y-8">
      <CardBody className="space-y-4 p-5">
        <span className="text-xs font-medium text-foreground">Measured movement</span>
        <div className="space-y-3">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Day 0
              </span>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">0/45</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-white/[0.07]">
              <div className="h-full w-[3%] rounded-full bg-white/25" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Day 60
              </span>
              <span className="font-mono text-[11px] tabular-nums text-primary">11/45</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-white/[0.07]">
              <div className="h-full w-[24%] rounded-full bg-primary shadow-[0_0_8px_rgba(63,214,143,0.5)]" />
            </div>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground/70">
          Same frozen query set, same protocol, re-run on cadence. If this line doesn't move by
          day 60, you walk.
        </p>
      </CardBody>
    </Card>
  );
}

function Step({ n, name, desc }: { n: string; name: string; desc: string }) {
  return (
    <Card>
      <CardBody className="space-y-2 p-5">
        <span className="font-mono text-[11px] font-medium text-primary">{n}</span>
        <h3 className="text-[15px] font-medium text-foreground">{name}</h3>
        <p className="text-[13px] leading-relaxed text-muted-foreground">{desc}</p>
      </CardBody>
    </Card>
  );
}

export function Home() {
  return (
    <div className="space-y-28 pb-10 md:space-y-36">
      {/* Hero */}
      <section className="space-y-12 pt-10 md:pt-16">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <Reveal>
            <Eyebrow>AI is becoming the new referral engine</Eyebrow>
          </Reveal>
          <Reveal delay={90}>
          <h1 className="font-serif text-5xl leading-[1.06] tracking-tight text-foreground md:text-[4.4rem]">
            When your buyers ask AI who to hire,
            <br className="hidden md:block" /> three names come back.
            <br />
            <em className="text-primary">Is yours one of them?</em>
          </h1>
          </Reveal>
          <Reveal delay={180}>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            A growing share of B2B buyers check ChatGPT, Perplexity or Claude before they
            shortlist. Cited measures what the engines actually say about your category — run by
            run, engine by engine — then shifts the odds with the story only your firm can tell,
            and re-measures with the same protocol. No rank promises. Provable movement.
          </p>
          </Reveal>
          <Reveal delay={260}>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/audit">
              <Button className="px-6 py-2.5 text-[15px]">Get your free AI Visibility Audit</Button>
            </Link>
            <a href="#how" className="text-sm text-muted-foreground transition hover:text-foreground">
              How it works ↓
            </a>
          </div>
          </Reveal>
          <Reveal delay={330}>
          <p className="font-mono text-[11px] tracking-wide text-muted-foreground/70">
            15 real buyer queries · 4 AI engines · one scorecard · no pitch attached
          </p>
          </Reveal>
        </div>

        {/* Floating artifact fan */}
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[1fr_1.12fr_1fr] md:items-start md:gap-5">
            <Reveal delay={420}>
              <ScorecardArtifact />
            </Reveal>
            <Reveal delay={520} className="relative z-10">
              <AnswerArtifact />
            </Reveal>
            <Reveal delay={620}>
              <MovementArtifact />
            </Reveal>
          </div>
          <Reveal delay={720}>
            <p className="text-center text-[11px] text-muted-foreground/60">
              Illustrative formats — your audit and re-measures fill these with real, receipted runs.
            </p>
          </Reveal>
        </div>

        {/* Engine strip */}
        <Reveal delay={120}>
          <div className="space-y-6 pt-2">
            <Eyebrow>Measured where your buyers actually ask</Eyebrow>
            <EngineStrip />
          </div>
        </Reveal>
      </section>

      {/* Problem */}
      <section className="space-y-8">
        <Reveal>
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Eyebrow>The shift</Eyebrow>
          <h2 className="font-serif text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
            Generic isn't just weak marketing anymore.
            <br />
            <em className="text-muted-foreground">To a language model, generic is invisible.</em>
          </h2>
        </div>
        </Reveal>
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
          ].map(([t, d], i) => (
            <Reveal key={t} delay={i * 100}>
              <Card className="h-full">
                <CardBody className="space-y-2">
                  <h3 className="text-[15px] font-medium text-foreground">{t}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{d}</p>
                </CardBody>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="space-y-8">
        <Reveal>
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">
            Extract <span className="text-muted-foreground/50">→</span> Translate{" "}
            <span className="text-muted-foreground/50">→</span> Plant{" "}
            <span className="text-muted-foreground/50">→</span> Prove
          </h2>
        </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Reveal delay={0}>
          <Step
            n="01"
            name="Extract"
            desc="A structured narrative interview with your partners pulls out the story only your firm can tell — the edge, not the About-page version."
          />
          </Reveal>
          <Reveal delay={100}>
          <Step
            n="02"
            name="Translate"
            desc="We map that narrative to the exact questions your buyers ask AI, as concrete, quotable claims."
          />
          </Reveal>
          <Reveal delay={200}>
          <Step
            n="03"
            name="Plant"
            desc="Answer-shaped content on your site plus the third-party mentions models actually retrieve from."
          />
          </Reveal>
          <Reveal delay={300}>
          <Step
            n="04"
            name="Prove"
            desc="We track your share of AI answers on your buyers' real queries and deliver the 30-day before/after."
          />
          </Reveal>
        </div>
      </section>

      {/* The honest guarantee */}
      <section className="space-y-8">
        <Reveal>
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Eyebrow>Straight answer</Eyebrow>
          <h2 className="font-serif text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
            Can anyone guarantee you a top-3 AI answer? <em className="text-primary">No.</em>
            <br />
            Here's the closest honest thing.
          </h2>
        </div>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-[1fr_1.4fr]">
          <Reveal>
          <Card className="h-full shadow-[inset_0_1px_0_rgba(214,246,229,0.07),inset_0_0_0_1px_rgba(229,96,76,0.22),0_20px_50px_rgba(0,0,0,0.45)]">
            <CardBody className="space-y-2">
              <h3 className="text-[15px] font-medium text-foreground">What nobody can promise</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Closed AI models are probabilistic: answers vary run to run, differ between users,
                and shift with every model update. A vendor who guarantees you a ranking is either
                lying or doesn't understand the systems — which is worth knowing when you compare
                us to anyone else.
              </p>
            </CardBody>
          </Card>
          </Reveal>
          <Reveal delay={120}>
          <Card className="h-full">
            <CardBody className="space-y-3">
              <h3 className="text-[15px] font-medium text-foreground">
                What we put our fee behind instead
              </h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>
                  <strong className="font-medium text-foreground">1 · You see real data before you pay.</strong>{" "}
                  The free audit is your category's actual answers — if AI isn't recommending
                  anyone in your space yet, the audit says that too.
                </li>
                <li>
                  <strong className="font-medium text-foreground">2 · Protocol-grade measurement.</strong>{" "}
                  Every query run multiple times, fresh sessions, four engines, frequencies with
                  variance — not one lucky screenshot.{" "}
                  <Link href="/methodology" className="text-primary transition hover:brightness-110">
                    The protocol is public →
                  </Link>
                </li>
                <li>
                  <strong className="font-medium text-foreground">3 · The 60-day movement clause.</strong>{" "}
                  Retainers are month-to-month. If your measured share of answers hasn't moved by
                  day 60, you walk. Our fee sits behind the movement, not the promise.
                </li>
              </ul>
            </CardBody>
          </Card>
          </Reveal>
        </div>
      </section>

      {/* Offer */}
      <section className="space-y-8">
        <Reveal>
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Eyebrow>The offer</Eyebrow>
          <h2 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">
            Start free. Pay when you've seen the gap.
          </h2>
        </div>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3 md:items-start">
          <Reveal>
          <Card className="h-full">
            <CardBody className="flex h-full flex-col space-y-4">
              <div className="space-y-1">
                <h3 className="text-[15px] font-medium text-foreground">AI Visibility Audit</h3>
                <p className="font-mono text-sm text-primary">Free</p>
              </div>
              <ul className="flex-1 list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-muted-foreground">
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
          </Reveal>
          <Reveal delay={120}>
          <Card className="relative shadow-[inset_0_1px_0_rgba(214,246,229,0.1),inset_0_0_0_1px_rgba(63,214,143,0.35),0_28px_60px_rgba(0,0,0,0.55)] md:-translate-y-3">
            <CardBody className="flex h-full flex-col space-y-4">
              <div className="space-y-1">
                <h3 className="text-[15px] font-medium text-foreground">
                  Narrative + Visibility Sprint
                </h3>
                <p className="font-mono text-sm text-primary">from £6,000 · 30–45 days</p>
              </div>
              <ul className="flex-1 list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-muted-foreground">
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
          </Reveal>
          <Reveal delay={240}>
          <Card className="h-full">
            <CardBody className="flex h-full flex-col space-y-4">
              <div className="space-y-1">
                <h3 className="text-[15px] font-medium text-foreground">Ongoing AI Presence</h3>
                <p className="font-mono text-sm text-primary">from £1,500/mo</p>
              </div>
              <ul className="flex-1 list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-muted-foreground">
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
          </Reveal>
        </div>
      </section>

      {/* Differentiation */}
      <section className="space-y-8">
        <Reveal>
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Eyebrow>Why us</Eyebrow>
          <h2 className="font-serif text-3xl leading-tight tracking-tight text-foreground md:text-4xl">
            Measurement tools count mentions. Consultants write decks.
            <br />
            <em className="text-primary">We close the loop.</em>
          </h2>
        </div>
        </Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          <Reveal>
          <Card className="h-full">
            <CardBody className="space-y-2">
              <h3 className="text-[15px] font-medium text-foreground">
                Not another AI-visibility dashboard
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Tracking tells you you're invisible; it can't tell you what story would change
                that. Our engagements start where dashboards stop — with the narrative the model
                needs before it can recommend you.
              </p>
            </CardBody>
          </Card>
          </Reveal>
          <Reveal delay={120}>
          <Card className="h-full">
            <CardBody className="space-y-2">
              <h3 className="text-[15px] font-medium text-foreground">
                Not a strategy deck that stops at the deck
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Positioning that never reaches the places models read is a beautiful secret. We
                ship the story into the answer path — and show you the before/after on the exact
                queries your buyers ask.
              </p>
            </CardBody>
          </Card>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <Reveal>
      <section className="relative overflow-hidden rounded-2xl px-6 py-14 text-center shadow-[inset_0_1px_0_rgba(214,246,229,0.08),inset_0_0_0_1px_rgba(190,235,210,0.1)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 90% at 50% -10%, rgba(63,214,143,0.12), transparent 65%)",
          }}
        />
        <div className="relative space-y-4">
          <h2 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">
            Find out what the AI says about you. <em className="text-primary">It takes us three days.</em>
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">
            Fifteen buyer queries, four engines, one honest scorecard — including the verbatim
            answers, even the ones that sting. Free, and useful even if we never speak again.
          </p>
          <div className="pt-1">
            <Link href="/audit">
              <Button className="px-7 py-2.5 text-[15px]">Get your free AI Visibility Audit</Button>
            </Link>
          </div>
        </div>
      </section>
      </Reveal>
    </div>
  );
}
