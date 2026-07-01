import { Link, Route, Switch, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Router } from "wouter";
import { Home } from "@/pages/Home";
import { Intake } from "@/pages/Intake";
import { Profile } from "@/pages/Profile";
import { Admin } from "@/pages/Admin";

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
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          StoryFit <span className="text-primary">✦</span>
        </Link>
        <nav className="flex items-center gap-5">
          {link("/", "Home")}
          {link("/intake", "Start")}
          {link("/admin", "Cohort")}
        </nav>
      </div>
    </header>
  );
}

export function App() {
  return (
    <Router hook={useHashLocation}>
      <div className="min-h-full">
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/intake" component={Intake} />
            <Route path="/profile/:id" component={Profile} />
            <Route path="/admin" component={Admin} />
            <Route>
              <p className="text-muted-foreground">Not found.</p>
            </Route>
          </Switch>
        </main>
      </div>
    </Router>
  );
}
