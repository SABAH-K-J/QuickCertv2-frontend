import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, User, Clock, Box } from "lucide-react";
import { getStoredUser, logout, isLoggedIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function Header() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const loggedIn = isLoggedIn();

  function handleLogout() {
    logout();
    toast.success("Logged out");
    navigate({ to: "/login" });
  }

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-transparent">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 text-primary">
          <span className="font-display text-2xl font-bold tracking-tight">
            QuickCert
          </span>
        </Link>

        {loggedIn ? (
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              className="text-muted-foreground transition hover:text-foreground data-[status=active]:text-foreground"
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              className="text-muted-foreground transition hover:text-foreground data-[status=active]:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              to="/templates"
              className="text-muted-foreground transition hover:text-foreground data-[status=active]:text-foreground"
            >
              Templates
            </Link>
            <Link
              to="/history"
              className="text-muted-foreground transition hover:text-foreground data-[status=active]:text-foreground"
            >
              History
            </Link>
          </nav>
        ) : (
           <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
             <span className="text-muted-foreground">Product</span>
             <span className="text-muted-foreground">Resources</span>
             <span className="text-muted-foreground">Company</span>
           </nav>
        )}

        <div className="flex items-center gap-4 text-sm font-medium">
          {loggedIn ? (
            <>
              {user && (
                <div className="flex items-center gap-2 text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{user.name}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleLogout}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-foreground transition hover:text-muted-foreground"
              >
                Log In
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
