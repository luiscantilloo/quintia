/**
 * @nucleo/client — contrato del frente hacia el núcleo (nucleo-api).
 * Vive en el front porque Turbopack no importa bien paquetes fuera del repo.
 * La copia de referencia en nucleo-api está en libs/client.
 */

export type ApiJson = Record<string, unknown> & {
  ok?: boolean;
  error?: string;
  status?: number;
};

export type PublicProgram = {
  id?: string;
  nombre?: string;
  version?: string;
  marca?: Record<string, unknown>;
  roles?: unknown[];
  herramientas?: unknown[];
  [key: string]: unknown;
};

function resolveApiPath(path: string) {
  if (path.startsWith("/api/")) return path;
  if (path.startsWith("/")) return `/api${path}`;
  return `/api/${path}`;
}

function programIdHeader() {
  return (
    process.env.NEXT_PUBLIC_PROGRAM_ID ||
    process.env.PROGRAM_ID ||
    "quintia"
  )
    .trim()
    .toLowerCase();
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers({ Accept: "application/json" });
  if (init.headers) {
    new Headers(init.headers).forEach((v, k) => headers.set(k, v));
  }
  if (!headers.has("x-program-id")) {
    headers.set("x-program-id", programIdHeader());
  }
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(resolveApiPath(path), {
    ...init,
    credentials: init.credentials ?? "same-origin",
    headers,
  });
}

export async function apiJson<T extends ApiJson = ApiJson>(
  path: string,
  init: RequestInit = {},
): Promise<{ res: Response; data: T }> {
  const res = await apiFetch(path, init);
  let data = {} as T;
  try {
    data = (await res.json()) as T;
  } catch {
    /* cuerpo vacío o no JSON */
  }
  return { res, data };
}

export async function getProgram() {
  return apiJson<ApiJson & { program?: PublicProgram }>("/api/program");
}

export async function getHealth() {
  return apiJson<ApiJson & { service?: string; programId?: string }>("/api/health");
}
