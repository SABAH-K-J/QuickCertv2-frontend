import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Header } from "@/components/site/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Download, Sparkles, FileSpreadsheet, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/generate/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Generate — Template #${params.id} — QuickCert` },
      { name: "description", content: "Generate single or bulk certificate PNGs." },
    ],
  }),
  component: GeneratePage,
});

function GeneratePage() {
  const { id } = Route.useParams();
  const templateId = Number(id);

  const { data: template } = useQuery({
    queryKey: ["template", templateId],
    queryFn: () => api.getTemplate(templateId),
  });
  const { data: elements = [] } = useQuery({
    queryKey: ["elements", templateId],
    queryFn: () => api.listElements(templateId),
  });

  const placeholders = useMemo(() => {
    const set = new Set<string>();
    for (const el of elements) {
      if (el.placeholder_type) set.add(el.placeholder_type);
    }
    return Array.from(set);
  }, [elements]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [includeQr, setIncludeQr] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  async function generateOne() {
    setLoading(true);
    try {
      const blob = await api.generateOne(templateId, values, includeQr);
      const url = URL.createObjectURL(blob);
      setPreview(url);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateBulk() {
    if (!bulkFile) return;
    setBulkLoading(true);
    try {
      const blob = await api.generateBulk(templateId, bulkFile);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template?.name ?? "certificates"}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Bulk generation complete");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Link
          to="/editor/$id"
          params={{ id }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to editor
        </Link>

        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Generate{template ? ` — ${template.name}` : ""}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Fill placeholders for a single preview, or upload a CSV/XLSX for bulk
          generation.
        </p>

        <Tabs defaultValue="single" className="mt-10">
          <TabsList>
            <TabsTrigger value="single" className="gap-2">
              <Sparkles className="h-4 w-4" /> Single
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Bulk
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-6">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-display text-lg font-semibold">
                  Placeholders
                </h2>
                {placeholders.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    This template has no dynamic placeholders. The generated
                    certificate will be a static render.
                  </p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {placeholders.map((p) => (
                      <div key={p} className="space-y-2">
                        <Label htmlFor={p}>{`{${p}}`}</Label>
                        <Input
                          id={p}
                          value={values[p] ?? ""}
                          onChange={(e) =>
                            setValues((v) => ({ ...v, [p]: e.target.value }))
                          }
                          placeholder={`Value for ${p}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex items-center space-x-2">
                  <Checkbox 
                    id="includeQr" 
                    checked={includeQr}
                    onCheckedChange={(checked) => setIncludeQr(!!checked)}
                  />
                  <Label htmlFor="includeQr" className="font-medium cursor-pointer">
                    Include Verification QR Code
                  </Label>
                </div>

                <Button
                  onClick={generateOne}
                  disabled={loading}
                  className="mt-6 w-full gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {loading ? "Generating…" : "Generate preview"}
                </Button>
              </div>

              <div className="rounded-2xl border border-border bg-surface/40 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-semibold">Preview</h2>
                  {preview && (
                    <a
                      href={preview}
                      download={`${template?.name ?? "certificate"}.png`}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Download className="h-4 w-4" /> Download
                    </a>
                  )}
                </div>
                <div className="mt-4 flex min-h-[300px] items-center justify-center rounded-lg border border-dashed border-border/70 bg-background/40 p-4">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Generated certificate"
                      className="max-h-[60vh] w-auto rounded shadow-2xl"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Your generated certificate will appear here.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="mt-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-lg font-semibold">
                Bulk generation
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload a CSV or XLSX with columns matching your placeholders:{" "}
                {placeholders.length > 0 ? (
                  <code className="font-mono">{placeholders.join(", ")}</code>
                ) : (
                  <span>none defined</span>
                )}
                . You'll receive a ZIP with one PNG per row.
              </p>
              <div className="mt-6 space-y-2">
                <Label htmlFor="bulk">CSV or XLSX file</Label>
                <Input
                  id="bulk"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setBulkFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <Button
                className="mt-6 gap-2"
                onClick={generateBulk}
                disabled={!bulkFile || bulkLoading}
              >
                <Download className="h-4 w-4" />
                {bulkLoading ? "Generating ZIP…" : "Generate & download ZIP"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
