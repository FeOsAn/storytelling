/**
 * UI primitives for the midnight-instrument theme. Elevation comes from inset
 * frost hairlines + deep drops, never hard borders; buttons are pills; the
 * mint primary is the only chromatic action in the system.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
}) {
  const variants: Record<string, string> = {
    primary:
      "bg-primary text-primary-foreground font-medium shadow-[0_0_18px_rgba(63,214,143,0.22),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_0_30px_rgba(63,214,143,0.38),inset_0_1px_0_rgba(255,255,255,0.25)] hover:brightness-105",
    secondary:
      "bg-white/[0.04] text-foreground shadow-[inset_0_0_0_1px_rgba(190,235,210,0.14)] hover:bg-white/[0.08]",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]",
    destructive:
      "bg-destructive text-destructive-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-110",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white/[0.02] shadow-[inset_0_1px_0_rgba(214,246,229,0.07),inset_0_0_0_1px_rgba(190,235,210,0.08),0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-sm text-foreground shadow-[inset_0_0_0_1px_rgba(190,235,210,0.12)] outline-none transition placeholder:text-muted-foreground/60 focus:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.7)]",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-sm text-foreground shadow-[inset_0_0_0_1px_rgba(190,235,210,0.12)] outline-none transition placeholder:text-muted-foreground/60 focus:shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.7)]",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "muted",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "muted" | "primary" | "accent" | "destructive" }) {
  const tones: Record<string, string> = {
    muted: "bg-white/[0.06] text-muted-foreground",
    primary: "bg-primary/15 text-primary",
    accent: "bg-accent/15 text-accent",
    destructive: "bg-destructive/15 text-destructive",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Centered all-caps section marker flanked by fading hairlines. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-white/15 sm:w-24" />
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {children}
      </span>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-white/15 sm:w-24" />
    </div>
  );
}
