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
        setFollowUp({ text: fu.followUp, reason: fu.reason });
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
    return <p className="py-16 text-center text-muted-foreground">Picking up where you left off…</p>;
  }

  if (phase === "apply") {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Stepper phase={phase} />
        <div className="space-y-3 text-center">
          <h1 className="font-serif text-3xl tracking-tight text-foreground">
            The narrative-extraction interview
          </h1>
          <p className="text-sm text-muted-foreground">
            Six questions, adaptive, with pushback — about 15 minutes. We hunt for the edge only
            your firm can claim, you approve it, and you get the narrative profile that tells your
            whole team what the marketing is aimed at. Progress saves as you go.
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
    );
  }

  if (phase === "generating") {
    return (
      <div className="space-y-6">
        <Stepper phase={phase} />
        <GenerationProgress />
      </div>
    );
  }

  if (phase === "edge") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Stepper phase={phase} />
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
                <CardBody>
                  <p className="font-serif text-xl">{edgeNote.trim()}</p>
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
                <CardBody>
                  <p className="font-serif text-xl">{edge}</p>
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
      </div>
    );
  }

  // interview
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Stepper phase={phase} />
      {resumed && (
        <p className="rounded-md bg-primary/10 p-2.5 text-center text-xs text-primary">
          Welcome back — your earlier answers are saved. Picking up at question {qIndex + 1}.
        </p>
      )}
      <div className="flex items-center justify-between">
        <Badge tone="accent">{current?.chapter}</Badge>
        <span className="font-mono text-xs text-muted-foreground">
          Question {qIndex + 1} of {script.length}
        </span>
      </div>

      <Card>
        <CardBody className="space-y-3">
          <p className="font-serif text-xl leading-snug">{followUp ? followUp.text : current?.prompt}</p>
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
      <Textarea rows={5} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {supported && (
        <Button variant={listening ? "destructive" : "secondary"} onClick={toggle} type="button">
          {listening ? "◼ Stop dictation" : "🎤 Dictate"}
        </Button>
      )}
    </div>
  );
}
