import type { SprintPack } from "@/lib/types";
import { Badge, Card, CardBody, Section } from "@/components/ui";
import { CopyButton } from "@/components/ProfileView";

/**
 * The Sprint Pack: real citation landscape + drafted assets. Every block is
 * copy-ready — this is the work product a sprint hands over, not advice.
 */
export function SprintPackView({ pack }: { pack: SprintPack }) {
  return (
    <div className="space-y-6">
      <Card className="shadow-[inset_0_1px_0_rgba(214,246,229,0.1),inset_0_0_0_1px_rgba(63,214,143,0.35),0_24px_60px_rgba(0,0,0,0.55)]">
        <CardBody className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-xl tracking-tight">The Sprint Pack</h2>
            <div className="flex items-center gap-2">
              <Badge tone="primary">drafted &amp; ready to ship</Badge>
              <span className="font-mono text-[10px] text-muted-foreground">
                {new Date(pack.generatedAt).toISOString().slice(0, 10)}
              </span>
            </div>
          </div>

          {/* The real target list */}
          {pack.targets && pack.targets.length > 0 ? (
            <Section title="The target list — pages the engines cite today (live web search)">
              <ol className="space-y-1.5">
                {pack.targets.slice(0, 12).map((t, i) => (
                  <li key={i} className="flex items-baseline gap-2.5 text-sm">
                    <span className="font-mono text-[11px] tabular-nums text-primary">
                      {String(t.citations).padStart(2, " ")}×
                    </span>
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      {t.url.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-[11px] text-muted-foreground/70">
                Harvested from search-grounded answers to the target queries — a strong proxy;
                consumer-app protocol runs remain the deliverable gold standard.
              </p>
            </Section>
          ) : (
            <Section title="The target list">
              <p className="text-sm text-muted-foreground">
                Landscape run pending — re-generate with web search enabled, or map manually per
                the methodology.
              </p>
            </Section>
          )}

          {pack.landscape && pack.landscape.length > 0 && (
            <Section title="Who the engines recommend today, per query">
              <div className="space-y-2">
                {pack.landscape.map((e, i) => (
                  <div key={i} className="rounded-md bg-white/[0.03] p-3">
                    <p className="font-mono text-[11px] text-muted-foreground">{e.query}</p>
                    {e.recommended && e.recommended.length > 0 && (
                      <p className="mt-1 text-sm">
                        {e.recommended.map((r, j) => (
                          <span key={j} className="mr-2 inline-block rounded bg-white/[0.06] px-1.5 py-0.5 text-xs">
                            {r}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <Section title="Asset 1 — the comparison page (publish on your site)">
              <p className="text-sm font-medium">{pack.comparisonPage.title}</p>
            </Section>
            <CopyButton text={pack.comparisonPage.markdown} label="Copy page" />
          </div>
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-4 font-sans text-[13px] leading-relaxed text-muted-foreground">
            {pack.comparisonPage.markdown}
          </pre>
        </CardBody>
      </Card>

      {pack.faq.length > 0 && (
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <Section title="Asset 2 — answer-shaped FAQ (liftable by engines)">
                <span />
              </Section>
              <CopyButton
                text={pack.faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n")}
                label="Copy all"
              />
            </div>
            <div className="space-y-3">
              {pack.faq.map((f, i) => (
                <div key={i} className="rounded-md bg-white/[0.03] p-3">
                  <p className="text-sm font-medium">{f.q}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {pack.communityAnswers.length > 0 && (
        <Card>
          <CardBody className="space-y-3">
            <Section title="Asset 3 — community answers (founder posts, real name, affiliation stated)">
              <span />
            </Section>
            {pack.communityAnswers.map((c, i) => (
              <div key={i} className="rounded-md bg-muted p-4">
                <p className="mb-2 font-mono text-[11px] text-muted-foreground">{c.context}</p>
                <p className="whitespace-pre-wrap text-sm">{c.draft}</p>
                <div className="mt-2 flex justify-end">
                  <CopyButton text={c.draft} />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {pack.outreachEmails.length > 0 && (
        <Card>
          <CardBody className="space-y-3">
            <Section title="Asset 4 — placement outreach (to the real targets above)">
              <span />
            </Section>
            {pack.outreachEmails.map((o, i) => (
              <div key={i} className="rounded-md bg-muted p-4">
                <p className="font-mono text-[11px] text-muted-foreground">to: {o.target}</p>
                <p className="mt-1 text-sm font-medium">{o.subject}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{o.body}</p>
                <div className="mt-2 flex justify-end">
                  <CopyButton text={`Subject: ${o.subject}\n\n${o.body}`} />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="space-y-4">
          <Section title="Asset 5 — directory entries (entity-line consistent)">
            <div className="space-y-3">
              <div className="rounded-md bg-white/[0.03] p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm">{pack.directoryEntries.short}</p>
                  <CopyButton text={pack.directoryEntries.short} />
                </div>
              </div>
              <div className="rounded-md bg-white/[0.03] p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{pack.directoryEntries.long}</p>
                  <CopyButton text={pack.directoryEntries.long} />
                </div>
              </div>
            </div>
          </Section>
        </CardBody>
      </Card>
    </div>
  );
}
