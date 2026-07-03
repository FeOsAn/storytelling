import { Link } from "wouter";
import { Button, Card, CardBody } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

/**
 * Public measurement methodology. This page exists because AI answers are
 * stochastic — one screenshot proves nothing — and because publishing the
 * protocol is the credibility moat: clients can hold us to it.
 */
export function Methodology() {
  return (
    <div className="mx-auto max-w-3xl space-y-12 py-4">
      <Reveal>
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Methodology · public &amp; held against us
        </p>
        <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
          How we measure AI answers — so one lucky screenshot never counts
        </h1>
        <p className="text-muted-foreground">
          AI assistants are probabilistic: the same question gets different answers run to run,
          user to user, week to week. That makes single-run "AI visibility reports" close to
          meaningless. Everything we sell is measured with the protocol below — baseline, day 30,
          day 60 — and every case study we publish has it attached.
        </p>
      </header>
      </Reveal>

      <Reveal>
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold tracking-tight">The protocol</h2>
        <div className="grid gap-3">
          {[
            [
              "The query set",
              "15 buyer questions, agreed with you before the baseline — the questions your prospects actually ask (“best [vertical] firm for [use case]”, “[competitor] alternatives”, “who should I hire to [job]”). The set is frozen: baseline and re-measures always run the identical queries.",
            ],
            [
              "The engines",
              "ChatGPT (with search), Perplexity, Claude, and Google AI Overviews. Four engines because they retrieve differently — a firm can be visible in one and absent in another, and the audit shows exactly that split.",
            ],
            [
              "The runs",
              "Every query runs multiple times per engine in fresh sessions — no account history, no personalization, region noted. Answers vary; frequency across runs is the signal, a single answer is noise.",
            ],
            [
              "The scoring",
              "A firm scores a mention only when the engine names it as a recommendation — not a passing reference. We record who was recommended, in what order, with what reasoning, verbatim.",
            ],
            [
              "The reporting",
              "Share of answers as a frequency with spread (“named in 7 of 45 runs”), per engine and combined — plus the verbatim quotes, including the unflattering ones. Baseline, day 30, day 60, same protocol every time.",
            ],
          ].map(([t, d]) => (
            <Card key={t}>
              <CardBody className="space-y-1.5">
                <h3 className="font-semibold">{t}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{d}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
      </Reveal>

      <Reveal>
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-bold tracking-tight">
          What can actually be influenced — and how fast
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardBody className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Weeks · the retrieval layer
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Engines that search the live web at answer time (Perplexity, ChatGPT with search,
                AI Overviews) read your site, comparison pages, directories, communities and
                coverage. Presence, specificity and corroboration there are editable — and the
                effect shows up in re-measures within weeks. Most of our work lives here.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Months · the model's memory
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                What models "know" without searching comes from training data. A consistent,
                specific story across the web eventually lands there — we plant it, but nobody
                schedules the harvest. We report this layer separately so slow movement is never
                dressed up as fast.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                Never · out of anyone's hands
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Per-user personalization, model updates, and run-to-run sampling noise. No vendor
                controls these — including us. That's precisely why we measure in frequencies
                across many runs instead of promising any single answer.
              </p>
            </CardBody>
          </Card>
        </div>
      </section>
      </Reveal>

      <Reveal>
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold tracking-tight">What we never promise</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">A rank.</strong> "Guaranteed top-3" is not a thing
            anyone can sell honestly. Our commitment is measured movement in your share of answers
            — backed by the 60-day clause: if it hasn't moved, you walk.
          </li>
          <li>
            <strong className="text-foreground">A specific answer.</strong> We shift what the
            engines have to work with; we don't script their output.
          </li>
          <li>
            <strong className="text-foreground">Permanence.</strong> Models update and competitors
            move — which is why measurement is continuous, not a one-off certificate.
          </li>
        </ul>
      </section>
      </Reveal>

      <Reveal>
      <section className="space-y-3">
        <h2 className="font-serif text-2xl font-bold tracking-tight">One caveat we volunteer</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Automated tracking via model APIs is a useful high-frequency proxy, but API responses
          are not identical to what a buyer sees in the consumer apps (search grounding and
          product layers differ). Audit deliverables are therefore run in the consumer products
          themselves; API-based tracking supplements between re-measures. Vendors who don't
          mention this difference are measuring something other than what your buyers see.
        </p>
      </section>
      </Reveal>

      <Reveal>
      <section className="rounded-lg border border-primary/30 bg-primary/5 px-6 py-8 text-center">
        <h2 className="font-serif text-xl font-bold tracking-tight">
          The audit runs on this exact protocol. Free.
        </h2>
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
