import { llmErrorDetail, logIntegration } from "@/lib/observability/integration-log";

const PRIMARY = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACKS = (
  process.env.GEMINI_FALLBACK_MODELS ||
  "gemini-3.5-flash-lite,gemini-3.6-flash,gemini-2.5-flash-lite"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function modelsToTry() {
  return Array.from(new Set([PRIMARY, ...FALLBACKS]));
}

function isCapacityError(status: number, message: string) {
  const m = message.toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    m.includes("high demand") ||
    m.includes("resource exhausted") ||
    m.includes("try again later") ||
    m.includes("unavailable") ||
    m.includes("overloaded")
  );
}

async function callModel(model: string, prompt: string, opts?: { temperature?: number; maxTokens?: number }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Falta GEMINI_API_KEY en el entorno.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const started = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: opts?.temperature ?? 0.4,
        maxOutputTokens: opts?.maxTokens ?? 1024,
      },
    }),
  });

  const data = (await res.json()) as {
    error?: { message?: string };
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  if (!res.ok) {
    const message = data.error?.message || `Gemini HTTP ${res.status}`;
    const err = new Error(message) as Error & { status?: number; capacity?: boolean };
    err.status = res.status;
    err.capacity = isCapacityError(res.status, message);
    logIntegration({
      service: "gemini",
      ok: false,
      ms: Date.now() - started,
      status: res.status,
      model,
      detail: llmErrorDetail(err),
      op: "generateContent",
    });
    throw err;
  }

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  if (!text.trim()) {
    logIntegration({
      service: "gemini",
      ok: false,
      ms: Date.now() - started,
      status: res.status,
      model,
      detail: "empty",
      op: "generateContent",
    });
    throw new Error("Gemini no devolvió texto.");
  }
  logIntegration({
    service: "gemini",
    ok: true,
    ms: Date.now() - started,
    status: res.status,
    model,
    op: "generateContent",
  });
  return { text: text.trim(), model };
}

export async function geminiComplete(prompt: string, opts?: { temperature?: number; maxTokens?: number }) {
  const models = modelsToTry();
  let lastErr: Error | null = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const out = await callModel(model, prompt, opts);
      return out;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      const capacity = !!(e as { capacity?: boolean }).capacity;
      // En saturación, prueba el siguiente modelo; si es el último, un reintento corto
      if (capacity && i === models.length - 1) {
        await new Promise((r) => setTimeout(r, 900));
        try {
          return await callModel(model, prompt, opts);
        } catch (e2) {
          lastErr = e2 instanceof Error ? e2 : new Error(String(e2));
        }
      }
      if (!capacity && i === 0) {
        // Error de auth/configuración: no tiene sentido probar muchos
        const msg = lastErr.message.toLowerCase();
        if (msg.includes("api key") || msg.includes("permission") || msg.includes("403")) break;
      }
    }
  }

  const msg = lastErr?.message || "Error en Gemini";
  if (isCapacityError(0, msg) || (lastErr as { capacity?: boolean })?.capacity) {
    throw new Error(
      "Gemini está saturado ahora mismo (alta demanda). Espere unos segundos y vuelva a preguntar, o use las consultas rápidas del panel.",
    );
  }
  throw lastErr || new Error(msg);
}

export function isGeminiConfigured() {
  return !!process.env.GEMINI_API_KEY;
}
