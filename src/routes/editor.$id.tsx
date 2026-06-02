import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { api, assetUrl, type TemplateElementResponse, type TemplateResponse, type Alignment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/site/Header";
import {
  Type,
  Image as ImageIcon,
  User,
  Calendar,
  GraduationCap,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  ImageUp,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/editor/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Editor — Template #${params.id} — QuickCert` },
      { name: "description", content: "Place text and image elements on your certificate canvas." },
    ],
  }),
  component: EditorPage,
});

function EditorPage() {
  const { id } = Route.useParams();
  const templateId = Number(id);

  const { data: template, isLoading: tLoading, error: tErr } = useQuery({
    queryKey: ["template", templateId],
    queryFn: () => api.getTemplate(templateId),
  });

  if (tLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-12 text-muted-foreground">Loading template…</div>
      </div>
    );
  }
  if (tErr || !template) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="p-12 text-destructive">
          Failed to load template. Check that the backend is running.
        </div>
      </div>
    );
  }

  return <EditorInner template={template} />;
}

function EditorInner({ template }: { template: TemplateResponse }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const fabricCanvasRef = useRef<any>(null);
  const fabricModRef = useRef<any>(null);
  const [activeObject, setActiveObject] = useState<any>(null);
  const [, setRevision] = useState(0);
  const [ready, setReady] = useState(false);

  const tWidth = template.width || 1000;
  const tHeight = template.height || 700;

  // ── Fabric setup (client-only) ──────────────────────────────────────────
  useEffect(() => {
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      const fabric: any = await import("fabric");
      fabricModRef.current = fabric;
      if (disposed || !canvasContainerRef.current) return;

      canvasContainerRef.current.innerHTML = "";
      const canvasEl = document.createElement("canvas");
      canvasContainerRef.current.appendChild(canvasEl);

      const canvas = new fabric.Canvas(canvasEl, {
        width: tWidth,
        height: tHeight,
        backgroundColor: "#ffffff",
        preserveObjectStacking: true,
      });
      fabricCanvasRef.current = canvas;

      // Background image
      if (template.background_image) {
        try {
          const img = await fabric.Image.fromURL(
            assetUrl(template.background_image),
            { crossOrigin: "anonymous" },
          );
          img.set({
            originX: "left",
            originY: "top",
            left: 0,
            top: 0,
            selectable: false,
            evented: false,
          });
          img.scaleToWidth(tWidth);
          img.scaleToHeight(tHeight);
          canvas.add(img);
          img.sendObjectToBack?.() ?? canvas.sendObjectToBack?.(img);
          canvas.renderAll();
        } catch (err) {
          console.error("Background load failed:", err);
        }
      }

      // Load elements
      try {
        const elements = await api.listElements(template.id);

        // Preload Google Fonts if any text elements use them
        const fontsToLoad = new Set<string>();
        for (const el of elements) {
          if (el.element_type === "text" && el.font_family && el.font_family !== "Arial" && el.font_family !== "Times New Roman") {
            fontsToLoad.add(el.font_family);
          }
        }
        for (const f of fontsToLoad) {
          if (!document.querySelector(`link[href*="family=${f.replace(/ /g, "+")}"]`)) {
            const link = document.createElement("link");
            link.href = `https://fonts.googleapis.com/css2?family=${f.replace(/ /g, "+")}&display=swap`;
            link.rel = "stylesheet";
            document.head.appendChild(link);
          }
        }
        // Wait for fonts to be ready so Fabric can measure text correctly
        await Promise.all(Array.from(fontsToLoad).map(f => document.fonts.load(`16px "${f}"`).catch(e => console.error(e))));

        for (const el of elements) {
          if (el.element_type === "text") {
            const text = new fabric.IText(el.content ?? "", {
              left: el.x * tWidth,
              top: el.y * tHeight,
              fontSize: el.font_size ?? 40,
              fontFamily: el.font_family || "Arial",
              fill: el.color || "#000000",
              textAlign: el.alignment || "left",
              originY: "top",
              originX:
                el.alignment === "center"
                  ? "center"
                  : el.alignment === "right"
                    ? "right"
                    : "left",
              scaleX: 1,
              scaleY: 1,
            });
            (text as any).set("id", el.id);
            (text as any).placeholder_type = el.placeholder_type ?? null;
            canvas.add(text);
          } else if (el.element_type === "image" && el.image_path) {
            try {
              const img = await fabric.Image.fromURL(assetUrl(el.image_path), {
                crossOrigin: "anonymous",
              });
              img.set({
                originX: "left",
                originY: "top",
                left: el.x * tWidth,
                top: el.y * tHeight,
              });
              if (el.width && el.height) {
                img.scaleX = (el.width * tWidth) / img.width!;
                img.scaleY = (el.height * tHeight) / img.height!;
              }
              (img as any).set("id", el.id);
              canvas.add(img);
            } catch (err) {
              console.error("Image element load failed:", err);
            }
          }
        }
        canvas.renderAll();
      } catch (err) {
        console.error(err);
      }

      // Responsive zoom
      const resize = () => {
        if (!wrapperRef.current) return;
        const { clientWidth, clientHeight } = wrapperRef.current;
        const scale = Math.min(
          (clientWidth - 40) / tWidth,
          (clientHeight - 40) / tHeight,
        );
        const finalScale = Math.max(0.1, scale);
        canvas.setDimensions({
          width: tWidth * finalScale,
          height: tHeight * finalScale,
        });
        canvas.setZoom(finalScale);
      };
      resizeObserver = new ResizeObserver(resize);
      if (wrapperRef.current) resizeObserver.observe(wrapperRef.current);
      resize();

      // Autosave on modify (port of App.jsx logic)
      const onModified = async (e: any) => {
        const target = e.target;
        if (!target || target.id == null) return;

        let currentFontSize = target.fontSize || 40;
        if (
          target.type === "i-text" &&
          (target.scaleX !== 1 || target.scaleY !== 1)
        ) {
          currentFontSize = Math.round(target.fontSize * target.scaleY);
          target.set({
            fontSize: currentFontSize,
            scaleX: 1,
            scaleY: 1,
          });
          target.setCoords();
          canvas.renderAll();
          setRevision((r) => r + 1);
        }

        const payload: any = {
          x: target.left / tWidth,
          y: target.top / tHeight,
        };

        if (target.type === "i-text") {
          payload.content = target.text;
          payload.font_size = currentFontSize;
          payload.color = target.fill;
        } else if (target.type === "image") {
          payload.width = (target.width * target.scaleX) / tWidth;
          payload.height = (target.height * target.scaleY) / tHeight;
        }

        try {
          await api.updateElement(template.id, target.id, payload);
        } catch (err) {
          console.error(err);
        }
      };
      canvas.on("object:modified", onModified);

      const onSel = () => {
        const objs = canvas.getActiveObjects();
        setActiveObject(objs.length === 1 ? objs[0] : null);
      };
      canvas.on("selection:created", onSel);
      canvas.on("selection:updated", onSel);
      canvas.on("selection:cleared", onSel);
      canvas.on("object:modified", onSel);
      canvas.on("text:changed", () => setRevision((r) => r + 1));

      setReady(true);
    })();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      try {
        fabricCanvasRef.current?.dispose();
      } catch {}
      fabricCanvasRef.current = null;
      setActiveObject(null);
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

  // ── Element creation ────────────────────────────────────────────────────
  async function addText(placeholderType: "static" | "name" | "date" | "course") {
    const canvas = fabricCanvasRef.current;
    const fabric = fabricModRef.current;
    if (!canvas || !fabric) return;

    let content = "New Text";
    if (placeholderType === "name") content = "{name}";
    else if (placeholderType === "date") content = "{date}";
    else if (placeholderType === "course") content = "{course}";

    const x = 300 / tWidth;
    const y = 300 / tHeight;

    try {
      const created = await api.createElement(template.id, {
        element_type: "text",
        content,
        placeholder_type: placeholderType === "static" ? null : placeholderType,
        x,
        y,
        font_size: 40,
        font_family: "Arial",
        color: "#000000",
        alignment: "left",
      });
      const t = new fabric.IText(content, {
        left: x * tWidth,
        top: y * tHeight,
        fontSize: 40,
        fontFamily: "Arial",
        fill: "#000000",
        textAlign: "left",
        originX: "left",
        originY: "top",
      });
      (t as any).set("id", created.id);
      (t as any).placeholder_type = created.placeholder_type ?? null;
      canvas.add(t);
      canvas.setActiveObject(t);
      canvas.renderAll();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function addImage(file: File) {
    const canvas = fabricCanvasRef.current;
    const fabric = fabricModRef.current;
    if (!canvas || !fabric) return;

    const form = new FormData();
    form.append("file", file);
    try {
      const created = await api.uploadImageElement(template.id, form);
      const img = await fabric.Image.fromURL(assetUrl(created.image_path!), {
        crossOrigin: "anonymous",
      });
      const defaultW = Math.min(tWidth * 0.25, img.width!);
      const aspectRatio = img.height! / img.width!;
      const defaultH = defaultW * aspectRatio;
      const cx = (tWidth - defaultW) / 2;
      const cy = (tHeight - defaultH) / 2;

      img.set({
        originX: "left",
        originY: "top",
        left: cx,
        top: cy,
        scaleX: defaultW / img.width!,
        scaleY: defaultH / img.height!,
      });
      (img as any).set("id", created.id);
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();

      await api.updateElement(template.id, created.id, {
        x: cx / tWidth,
        y: cy / tHeight,
        width: defaultW / tWidth,
        height: defaultH / tHeight,
      });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function deleteActive() {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !activeObject?.id) return;
    try {
      await api.deleteElement(template.id, activeObject.id);
      canvas.remove(activeObject);
      canvas.discardActiveObject();
      canvas.renderAll();
      setActiveObject(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Toolbar
          onAddText={addText}
          onAddImage={addImage}
          ready={ready}
          templateName={template.name}
        />
        <main
          ref={wrapperRef}
          className="relative flex min-h-0 flex-1 items-center justify-center bg-surface/30 bg-grid"
        >
          <div ref={canvasContainerRef} className="shadow-2xl ring-1 ring-border" />
        </main>
        <PropertiesPanel
          template={template}
          activeObject={activeObject}
          fabricCanvas={fabricCanvasRef.current}
          onDelete={deleteActive}
          onChange={() => setRevision((r) => r + 1)}
        />
      </div>
    </div>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────
function Toolbar({
  onAddText,
  onAddImage,
  ready,
  templateName,
}: {
  onAddText: (p: "static" | "name" | "date" | "course") => void;
  onAddImage: (f: File) => void;
  ready: boolean;
  templateName: string;
}) {
  const { id } = Route.useParams();
  return (
    <aside className="flex w-64 flex-col gap-1 border-r border-border/60 bg-sidebar p-4">
      <div className="mb-4">
        <Link
          to="/templates"
          className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          ← All templates
        </Link>
        <h2 className="mt-1 truncate font-display text-lg font-semibold">
          {templateName}
        </h2>
      </div>

      <p className="px-1 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Add
      </p>
      <ToolButton
        icon={Type}
        label="Static text"
        onClick={() => onAddText("static")}
        disabled={!ready}
      />
      <ToolButton
        icon={User}
        label="{name} placeholder"
        onClick={() => onAddText("name")}
        disabled={!ready}
      />
      <ToolButton
        icon={Calendar}
        label="{date} placeholder"
        onClick={() => onAddText("date")}
        disabled={!ready}
      />
      <ToolButton
        icon={GraduationCap}
        label="{course} placeholder"
        onClick={() => onAddText("course")}
        disabled={!ready}
      />

      <label className="mt-2 cursor-pointer">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={!ready}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onAddImage(f);
            e.currentTarget.value = "";
          }}
        />
        <span className="flex items-center gap-2 rounded-md border border-dashed border-border bg-surface/40 px-3 py-2 text-sm transition hover:bg-surface">
          <ImageUp className="h-4 w-4" /> Upload image
        </span>
      </label>

      <div className="mt-auto pt-4">
        <Button asChild className="w-full gap-2">
          <Link to="/generate/$id" params={{ id }}>
            <Sparkles className="h-4 w-4" /> Generate
          </Link>
        </Button>
      </div>
    </aside>
  );
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/90 transition hover:bg-surface disabled:opacity-50"
    >
      <Icon className="h-4 w-4 text-primary" /> {label}
    </button>
  );
}

// ── Properties panel ──────────────────────────────────────────────────────
const FONTS = [
  "Arial",
  "Times New Roman",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Playfair Display",
  "Merriweather",
  "Nunito",
  "Poppins",
  "Oswald",
];

function PropertiesPanel({
  template,
  activeObject,
  fabricCanvas,
  onDelete,
  onChange,
}: {
  template: TemplateResponse;
  activeObject: any;
  fabricCanvas: any;
  onDelete: () => void;
  onChange: () => void;
}) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isText = activeObject?.type === "i-text";
  const isImage = activeObject?.type === "image";

  function schedulePatch(payload: Record<string, any>) {
    if (!activeObject?.id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.updateElement(template.id, activeObject.id, payload).catch((e) => {
        console.error(e);
        toast.error(e.message);
      });
    }, 300);
  }

  function update(props: Record<string, any>, patch: Record<string, any>) {
    if (!activeObject || !fabricCanvas) return;
    activeObject.set(props);
    activeObject.setCoords?.();
    fabricCanvas.renderAll();
    onChange();
    schedulePatch(patch);
  }

  return (
    <aside className="w-72 overflow-y-auto border-l border-border/60 bg-sidebar p-4">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Properties
      </h3>

      {!activeObject && (
        <p className="mt-6 text-sm text-muted-foreground">
          Select an element on the canvas to edit it.
        </p>
      )}

      {isText && (
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label>Content</Label>
            <Input
              value={activeObject.text ?? ""}
              onChange={(e) => update({ text: e.target.value }, { content: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Font family</Label>
            <Select
              value={activeObject.fontFamily ?? "Arial"}
              onValueChange={async (v) => {
                if (v !== "Arial" && v !== "Times New Roman") {
                  if (!document.querySelector(`link[href*="family=${v.replace(/ /g, "+")}"]`)) {
                    const link = document.createElement("link");
                    link.href = `https://fonts.googleapis.com/css2?family=${v.replace(/ /g, "+")}&display=swap`;
                    link.rel = "stylesheet";
                    document.head.appendChild(link);
                  }
                  try {
                    await document.fonts.load(`16px "${v}"`);
                  } catch (e) {
                    console.error("Font load failed:", e);
                  }
                }
                update({ fontFamily: v }, { font_family: v });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((f) => (
                  <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Size</Label>
              <Input
                type="number"
                value={Math.round(activeObject.fontSize ?? 40)}
                onChange={(e) => {
                  const n = Number(e.target.value) || 1;
                  update({ fontSize: n }, { font_size: n });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <input
                type="color"
                value={activeObject.fill ?? "#000000"}
                onChange={(e) =>
                  update({ fill: e.target.value }, { color: e.target.value })
                }
                className="h-10 w-full cursor-pointer rounded-md border border-input bg-transparent"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Alignment</Label>
            <div className="grid grid-cols-3 gap-1 rounded-md border border-input bg-background p-1">
              {([
                { v: "left", I: AlignLeft },
                { v: "center", I: AlignCenter },
                { v: "right", I: AlignRight },
              ] as { v: Alignment; I: any }[]).map(({ v, I }) => {
                const active = (activeObject.textAlign ?? "left") === v;
                return (
                  <button
                    key={v}
                    onClick={() => {
                      // Preserve visual position when changing originX
                      const tW = template.width || 1000;
                      const tH = template.height || 700;
                      update(
                        {
                          textAlign: v,
                          originX: v,
                        },
                        { alignment: v, x: activeObject.left / tW, y: activeObject.top / tH },
                      );
                    }}
                    className={`flex items-center justify-center rounded py-1.5 transition ${active ? "bg-primary text-primary-foreground" : "hover:bg-surface"}`}
                  >
                    <I className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {activeObject.placeholder_type && (
            <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-foreground">
              Dynamic placeholder:{" "}
              <code className="font-mono">{activeObject.placeholder_type}</code>
            </div>
          )}
        </div>
      )}

      {isImage && (
        <div className="mt-6 space-y-2 text-sm text-muted-foreground">
          <p>Drag to move. Use corner handles to resize — aspect ratio is preserved by the saved bounds.</p>
        </div>
      )}

      {activeObject && (
        <Button
          variant="destructive"
          className="mt-6 w-full gap-2"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" /> Delete element
        </Button>
      )}
    </aside>
  );
}
