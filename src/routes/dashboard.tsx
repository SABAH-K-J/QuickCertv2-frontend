import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { api } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Plus, LayoutTemplate, History, ArrowRight, FileImage, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — QuickCert" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const user = getStoredUser();
  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ["templates"],
    queryFn: api.listTemplates,
  });

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["history"],
    queryFn: () => api.listHistory(0, 5),
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-border/50 p-10 md:p-14 shadow-sm">
          <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
          <div className="relative z-10">
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
              Welcome back, <span className="text-primary">{user?.name?.split(' ')[0] || 'User'}</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl">
              Here's an overview of your certificate generation workspace. Create new templates or review your recent activity.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="gap-2 shadow-xl">
                <Link to="/templates">
                  <Plus className="h-4 w-4" /> New Template
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Templates Summary Card */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                  <LayoutTemplate className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">Templates</h2>
              </div>
              <Link to="/templates" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="flex-1">
              <div className="mb-6">
                <span className="font-display text-5xl font-bold">{templates.length}</span>
                <span className="text-muted-foreground ml-2 font-medium">total</span>
              </div>
              
              <div className="space-y-3">
                {templates.slice(0, 3).map(t => (
                  <Link key={t.id} to="/editor/$id" params={{ id: String(t.id) }} className="group flex items-center justify-between p-3 rounded-xl border border-border/50 bg-surface/30 hover:bg-surface/70 transition-colors">
                    <span className="font-medium truncate mr-4">{t.name}</span>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
                      Edit <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                ))}
                {!loadingTemplates && templates.length === 0 && (
                  <div className="text-center p-6 border border-dashed border-border rounded-xl text-muted-foreground text-sm">
                    No templates created yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* History Summary Card */}
          <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-accent/10 p-2.5 rounded-xl text-accent-foreground">
                  <History className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
              </div>
              <Link to="/history" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="flex-1">
              <div className="space-y-3">
                {history.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-surface/30">
                    <div className="flex items-center gap-3 truncate">
                      <FileImage className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="truncate">
                        <p className="font-medium text-sm truncate">{item.template_name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(item.generated_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {item.is_bulk ? (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Bulk
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        Single
                      </span>
                    )}
                  </div>
                ))}
                {!loadingHistory && history.length === 0 && (
                  <div className="text-center p-6 border border-dashed border-border rounded-xl text-muted-foreground text-sm">
                    No generation history yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
