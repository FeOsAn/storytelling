import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { EdgeAction, IntakeTurnClient, QuestionNode } from "@/lib/types";
import { Badge, Button, Card, CardBody, Input, Textarea } from "@/components/ui";
import { isBigClaim } from "@shared/claims";

type Phase = "apply" | "loading" | "interview" | "edge" | "generating";

/** Flow stepper so it's always obvious where you are and what happens next. */
function Stepper({ phase }: { phase: Phase }) {
  const steps: { key: string; label: string; active: boolean; done: boolean }[] = [
    { key: "apply", label: "Your firm", active: phase === "apply", done: phase !== "apply" },
    {
      key: "interview",
      label: "The interview",
      active: phase === "interview",
      done: phase === "edge" || phase === "generating",
    },
    { key: "edge", label: "Own your edge", active: phase === "edge", done: phase === "generating" },
    { key: "profile", label: "Your narrative profile", active: phase === "generating", done: false },
  ];
  return (
    <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5">
      {steps.map((s, i) => (
        <li key={s.key} className="flex items-center gap-2">
          <span
            className={
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] " +
              (s.active
                ? "bg-primary/15 text-primary"
                : s.done
                  ? "text-primary/70"
                  : "text-muted-foreground/60")
            }
          >
            {s.done ? "✓" : i + 1} {s.label}
          </span>
          {i < steps.length - 1 && <span className="h-px w-4 bg-white/10" />}
        </li>
      ))}
    </ol>
  );
}

/** Staged progress while the profile generates (~30–60s) — never a dead wait. */
function GenerationProgress() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const stages: [number, string][] = [
    [0, "Reading the full transcript…"],
    [7, "Weighing the contradiction you confirmed…"],
    [16, "Drafting the narrative in your own words…"],
    [28, "Fencing every unverified number…"],
    [38, "Mapping the queries your buyers ask AI…"],
    [48, "Scoring fit and finishing up…"],
  ];
  const current = [...stages].reverse().find(([t]) => elapsed >= t)!;
  const pct = Math.min(94, Math.round((elapsed / 55) * 100));
  return (
    <div className="mx-auto max-w-md space-y-5 py-16 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
        Generating · {elapsed}s
      </p>
      <h2 className="font-serif text-2xl tracking-tight text-foreground">{current[1]}</h2>
      <div className="mx-auto h-1.5 w-64 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full bg-primary shadow-[0_0_8px_rgba(63,214,143,0.5)] transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Usually 30–60 seconds. Your answers are saved — this page is safe to leave open.
      </p>
    </div>
  );
}

