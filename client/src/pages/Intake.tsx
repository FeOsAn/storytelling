import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { EdgeAction, IntakeTurnClient, QuestionNode } from "@/lib/types";
import { Badge, Button, Card, CardBody, Input, Textarea } from "@/components/ui";
import { isBigClaim } from "@shared/claims";

type Phase = "apply" | "interview" | "edge" | "generating";

export function Intake() {
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<Phase>("apply");

  // application
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [niche, setNiche] = useState("fitness");
  const [creatorId, setCreatorId] = useState<string>("");

  // interview
  const [script, setScript] = useState<QuestionNode[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [turns, setTurns] = useState<IntakeTurnClient[]>([]);
  const [followUp, setFollowUp] = useState<{ text: string; reason: string } | null>(null);
  const [probedChapters, setProbedChapters] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // edge
  const [edge, setEdge] = useState("");
  const [edgeNote, setEdgeNote] = useState("");
  const [pendingRefine, setPendingRefine] = useState(false);

  const current = script[qIndex];

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

      // Deferred receipts: gentle toast, never a gate.
      if (isBigClaim(answer)) {
        setToast("Nice — noted a big claim. We'll ask for a light receipt after, never mid-flow.");
      }

      const evaln = await apiRequest<{ needsFollowUp: boolean; reason: string }>(
        "/api/intake/evaluate",
        { body: { answer: answer.trim() } },
      );

      // Guarantee at least one contradiction probe per chapter.
      const chapterUnprobed = !probedChapters.has(current.chapter);
      if (evaln.needsFollowUp || chapterUnprobed) {
        const fu = await apiRequest<{ followUp: string; reason: string }>("/api/intake/followup", {
          body: { questionId: current.id, answer: answer.trim(), name, niche },
        });
        setFollowUp({ text: fu.followUp, reason: fu.reason });
        setProbedChapters((s) => new Set(s).add(current.chapter));
        setAnswer("");
      } else {
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
    setFollowUp(null);
    setAnswer("");
    advance(nextTurns);
  }

  async function advance(nextTurns: IntakeTurnClient[]) {
    setToast("");
    if (qIndex + 1 < script.length) {
      setQIndex((i) => i + 1);
    } else {
      // Interview done → infer the edge hypothesis.
      setPhase("edge");
      setBusy(true);
      try {
        const { edge } = await apiRequest<{ edge: string }>("/api/intake/edge", {
          body: { turns: nextTurns },
        });
        setEdge(edge);
      } finally {
        setBusy(false);
      }
    }
  }

  async function confirmEdge(action: EdgeAction) {
    setPhase("generating");
    // The resolved edge fed to generation: the refined text on refine, the
    // hypothesis on confirm, and empty on reject (engine re-infers from the turns).
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

  if (phase === "apply") {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="text-2xl font-bold">Start your story profile</h1>
        <p className="text-sm text-muted-foreground">
          Six questions, adaptive. We&apos;ll hunt for your edge, then reflect it back for you to own.
        </p>
        <Card>
          <CardBody className="space-y-3">
            <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="@handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
            <Input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <select
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
            >
              <option value="endurance">Endurance</option>
              <option value="strength">Strength</option>
              <option value="wellness">Wellness</option>
              <option value="fitness">Fitness (general)</option>
            </select>
            <Button onClick={startApplication} disabled={busy || !name.trim()}>
              {busy ? "Starting…" : "Begin interview"}
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (phase === "generating") {
    return <p className="text-muted-foreground">Generating your brand-ready story profile…</p>;
  }

  if (phase === "edge") {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Badge tone="primary">Live edge confirmation</Badge>
        <h1 className="text-2xl font-bold">Here&apos;s the edge we heard</h1>
        {busy && !edge ? (
          <p className="text-muted-foreground">Listening back to your answers…</p>
        ) : pendingRefine ? (
          // Second micro-confirm: lock the sharper, creator-corrected version (roadmap #2).
          <>
            <p className="text-sm text-muted-foreground">So the edge is —</p>
            <Card>
              <CardBody>
                <p className="text-lg font-medium">{edgeNote.trim()}</p>
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
                <p className="text-lg">{edge}</p>
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
    );
  }

  // interview
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <Badge tone="accent">{current?.chapter}</Badge>
        <span className="text-xs text-muted-foreground">
          Question {qIndex + 1} of {script.length}
        </span>
      </div>

      <Card>
        <CardBody className="space-y-3">
          <p className="text-lg font-semibold">{followUp ? followUp.text : current?.prompt}</p>
          {followUp && (
            <p className="text-xs italic text-muted-foreground">Why we&apos;re asking: {followUp.reason}</p>
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
