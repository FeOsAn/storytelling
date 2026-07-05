import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button, Card, CardBody, Input } from "@/components/ui";
import { Reveal } from "@/components/Reveal";

/**
 * Free AI Visibility Audit request. Stored through the existing applications
 * endpoint: name = firm, handle = website, niche = vertical, audienceSize
 * carries the named competitor. Operator picks requests up in the pipeline.
 */
export function Audit() {
  const [firm, setFirm] = useState("");
  const [website, setWebsite] = useState("");
  const [vertical, setVertical] = useState("");
  const [email, setEmail] = useState("");
  const [competitor, setCompetitor] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!firm.trim() || !email.trim() || !vertical.trim()) {
      setError("Firm, vertical and email are required — that's all we need to run the queries.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await apiRequest("/api/applications", {
        body: {
          name: firm.trim(),
          handle: website.trim(),
          email: email.trim(),
          niche: vertical.trim(),
          platforms: [],
          audienceSize: competitor.trim(),
        },
      });
      setDone(true);
    } catch (e) {
      setError((e as Error).message || "Something went wrong — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center space-y-6 py-10">
        <div className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Audit requested ✓
          </p>
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            We're on it. Scorecard within 3 working days.
          </h1>
        </div>
        <Card>
          <CardBody className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              What happens next
            </p>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-mono text-xs text-primary">1</span>
                <span>
                  We run 15 buyer queries for <strong className="text-foreground">{firm}</strong>{" "}
                  across ChatGPT, Perplexity, Claude and Google AI Overviews — each one multiple
                  times, per the{" "}
                  <a href="#/methodology" className="text-primary hover:underline">
                    public protocol
                  </a>
                  .
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs text-primary">2</span>
                <span>
                  Your scorecard lands at <strong className="text-foreground">{email}</strong>:
                  share-of-voice vs. your competitors, what the AI says about you verbatim, and
                  the first three fixes — yours either way, no pitch attached.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs text-primary">3</span>
                <span>
                  If the gap makes you want to move, the sprint starts with the
                  narrative-extraction interview — the story only your firm can tell, turned into
                  the answers AI engines can lift.
                </span>
              </li>
            </ol>
          </CardBody>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          Impatient? You can{" "}
          <a href="#/intake" className="text-primary hover:underline">
            start the narrative interview now
          </a>{" "}
          — it takes ~15 minutes and saves as you go.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center space-y-6 py-4">
      <Reveal>
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Free · no pitch attached
        </p>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          The AI Visibility Audit
        </h1>
        <p className="text-muted-foreground">
          We run 15 questions your buyers actually ask — across ChatGPT, Perplexity, Claude and
          Google AI Overviews — and send you a one-page scorecard: who the AI recommends in your
          category, how often you appear, what it says about you verbatim, and the first three
          fixes.
        </p>
      </div>
      </Reveal>

      <Reveal delay={120}>
      <Card>
        <CardBody className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="firm">
              Firm name *
            </label>
            <Input
              id="firm"
              placeholder="e.g. Northbridge GTM Partners"
              value={firm}
              onChange={(e) => setFirm(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="vertical">
              What you sell, to whom *
            </label>
            <Input
              id="vertical"
              placeholder="e.g. GTM consulting for Series A fintechs"
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="email">
              Work email *
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@firm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="website">
              Website
            </label>
            <Input
              id="website"
              placeholder="firm.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="competitor">
              The competitor who keeps winning work you should have won
            </label>
            <Input
              id="competitor"
              placeholder="optional — we'll benchmark you against them"
              value={competitor}
              onChange={(e) => setCompetitor(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={submit} disabled={busy} className="w-full">
            {busy ? "Sending…" : "Run my audit"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Three working days. Useful even if we never speak again.
          </p>
        </CardBody>
      </Card>
      </Reveal>
    </div>
  );
}