/** Left rail (desktop): the three chapters with live state. */
function ChapterRail({
  script,
  qIndex,
  answers,
  probes,
}: {
  script: QuestionNode[];
  qIndex: number;
  answers: number;
  probes: number;
}) {
  const chapters: { name: string; start: number; count: number }[] = [];
  for (let i = 0; i < script.length; i++) {
    const c = script[i].chapter;
    const last = chapters[chapters.length - 1];
    if (!last || last.name !== c) chapters.push({ name: c, start: i, count: 1 });
    else last.count++;
  }
  return (
    <aside className="hidden flex-col justify-between rounded-2xl bg-white/[0.015] p-5 shadow-[inset_0_0_0_1px_rgba(190,235,210,0.06)] lg:flex">
      <div className="space-y-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          The three chapters
        </p>
        <ol className="space-y-4">
          {chapters.map((c, ci) => {
            const done = qIndex >= c.start + c.count;
            const active = !done && qIndex >= c.start;
            return (
              <li key={c.name} className="flex items-start gap-3">
                <span
                  className={
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] " +
                    (done
                      ? "bg-primary/20 text-primary"
                      : active
                        ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(63,214,143,0.4)]"
                        : "bg-white/[0.05] text-muted-foreground/60")
                  }
                >
                  {done ? "✓" : ci + 1}
                </span>
                <div>
                  <p
                    className={
                      "text-sm " +
                      (active
                        ? "font-medium text-foreground"
                        : done
                          ? "text-muted-foreground"
                          : "text-muted-foreground/60")
                    }
                  >
                    {c.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60">
                    {c.count} question{c.count > 1 ? "s" : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="space-y-1.5 border-t border-white/[0.06] pt-4 font-mono text-[11px] text-muted-foreground">
        <p>
          answers on record <span className="text-foreground">{answers}</span>
        </p>
        <p>
          probes faced <span className="text-foreground">{probes}</span>
        </p>
        <p className="text-muted-foreground/60">autosaves after every answer</p>
      </div>
    </aside>
  );
}

const LISTENING_FOR: Record<string, string> = {
  Foundation:
    "The founding wound, the turn, and the client who calls at 9pm — the parts the About page skips.",
  Edge: "The hill you die on, and where you contradict yourself. The messy true part is the value.",
  "Proof & Fit":
    "Receipts — numbers, names, refusals. Everything unverified gets fenced, never asserted.",
};

/** Right rail (desktop): live interviewer's notes. */
function NotesRail({
  chapter,
  lastTurn,
  probing,
}: {
  chapter: string;
  lastTurn?: IntakeTurnClient;
  probing: boolean;
}) {
  return (
    <aside className="hidden flex-col gap-4 lg:flex">
      <div className="rounded-2xl bg-white/[0.015] p-5 shadow-[inset_0_0_0_1px_rgba(190,235,210,0.06)]">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          What we&apos;re listening for
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {LISTENING_FOR[chapter] ?? LISTENING_FOR.Foundation}
        </p>
      </div>
      <div className="rounded-2xl bg-primary/[0.05] p-5 shadow-[inset_0_0_0_1px_rgba(63,214,143,0.15)]">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
          {probing ? "Why the pushback" : "Specifics get cited"}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {probing
            ? "Every chapter gets one deeper pass. The private version — the doubt, the cost, the contradiction — is the part no competitor can copy."
            : "AI engines can only recommend what they can quote. Name the year, the client, the number, the moment — polish is invisible, detail is ammunition."}
        </p>
      </div>
      {lastTurn && (
        <div className="rounded-2xl bg-white/[0.015] p-5 shadow-[inset_0_0_0_1px_rgba(190,235,210,0.06)]">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            On the record
          </p>
          <p className="mt-2 line-clamp-4 text-[13px] italic leading-relaxed text-muted-foreground/80">
            &ldquo;{lastTurn.answer}&rdquo;
          </p>
        </div>
      )}
    </aside>
  );
}

export function Intake() {
  const params = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<Phase>(params.id ? "loading" : "apply");

  // application
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [niche, setNiche] = useState("");
  const [creatorId, setCreatorId] = useState<string>(params.id ?? "");

  // interview
  const [script, setScript] = useState<QuestionNode[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [turns, setTurns] = useState<IntakeTurnClient[]>([]);
  const [followUp, setFollowUp] = useState<{ text: string; reason: string } | null>(null);
  const [probedChapters, setProbedChapters] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [resumed, setResumed] = useState(false);

  // edge
  const [edge, setEdge] = useState("");
  const [edgeNote, setEdgeNote] = useState("");
  const [pendingRefine, setPendingRefine] = useState(false);

  const current = script[qIndex];

  /** Persist progress server-side after every answer — refresh-proof. */
  function saveDraft(id: string, draftTurns: IntakeTurnClient[]) {
    apiRequest("/api/intake", { body: { creatorId: id, turns: draftTurns } }).catch(() => {});
  }

  // Resume a half-finished interview from the URL id.
  useEffect(() => {
    if (!params.id) return;
    (async () => {
      try {
        const [{ questions }, creator] = await Promise.all([
          apiRequest<{ questions: QuestionNode[] }>("/api/intake/script"),
          apiRequest<{ name: string; niche?: string; profile: unknown; turns: IntakeTurnClient[] }>(
            `/api/creators/${params.id}`,
          ),
        ]);
        if (creator.profile) {
          navigate(`/profile/${params.id}`, { replace: true });
          return;
        }
        setScript(questions);
        setName(creator.name);
        setNiche(creator.niche ?? "");
        const saved = creator.turns ?? [];
        setTurns(saved);
        const primaries = saved.filter((t) => t.kind === "primary" || !t.kind).length;
        setProbedChapters(
          new Set(saved.filter((t) => t.kind === "followup").map((t) => t.chapter ?? "")),
        );
        if (primaries >= questions.length) {
          setPhase("edge");
          setBusy(true);
          const res = await apiRequest<{ edge: string }>("/api/intake/edge", {
            body: { turns: saved },
          });
          setEdge(res.edge);
          setBusy(false);
        } else {
          setQIndex(primaries);
          if (saved.length > 0) setResumed(true);
          setPhase("interview");
        }
      } catch {
        setPhase("apply");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function startApplication() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const { id } = await apiRequest<{ id: string }>("/api/applications", {
        body: { name, handle, email, niche, platforms: [], audienceSize: "" },
      });
      setCreatorId(id);
      const { questions } = await apiRequest<{ questions: QuestionNode[] }>("/api/intake/script");
      setScript(questions);
      setPhase("interview");
      navigate(`/intake/${id}`, { replace: true });
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer(source: "text" | "voice" = "text") {
    if (!current || !answer.trim()) return;
    setBusy(true);
    try {
      const turn: IntakeTurnClient = {
        stage: current.stage,
        chapter: current.chapter,
        question: current.prompt,
        answer: answer.trim(),
        source,
        kind: "primary",
      };
      const nextTurns = [...turns, turn];
      setTurns(nextTurns);
      saveDraft(creatorId, nextTurns);

      // Deferred receipts: gentle toast, never a gate.
      if (isBigClaim(answer)) {
        setToast("Nice — noted a big claim. We'll ask for a light receipt after, never mid-flow.");
      }

      // The at-least-one-probe-per-chapter guarantee is enforced server-side;
      // we just report whether this chapter has been probed yet.
      const evaln = await apiRequest<{ needsFollowUp: boolean; reason: string }>(
        "/api/intake/evaluate",
        { body: { answer: answer.trim(), chapterProbed: probedChapters.has(current.chapter) } },
      );

      if (evaln.needsFollowUp) {
        const fu = await apiRequest<{ followUp: string; reason: string }>("/api/intake/followup", {
          body: { questionId: current.id, answer: answer.trim(), name, niche },
        });
        // Show the evaluate verdict (why THIS answer earned a probe), not the
        // followup generator's internal re-evaluation.
        setFollowUp({ text: fu.followUp, reason: evaln.reason });
        setProbedChapters((s) => new Set(s).add(current.chapter));
        setAnswer("");
      } else {
        setAnswer("");
        advance(nextTurns);
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitFollowUp() {
    if (!current || !followUp || !answer.trim()) return;
    const fuTurn: IntakeTurnClient = {
      stage: current.stage,
      chapter: current.chapter,
      question: followUp.text,
      answer: answer.trim(),
      source: "text",
      kind: "followup",
    };
    const nextTurns = [...turns, fuTurn];
    setTurns(nextTurns);
    saveDraft(creatorId, nextTurns);
    setFollowUp(null);
    setAnswer("");
    advance(nextTurns);
  }

  async function advance(nextTurns: IntakeTurnClient[]) {
    setToast("");
    if (qIndex + 1 < script.length) {
      setQIndex((i) => i + 1);
    } else {
      setPhase("edge");
      setBusy(true);
      try {
        const res = await apiRequest<{ edge: string }>("/api/intake/edge", {
          body: { turns: nextTurns },
        });
        setEdge(res.edge);
      } finally {
        setBusy(false);
      }
    }
  }

  async function confirmEdge(action: EdgeAction) {
    setPhase("generating");
    const finalEdge = action === "refine" ? edgeNote.trim() : action === "confirm" ? edge : "";
    const reviewTurn: IntakeTurnClient = {
      stage: "Review",
      chapter: "Proof & Fit",
      question: `Edge hypothesis (${action}): ${edge}`,
      answer: finalEdge,
      source: "text",
      kind: "review",
    };
    const finalTurns = [...turns, reviewTurn];
    await apiRequest("/api/intake", { body: { creatorId, turns: finalTurns } });
    await apiRequest("/api/generate", { body: { creatorId } });
    navigate(`/profile/${creatorId}`);
  }

  if (phase === "loading") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="text-muted-foreground">Picking up where you left off…</p>
      </div>
    );
  }

  if (phase === "apply") {
    return (
      <div className="flex min-h-[70vh] flex-col justify-center space-y-8">
        <Stepper phase={phase} />
        <div className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="font-serif text-3xl tracking-tight text-foreground md:text-4xl">
                The narrative-extraction interview
              </h1>
              <p className="text-sm text-muted-foreground">
                Six questions, adaptive, with pushback — about 15 minutes. We hunt for the edge
                only your firm can claim, you approve it, and you get the narrative profile that
                tells your whole team what the marketing is aimed at.
              </p>
            </div>
            <Card>
              <CardBody className="space-y-3">
                <Input
                  placeholder="Your name (the founder / partner talking)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  placeholder="Firm or website"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                />
                <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input
                  placeholder="What you sell, to whom — e.g. GTM consulting for fintechs"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                />
                <Button onClick={startApplication} disabled={busy || !name.trim()} className="w-full">
                  {busy ? "Starting…" : "Begin the interview"}
                </Button>
              </CardBody>
            </Card>
          </div>
          <aside className="hidden space-y-4 lg:block">
            <div className="rounded-2xl bg-white/[0.015] p-5 shadow-[inset_0_0_0_1px_rgba(190,235,210,0.06)]">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                What to expect
              </p>
              <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-muted-foreground">
                <li className="flex gap-2.5">
                  <span className="font-mono text-primary">1</span>
                  <span>Three chapters: Foundation, Edge, Proof &amp; Fit.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-mono text-primary">2</span>
                  <span>
                    We push back — at least once per chapter. That&apos;s where the good material
                    lives.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="font-mono text-primary">3</span>
                  <span>
                    You confirm, sharpen or reject the edge we reflect back. Nothing ships without
                    your sign-off.
                  </span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl bg-primary/[0.05] p-5 shadow-[inset_0_0_0_1px_rgba(63,214,143,0.15)]">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                Safe to wander off
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Progress saves after every answer. Close the tab, come back, carry on — your link
                remembers.
              </p>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (phase === "generating") {
    return (
      <div className="flex min-h-[70vh] flex-col justify-center space-y-6">
        <Stepper phase={phase} />
        <GenerationProgress />
      </div>
    );
  }

  if (phase === "edge") {
    const probesFaced = turns.filter((t) => t.kind === "followup").length;
    return (
      <div className="flex min-h-[70vh] flex-col justify-center space-y-8">
        <Stepper phase={phase} />
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="space-y-4">
            <Badge tone="primary">Own your edge</Badge>
            <h1 className="font-serif text-3xl tracking-tight text-foreground">
              Here&apos;s the edge we heard
            </h1>
            {busy && !edge ? (
              <p className="text-muted-foreground">Listening back to your answers…</p>
            ) : pendingRefine ? (
              <>
                <p className="text-sm text-muted-foreground">So the edge is —</p>
                <Card>
                  <CardBody className="md:p-8">
                    <p className="font-serif text-xl md:text-2xl">{edgeNote.trim()}</p>
                  </CardBody>
                </Card>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => confirmEdge("refine")}>Yes — lock it in</Button>
                  <Button variant="ghost" onClick={() => setPendingRefine(false)}>
                    Let me tweak it
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Card>
                  <CardBody className="md:p-8">
                    <p className="font-serif text-xl md:text-2xl">{edge}</p>
                  </CardBody>
                </Card>
                <Textarea
                  rows={3}
                  placeholder="Refine it in your own words (optional) — this becomes the sharper version."
                  value={edgeNote}
                  onChange={(e) => setEdgeNote(e.target.value)}
                />
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => confirmEdge("confirm")}>That&apos;s it — confirm</Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPendingRefine(true)}
                    disabled={!edgeNote.trim()}
                  >
                    Use my refined version
                  </Button>
                  <Button variant="ghost" onClick={() => confirmEdge("reject")}>
                    That&apos;s not me — reject
                  </Button>
                </div>
              </>
            )}
          </div>
          <aside className="hidden space-y-4 lg:block">
            <div className="rounded-2xl bg-white/[0.015] p-5 shadow-[inset_0_0_0_1px_rgba(190,235,210,0.06)]">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                What happens with this
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                This sentence becomes the spine of everything: your positioning line, the entity
                line your team repeats verbatim, and the reason an AI gives when it recommends
                you.
              </p>
            </div>
            <div className="rounded-2xl bg-primary/[0.05] p-5 shadow-[inset_0_0_0_1px_rgba(63,214,143,0.15)]">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                Refining beats confirming
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                Founders who sharpen the hypothesis in their own words end up with materially
                stronger profiles. If it&apos;s 90% right, fix the 10%.
              </p>
            </div>
            <div className="rounded-2xl bg-white/[0.015] p-5 shadow-[inset_0_0_0_1px_rgba(190,235,210,0.06)]">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                This session
              </p>
              <div className="mt-2 space-y-1.5 font-mono text-[11px] text-muted-foreground">
                <p>
                  answers on record <span className="text-foreground">{turns.length}</span>
                </p>
                <p>
                  probes faced <span className="text-foreground">{probesFaced}</span>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // interview — three-zone desktop workspace, single column on mobile.
  const progress = script.length
    ? ((qIndex + (followUp ? 0.5 : 0)) / script.length) * 100
    : 0;
  const probesFaced = turns.filter((t) => t.kind === "followup").length;
  const lastTurn = turns.length > 0 ? turns[turns.length - 1] : undefined;
  return (
    <div className="flex min-h-[70vh] flex-col justify-center space-y-8">
      <Stepper phase={phase} />
      {resumed && (
        <p className="mx-auto w-full max-w-3xl rounded-md bg-primary/10 p-2.5 text-center text-xs text-primary">
          Welcome back — your earlier answers are saved. Picking up at question {qIndex + 1}.
        </p>
      )}
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[240px_minmax(0,1fr)_280px] lg:items-stretch">
        <ChapterRail script={script} qIndex={qIndex} answers={turns.length} probes={probesFaced} />

        <div className="flex flex-col justify-center space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Badge tone="accent">{current?.chapter}</Badge>
              <span className="font-mono text-xs text-muted-foreground">
                Question {qIndex + 1} of {script.length}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-primary/70 shadow-[0_0_6px_rgba(63,214,143,0.4)] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <Card>
            <CardBody className="space-y-4 md:p-8">
              <p className="font-serif text-xl leading-snug md:text-[1.65rem]">
                {followUp ? followUp.text : current?.prompt}
              </p>
              {followUp && (
                <p className="text-xs italic text-muted-foreground">
                  Why we&apos;re asking: {followUp.reason}
                </p>
              )}
              <VoiceTextarea value={answer} onChange={setAnswer} placeholder="Speak or type your answer…" />
              {toast && <p className="rounded-md bg-accent/10 p-2 text-xs text-accent">{toast}</p>}
              <div className="flex justify-end">
                {followUp ? (
                  <Button onClick={submitFollowUp} disabled={busy || !answer.trim()}>
                    Continue
                  </Button>
                ) : (
                  <Button onClick={() => submitAnswer("text")} disabled={busy || !answer.trim()}>
                    {busy ? "…" : "Submit answer"}
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <NotesRail chapter={current?.chapter ?? ""} lastTurn={lastTurn} probing={!!followUp} />
      </div>
    </div>
  );
}

/**
 * Textarea with optional voice dictation via the Web Speech API. Falls back
 * silently to typing when the API is unavailable. No storage/cookies used.
 */
function VoiceTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef<any>(null);

  const supported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }, []);

  useEffect(() => {
    return () => {
      try {
        recogRef.current?.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  function toggle() {
    if (!supported) return;
    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recog = new Ctor();
    recog.continuous = true;
    recog.interimResults = false;
    recog.lang = "en-GB";
    recog.onresult = (e: any) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript;
      onChange((value ? value + " " : "") + text.trim());
    };
    recog.onend = () => setListening(false);
    recogRef.current = recog;
    recog.start();
    setListening(true);
  }

  return (
    <div className="space-y-2">
      <Textarea rows={6} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {supported && (
        <Button variant={listening ? "destructive" : "secondary"} onClick={toggle} type="button">
          {listening ? "◼ Stop dictation" : "🎤 Dictate"}
        </Button>
      )}
    </div>
  );
}
