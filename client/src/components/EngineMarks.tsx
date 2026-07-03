/**
 * Simplified marks for the AI engines whose answers we measure. Rendered in
 * monochrome (Linear customer-strip style) and always accompanied by the
 * no-affiliation note — the engines are the surfaces we audit, not partners.
 */
import * as React from "react";

type MarkProps = React.SVGProps<SVGSVGElement> & { size?: number };

/** Anthropic's Claude spark — a tapered starburst. */
export function ClaudeMark({ size = 22, ...props }: MarkProps) {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const len = i % 2 === 0 ? 9.4 : 6.2;
    return (
      <line
        key={i}
        x1="12"
        y1={12 - 2.6}
        x2="12"
        y2={12 - len}
        transform={`rotate(${i * 30} 12 12)`}
      />
    );
  });
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...props}>
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
        {rays}
      </g>
    </svg>
  );
}

/** OpenAI's hexagonal knot — six interwoven chevrons. */
export function OpenAIMark({ size = 22, ...props }: MarkProps) {
  const links = Array.from({ length: 6 }, (_, i) => (
    <path
      key={i}
      d="M12 3.2 L16.9 6 L16.9 11.6"
      transform={`rotate(${i * 60} 12 12)`}
    />
  ));
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...props}>
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {links}
      </g>
    </svg>
  );
}

/** Google Gemini's four-point sparkle. */
export function GeminiMark({ size = 22, ...props }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M12 1.6 C13.1 7.1 16.9 10.9 22.4 12 C16.9 13.1 13.1 16.9 12 22.4 C10.9 16.9 7.1 13.1 1.6 12 C7.1 10.9 10.9 7.1 12 1.6 Z"
      />
    </svg>
  );
}

/** Grey strip of the engines we measure, with the honesty microcopy. */
export function EngineStrip() {
  const item = "flex items-center gap-2.5 text-muted-foreground transition hover:text-foreground";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
        <span className={item}>
          <OpenAIMark />
          <span className="text-sm font-medium">ChatGPT</span>
        </span>
        <span className={item}>
          <ClaudeMark />
          <span className="text-sm font-medium">Claude</span>
        </span>
        <span className={item}>
          <GeminiMark />
          <span className="text-sm font-medium">Gemini</span>
        </span>
        <span className={item}>
          <span className="font-serif text-lg italic leading-none">P</span>
          <span className="text-sm font-medium">Perplexity</span>
        </span>
        <span className={item}>
          <GeminiMark size={16} className="opacity-70" />
          <span className="text-sm font-medium">AI Overviews</span>
        </span>
      </div>
      <p className="text-center text-[11px] text-muted-foreground/60">
        Independent measurement across the engines your buyers ask. All marks belong to their
        owners — no affiliation or endorsement implied.
      </p>
    </div>
  );
}
