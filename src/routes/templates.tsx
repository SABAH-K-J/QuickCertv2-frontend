import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { api, assetUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Sparkles, LogIn } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Templates — QuickCert" },
      { name: "description", content: "Manage your certificate templates." },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: templates = [], isLoading, error } = useQuery({
    queryKey: ["templates"],
    queryFn: api.listTemplates,
  });

  const [open, setOpen] = useState(false);

  const createMut = useMutation({
    mutationFn: (form: FormData) => api.createTemplate(form),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      setOpen(false);
      toast.success("Template created");
      navigate({ to: "/editor/$id", params: { id: String(t.id) } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => api.deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight">
              Templates
            </h1>
            <p className="mt-2 text-muted-foreground">
              Every certificate starts here. Upload a background, place
              elements, generate.
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                New template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create template</DialogTitle>
                <DialogDescription>
                  Upload a background image. Its pixel dimensions become the
                  canvas size.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  createMut.mutate(fd);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required placeholder="Workshop completion" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="What is this template for?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">Background image</Label>
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept="image/*"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMut.isPending}>
                    {createMut.isPending ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="mt-8 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
            {(error as Error).message?.includes("401") || (error as Error).message?.toLowerCase().includes("credentials") ? (
              <span>
                Session expired or invalid.{" "}
                <Link to="/login" className="font-medium text-primary underline underline-offset-2">
                  Sign in again
                </Link>
              </span>
            ) : (
              <span>
                Could not load templates. Make sure the backend is running and try again.
              </span>
            )}
          </div>
        )}

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl border border-border/60 bg-surface/40"
              />
            ))}

          {templates.map((t) => (
            <article
              key={t.id}
              className="group overflow-hidden rounded-2xl border border-border/70 bg-card transition hover:border-primary/50"
            >
              <Link
                to="/editor/$id"
                params={{ id: String(t.id) }}
                className="block aspect-[16/10] w-full overflow-hidden bg-surface"
              >
                {t.background_image ? (
                  <img
                    src={assetUrl(t.background_image)}
                    alt={t.name}
                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    No preview
                  </div>
                )}
              </Link>
              <div className="p-5">
                <h3 className="font-display text-lg font-semibold">{t.name}</h3>
                {t.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {t.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <Button asChild size="sm" variant="secondary" className="gap-1.5">
                    <Link to="/editor/$id" params={{ id: String(t.id) }}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="gap-1.5">
                    <Link to="/generate/$id" params={{ id: String(t.id) }}>
                      <Sparkles className="h-3.5 w-3.5" /> Generate
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Delete "${t.name}"?`)) delMut.mutate(t.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}

          {!isLoading && templates.length === 0 && !error && (
            <div className="col-span-full rounded-2xl border border-dashed border-border/70 bg-surface/20 p-12 text-center">
              <p className="text-muted-foreground">No templates yet.</p>
              <Button className="mt-4" onClick={() => setOpen(true)}>
                Create your first template
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
