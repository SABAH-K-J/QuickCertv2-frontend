## QuickCert Frontend — Multi-page Build

A TanStack Start app with 4 routes wired to your FastAPI backend at `http://localhost:8000`. The Fabric.js editor preserves the exact coordinate, alignment, and scaling logic from your `App.jsx` so generated PNGs stay pixel-aligned with the canvas preview.

### Pages

```
/            Landing  — hero, how-it-works, CTA → /templates
/templates   Dashboard — grid of templates, create (name+desc+bg upload), delete
/editor/$id  Editor   — Fabric.js canvas, toolbar, properties panel, autosave
/generate/$id Generate — single (form) + bulk (CSV/XLSX) preview & download
```

### Design

Midnight Indigo palette (`#0a0a1a / #141432 / #1e1e5a / #4f46e5`) applied via tokens in `src/styles.css` (oklch). Dark, technical, slightly editorial — Space Grotesk display + Inter body. Generous whitespace on landing, dense control surfaces on editor/generate.

### Coordinate / alignment contract (preserved verbatim from App.jsx)

- Save: `x = obj.left / canvas.width`, `y = obj.top / canvas.height`. Image dims: `width = obj.width * scaleX / canvas.width`, same for height.
- Load: multiply back by `template.width / template.height`.
- Text uses `originY: 'top'` always; `originX` mirrors `alignment` (`left | center | right`).
- On `object:modified` for text: bake `scaleY` into `fontSize` (`Math.round(fontSize * scaleY)`) and reset `scaleX/scaleY = 1` before PATCH.
- Images: anchor `originX/originY = 'top/left'`; background image is `selectable:false, evented:false` and sent to back.
- Responsive zoom via `ResizeObserver` → `canvas.setDimensions + setZoom` (never mutates stored coords).
- Image-element flow: POST file → receive element → load onto canvas → center at 25%-width default → PATCH with real `x,y,width,height`.

### Technical details

- **API client** (`src/lib/api.ts`): single `apiFetch(path, init)` using `VITE_API_BASE` (default `http://localhost:8000`). Backend file paths are prefixed with the same base (`${API_BASE}/${cleanPath}`) since the dev-proxy from your old Vite setup doesn't exist here.
- **Env**: add `VITE_API_BASE=http://localhost:8000` to `.env`. CORS must be enabled on the FastAPI side for the Lovable preview origin.
- **Routes** (TanStack file-based):
  - `src/routes/index.tsx` — landing
  - `src/routes/templates.tsx` — dashboard
  - `src/routes/editor.$id.tsx` — editor (loader fetches template + elements via TanStack Query)
  - `src/routes/generate.$id.tsx` — generation
  - Each route sets its own `head()` meta (title, description, og).
- **Editor architecture** (`src/features/editor/`):
  - `useFabricCanvas.ts` — hook owning the canvas lifecycle (init, dispose, resize, autosave handler). Port of the `useEffect` from App.jsx.
  - `Toolbar.tsx` — add text (static, `{name}`, `{date}`, `{course}`), upload image, replace background.
  - `PropertiesPanel.tsx` — font family/size, color, alignment, content; debounced PATCH on change (300ms).
  - `EditorShell.tsx` — wraps wrapperRef + canvasContainerRef.
- **Generate page**:
  - Single mode: dynamic form built from elements where `placeholder_type` is set; POST `/generate` → blob → preview `<img>` + download button.
  - Bulk mode: file input (CSV/XLSX) → POST `/generate-bulk` → ZIP blob download.
- **Deps to add**: `fabric@^6`.
- **Components**: shadcn Button/Input/Card/Dialog/Select/Tabs/Sonner for the dashboard, toolbar, and generate forms.

### Out of scope

- Auth (none in your backend).
- Real-time multi-user editing.
- Server-side rendering of the canvas (editor route is client-only).

### Open assumption

CORS will be enabled on your FastAPI backend for the preview origin. If not, the editor will load but API calls will fail in the browser; easy fix is `from fastapi.middleware.cors import CORSMiddleware` with `allow_origins=["*"]` in dev.