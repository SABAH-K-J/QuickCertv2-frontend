/**
 * QuickCert API client.
 * Talks to the FastAPI backend. Base URL is configured via VITE_API_BASE
 * (defaults to http://localhost:8000). Backend must enable CORS for the
 * preview origin.
 *
 * All endpoints except /auth/register and /auth/login require a JWT.
 * The token is automatically read from localStorage via getToken() and
 * injected as an Authorization: Bearer header.
 */
import { getToken, logout } from "./auth";

export const API_BASE: string =
  (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8000";

export interface TemplateResponse {
  id: number;
  name: string;
  description?: string | null;
  background_image?: string | null;
  width?: number | null;
  height?: number | null;
  user_id?: number;
}

export type ElementType = "text" | "image";
export type Alignment = "left" | "center" | "right";

export interface TemplateElementResponse {
  id: number;
  template_id: number;
  element_type: ElementType;
  content?: string | null;
  placeholder_type?: string | null;
  x: number;
  y: number;
  width?: number | null;
  height?: number | null;
  font_size?: number | null;
  font_family?: string | null;
  color?: string | null;
  alignment?: Alignment | null;
  image_path?: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
}

export interface GeneratedCertificateResponse {
  id: number;
  user_id: number;
  template_id: number | null;
  template_name: string;
  recipient: string | null;
  file_path: string;
  generated_at: string; // ISO datetime string
  is_bulk: boolean;
}

/** Build URL for a backend-served asset (background images, uploaded elements). */
export function assetUrl(path: string | null | undefined): string {
  if (!path) return "";
  const clean = path.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${API_BASE}/${clean}`;
}

/** Build Authorization header object if a token exists. */
function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  // Global 401 interceptor — token expired or invalid.
  // Log out and hard-redirect so the user lands on the login page
  // regardless of which page / component triggered the request.
  if (res.status === 401) {
    logout();
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
    throw new Error("Session expired. Please sign in again.");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Surface the JSON detail field from FastAPI error responses
    try {
      const json = JSON.parse(text);
      const detail = json?.detail;
      if (typeof detail === "string") throw new Error(detail);
      if (Array.isArray(detail)) throw new Error(detail.map((d: any) => d.msg).join(", "));
    } catch (parseErr: any) {
      if (parseErr instanceof SyntaxError) {
        throw new Error(`API ${res.status}: ${text || res.statusText}`);
      }
      throw parseErr;
    }
  }
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  return (await res.text()) as unknown as T;
}

export const api = {
  // ── Auth (no token needed) ───────────────────────────────────────────────
  register: (name: string, email: string, password: string) =>
    fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    }).then(handle<UserResponse>),

  login: (email: string, password: string) =>
    fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then(handle<AuthResponse>),

  getMe: () =>
    fetch(`${API_BASE}/auth/me`, {
      headers: { ...authHeader() },
    }).then(handle<UserResponse>),

  // ── Templates (JWT required) ─────────────────────────────────────────────
  listTemplates: () =>
    fetch(`${API_BASE}/templates/`, {
      headers: { ...authHeader() },
    }).then(handle<TemplateResponse[]>),

  getTemplate: (id: number | string) =>
    fetch(`${API_BASE}/templates/${id}`, {
      headers: { ...authHeader() },
    }).then(handle<TemplateResponse>),

  createTemplate: (form: FormData) =>
    fetch(`${API_BASE}/templates/`, {
      method: "POST",
      headers: { ...authHeader() },
      body: form,
    }).then(handle<TemplateResponse>),

  deleteTemplate: (id: number) =>
    fetch(`${API_BASE}/templates/${id}`, {
      method: "DELETE",
      headers: { ...authHeader() },
    }).then(handle<unknown>),

  updateTemplate: (id: number, patch: Partial<TemplateResponse>) =>
    fetch(`${API_BASE}/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(patch),
    }).then(handle<TemplateResponse>),

  updateBackground: (id: number, form: FormData) =>
    fetch(`${API_BASE}/templates/${id}/background`, {
      method: "PATCH",
      headers: { ...authHeader() },
      body: form,
    }).then(handle<TemplateResponse>),

  // ── Elements (JWT required) ──────────────────────────────────────────────
  listElements: (id: number | string) =>
    fetch(`${API_BASE}/templates/${id}/elements`, {
      headers: { ...authHeader() },
    }).then(handle<TemplateElementResponse[]>),

  createElement: (id: number, el: Partial<TemplateElementResponse>) =>
    fetch(`${API_BASE}/templates/${id}/elements`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(el),
    }).then(handle<TemplateElementResponse>),

  updateElement: (
    tid: number,
    eid: number,
    patch: Partial<TemplateElementResponse>,
  ) =>
    fetch(`${API_BASE}/templates/${tid}/elements/${eid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(patch),
    }).then(handle<TemplateElementResponse>),

  deleteElement: (tid: number, eid: number) =>
    fetch(`${API_BASE}/templates/${tid}/elements/${eid}`, {
      method: "DELETE",
      headers: { ...authHeader() },
    }).then(handle<unknown>),

  uploadImageElement: (tid: number, form: FormData) =>
    fetch(`${API_BASE}/templates/${tid}/image-elements`, {
      method: "POST",
      headers: { ...authHeader() },
      body: form,
    }).then(handle<TemplateElementResponse>),

  // ── Generation (JWT required) ────────────────────────────────────────────
  generateOne: async (tid: number, data: Record<string, string>, includeQr: boolean = false) => {
    const body = { ...data, include_qr: includeQr };
    const res = await fetch(`${API_BASE}/templates/${tid}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Generate failed: ${res.status}`);
    return res.blob();
  },

  generateBulk: async (tid: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/templates/${tid}/generate-bulk`, {
      method: "POST",
      headers: { ...authHeader() },
      body: form,
    });
    if (!res.ok) throw new Error(`Bulk generate failed: ${res.status}`);
    return res.blob();
  },

  // ── History (JWT required) ───────────────────────────────────────────────
  listHistory: (skip = 0, limit = 50) =>
    fetch(`${API_BASE}/certificates/?skip=${skip}&limit=${limit}`, {
      headers: { ...authHeader() },
    }).then(handle<GeneratedCertificateResponse[]>),
};
