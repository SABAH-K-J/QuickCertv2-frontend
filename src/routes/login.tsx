import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api, API_BASE } from "@/lib/api";
import { setToken, setStoredUser, isLoggedIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, UserPlus, KeyRound } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — QuickCert" },
      { name: "description", content: "Sign in or create a QuickCert account." },
    ],
  }),
  // Redirect to /templates if already logged in (client-side only — localStorage
  beforeLoad: () => {
    if (typeof window !== "undefined" && isLoggedIn()) {
      throw { redirect: { to: "/dashboard" } };
    }
  },
  component: LoginPage,
});

type Tab = "login" | "register";

function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { access_token } = await api.login(loginEmail, loginPassword);
      setToken(access_token);
      // Fetch the user profile and cache it
      const me = await api.getMe();
      setStoredUser(me);
      toast.success(`Welcome back, ${me.name}!`);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (regPassword !== regConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.register(regName, regEmail, regPassword);
      // Auto-login after register
      const { access_token } = await api.login(regEmail, regPassword);
      setToken(access_token);
      const me = await api.getMe();
      setStoredUser(me);
      toast.success(`Account created! Welcome, ${me.name}!`);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" aria-hidden />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="bg-primary text-primary-foreground p-3 rounded-xl shadow-lg flex items-center justify-center w-14 h-14">
            <span className="font-display text-2xl font-bold">QC</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">QuickCert</h1>
          <p className="text-sm text-muted-foreground">
            {tab === "login" ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Tab switcher */}
          <div className="grid grid-cols-2 border-b border-border/60">
            <button
              onClick={() => setTab("login")}
              className={`flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition
                ${tab === "login"
                  ? "bg-primary/10 text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
                }`}
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition
                ${tab === "register"
                  ? "bg-primary/10 text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
                }`}
            >
              <UserPlus className="h-4 w-4" />
              Register
            </button>
          </div>

          <div className="p-6">
            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gap-2 mt-2"
                  disabled={loading}
                  size="lg"
                >
                  <KeyRound className="h-4 w-4" />
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full name</Label>
                  <Input
                    id="reg-name"
                    type="text"
                    placeholder="Sabah Ahmed"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm">Confirm password</Label>
                  <Input
                    id="reg-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gap-2 mt-2"
                  disabled={loading}
                  size="lg"
                >
                  <UserPlus className="h-4 w-4" />
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>
            )}

          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your templates are private and only accessible to you.
        </p>
      </div>
    </div>
  );
}
