// Cliente del contrato docs/API.md. Rutas relativas: la UI se sirve desde el mismo FastAPI.

export interface GroverRequest {
  n_qubits: number;
  marked_state: string;
  iterations: number | null;
  shots: number;
  seed: number | null;
  noisy: boolean;
}

export interface GroverResult {
  counts: Record<string, number>;
  measured_success: number;
  theoretical_success: number;
  optimal_iterations: number;
  iterations: number;
  n_qubits: number;
  marked_state: string;
  shots: number;
  depth: number;
  two_qubit_gates: number;
  backend: string;
  noisy: boolean;
  circuit_text: string;
}

export interface GroverCurve {
  n_qubits: number;
  optimal_iterations: number;
  iterations: number[];
  probability: number[];
}

export interface MonteCarloResult {
  n_bits: number;
  N: number;
  trials: number;
  mean_attempts: number;
  expected_attempts: number;
  histogram: { bins: number[]; counts: number[] };
}

export interface CompareRow {
  bits: number;
  N: number;
  classical_expected: number;
  grover_iterations: number;
  speedup: number;
}

export interface PqcCard {
  id: string;
  title: string;
  threat: string;
  targets: string[];
  summary: string;
  impact: string;
  mitigation: string;
  sources: Array<{ label: string; url: string }>;
}

export interface Limitation {
  id: string;
  title: string;
  detail: string;
}

export interface DailyChallenge {
  date: string;
  id: string;
  kind: "optimal_iterations" | "success_probability" | "classical_vs_grover";
  question: string;
  n_qubits: number;
  options: string[];
  answer_index: number;
  explanation: string;
}

export class ApiError extends Error {
  /** Segundos de Retry-After (503 del simulador ocupado); 0 si no aplica. */
  constructor(public status: number, message: string, public retryAfter = 0) {
    super(message);
  }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, body === undefined ? undefined : {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "No hay conexión con el servidor del laboratorio.");
  }
  if (!res.ok) {
    let detail = "";
    try {
      const data = (await res.json()) as { detail?: unknown };
      detail = typeof data.detail === "string" ? data.detail
        : Array.isArray(data.detail) ? data.detail.map((d: { msg?: string }) => d.msg ?? "").join("; ") : "";
    } catch { /* cuerpo no JSON */ }
    const wait = Number(res.headers.get("Retry-After"));
    throw new ApiError(res.status, detail, Number.isFinite(wait) && wait > 0 ? Math.min(wait, 60) : res.status === 503 ? 2 : 0);
  }
  return (await res.json()) as T;
}

// Caché en memoria por sesión para respuestas deterministas. Guarda la promesa, así que dos
// llamadas simultáneas comparten una sola petición; si falla se borra para poder reintentar.
const memo = new Map<string, Promise<unknown>>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  let hit = memo.get(key) as Promise<T> | undefined;
  if (!hit) {
    hit = load();
    memo.set(key, hit);
    hit.catch(() => memo.delete(key));
  }
  return hit;
}

export const api = {
  grover: (body: GroverRequest) => request<GroverResult>("/api/quantum/grover", body),
  groverCurve: (n_qubits: number) =>
    cached(`curve:${n_qubits}`, () => request<GroverCurve>("/api/quantum/grover-curve", { n_qubits })),
  monteCarlo: (n_bits: number, trials: number) =>
    request<MonteCarloResult>("/api/quantum/montecarlo", { n_bits, trials, seed: null }),
  compare: (maxBits: number) => {
    const path = `/api/quantum/compare?max_bits=${maxBits}`;
    return cached(path, () => request<{ rows: CompareRow[] }>(path));
  },
  pqc: () => cached("/api/learn/pqc", () => request<{ cards: PqcCard[] }>("/api/learn/pqc")),
  limitations: () => cached("/api/learn/limitations", () => request<{ items: Limitation[] }>("/api/learn/limitations")),
  /** `date` es la fecha local del navegador; forma parte de la clave, así que tras medianoche se pide el reto nuevo. */
  daily: (date: string) => {
    const path = `/api/challenge/daily?date=${encodeURIComponent(date)}`;
    return cached(path, () => request<DailyChallenge>(path));
  },
};

/** Mensaje para el usuario según el tipo de fallo. */
export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return err.message + " Comprueba que el backend esté en marcha.";
    if (err.status === 503) return `Simulador ocupado con otra ejecución. Podrás reintentar en ${err.retryAfter || 2} s.`;
    if (err.status === 501) return "Este módulo todavía se está preparando en el servidor. Prueba de nuevo en unos minutos.";
    if (err.status === 422) return `Revisa los valores: ${err.message || "el servidor los rechazó."}`;
    return `El servidor respondió con un error ${err.status}${err.message ? `: ${err.message}` : "."}`;
  }
  return "Algo falló al procesar la respuesta del servidor.";
}
