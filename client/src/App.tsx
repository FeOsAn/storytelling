import { Link, Route, Switch, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Router } from "wouter";
import { Home } from "@/pages/Home";
import { Audit } from "@/pages/Audit";
import { Methodology } from "@/pages/Methodology";
import { Proof } from "@/pages/Proof";
import { Intake } from "@/pages/Intake";
import { Profile } from "@/pages/Profile";
import { Admin } from "@/pages/Admin";

/** Working brand name — change here and in client/index.html to rename. */
export const BRAND = "Cited";

/** Blueprint grid fading down from a spotlight halo — the page atmosphere. */
function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(170,225,200,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(170,225,200,0.07) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 95% 75% at 50% -5%, black 35%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 95% 75% at 50% -5%, black 35%, transparent 78%)",
        }}
      />
      <div
        className="absolute left-1/2 top-[-320px] h-[640px] w-[1000px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(63,214,143,0.18), rgba(120,190,235,0.07) 48%, transparent 72%)",
          filter: "blur(24px)",
        }}
      />
    </div>
  );
}

function Nav() {
  const [loc] = useLocation();
  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={
        "text-sm transition " +
        (loc === href ? "text-foreground" : "text-muted-foreground hover:text-foreground")
      }
    >
      {label}
    </Link>
  );
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-serif text-2xl tracking-tight text-foreground">
          {BRAND}
          <span className="text-primary">.</span>
        </Link>
        <nav className="flex items-center gap-6">
          <span className="hidden items-center gap-6 sm:flex">
            {link("/", "Home")}
            {link("/proof", "Proof")}
            {link("/methodology", "Methodology")}
          </span>
          <Link
            href="/audit"
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[0_0_18px_rgba(63,214,143,0.25)] transition hover:shadow-[0_0_28px_rgba(63,214,143,0.4)]"
          >
            Get your free audit
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-xs text-muted-foreground">
        <span>
          {BRAND} — the narrative-to-AI-answer studio. Evolved from StoryFit.
        </span>
        <nav className="flex items-center gap-5">
          <Link href="/methodology" className="transition hover:text-foreground">
            Methodology
          </Link>
          <Link href="/intake" className="transition hover:text-foreground">
            Narrative interview
          </Link>
          <Link href="/admin" className="transition hover:text-foreground">
            Client pipeline
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export function App() {
  return (
    <Router hook={useHashLocation}>
      <div className="relative flex min-h-full flex-col">
        <Atmosphere />
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/audit" component={Audit} />
            <Route path="/methodology" component={Methodology} />
            <Route path="/proof" component={Proof} />
            <Route path="/intake" component={Intake} />
            <Route path="/profile/:id" component={Profile} />
            <Route path="/admin" component={Admin} />
            <Route>
              <p className="text-muted-foreground">Not found.</p>
            </Route>
          </Switch>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
