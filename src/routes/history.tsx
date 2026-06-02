import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/site/Header";
import { api, assetUrl, type GeneratedCertificateResponse } from "@/lib/api";
import { API_BASE } from "@/lib/api";
import {
  Download,
  Clock,
  FileArchive,
  FileImage,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — QuickCert" },
      { name: "description", content: "Your certificate generation history." },
    ],
  }),
  component: HistoryPage,
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Build a direct download URL for a generated file served by /generated static mount. */
function downloadUrl(filePath: string): string {
  // file_path is stored as e.g. "generated/abc123/cert.png"
  const clean = filePath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE}/${clean}`;
}

function HistoryPage() {
  const { data: history = [], isLoading, error } = useQuery({
    queryKey: ["history"],
    queryFn: () => api.listHistory(),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Page header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight">
              History
            </h1>
            <p className="mt-2 text-muted-foreground">
              Every certificate you've generated, newest first.
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link to="/templates">
              <Sparkles className="h-4 w-4" />
              Generate more
            </Link>
          </Button>
        </div>

        {/* Error state */}
        {error && (
          <div className="mt-8 flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
            <span>Could not load history. Make sure the backend is running.</span>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="mt-10 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl border border-border/60 bg-surface/40"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && history.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-surface/40">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-semibold">No generations yet</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Once you generate a certificate, it will appear here. You can re-download
              any past certificate at any time.
            </p>
            <Button asChild className="mt-2 gap-2">
              <Link to="/templates">
                <Sparkles className="h-4 w-4" /> Go generate
              </Link>
            </Button>
          </div>
        )}

        {/* History table */}
        {!isLoading && history.length > 0 && (
          <div className="mt-10 overflow-hidden rounded-2xl border border-border/70">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-surface/60">
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    Template
                  </th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    Recipient
                  </th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-5 py-3.5 text-left font-medium text-muted-foreground">
                    Generated
                  </th>
                  <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                    Download
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 bg-card">
                {history.map((cert) => (
                  <HistoryRow key={cert.id} cert={cert} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function HistoryRow({ cert }: { cert: GeneratedCertificateResponse }) {
  const url = downloadUrl(cert.file_path);
  const fileName = cert.file_path.split("/").pop() ?? "certificate";

  return (
    <tr className="transition hover:bg-surface/40">
      {/* Template name — links to editor if template still exists */}
      <td className="px-5 py-4 font-medium">
        {cert.template_id ? (
          <Link
            to="/editor/$id"
            params={{ id: String(cert.template_id) }}
            className="text-foreground hover:text-primary hover:underline"
          >
            {cert.template_name}
          </Link>
        ) : (
          <span className="text-muted-foreground">{cert.template_name}</span>
        )}
      </td>

      {/* Recipient */}
      <td className="px-5 py-4 text-muted-foreground">
        {cert.recipient ?? <span className="italic opacity-50">—</span>}
      </td>

      {/* Badge: single / bulk */}
      <td className="px-5 py-4">
        {cert.is_bulk ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-glow/30 bg-accent-glow/10 px-2.5 py-1 text-xs font-medium text-accent-glow">
            <FileArchive className="h-3 w-3" />
            Bulk ZIP
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <FileImage className="h-3 w-3" />
            Single
          </span>
        )}
      </td>

      {/* Date */}
      <td className="px-5 py-4 text-muted-foreground">
        {formatDate(cert.generated_at)}
      </td>

      {/* Download button */}
      <td className="px-5 py-4 text-right">
        <a
          href={url}
          download={fileName}
          className="inline-flex items-center gap-1.5 rounded-md bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-primary hover:text-primary-foreground"
        >
          <Download className="h-3.5 w-3.5" />
          {cert.is_bulk ? "ZIP" : "PNG"}
        </a>
      </td>
    </tr>
  );
}
