import { Link, Route, Switch, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Router } from "wouter";
import { Home } from "@/pages/Home";
import { Audit } from "@/pages/Audit";
import { Intake } from "@/pages/Intake";
import { Profile } from "@/pages/Profile";
import { Admin } from "@/pages/Admin";

/** Working brand name — change here and in client/index.html to rename. */
export const BRAND = "Cited";

function Nav() {
  const [loc] = useLocation();
  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={
        "text-sm font-medium " +
        (loc === href ? "text-primary" : "text-muted-foreground hover:text-foreground")
      }
    >
      {label}
    </Link>
  );
  return (
    <header className="border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-serif text-xl font-bold tracking-tight">
          {BRAND}
          <span className="text-primary">.</span>
        </Link>
        <nav className="flex items-center gap-5">
          {link("/", "Home")}
          <Link
            href="/audit"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
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
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground">
        <span>
          {BRAND} — the narrative-to-AI-answer studio. Evolved from StoryFit.
        </span>
        <nav className="flex items-center gap-4">
          <Link href="/intake" className="hover:text-foreground">
            Narrative interview
          </Link>
          <Link href="/admin" className="hover:text-foreground">
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
      <div className="flex min-h-full flex-col">
        <Nav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/audit" component={Audit} />
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
