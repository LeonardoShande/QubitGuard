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
  constructor(public status: number, message: string) {
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
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}

export const api = {
  grover: (body: GroverRequest) => request<GroverResult>("/api/quantum/grover", body),
  groverCurve: (n_qubits: number) => request<GroverCurve>("/api/quantum/grover-curve", { n_qubits }),
  monteCarlo: (n_bits: number, trials: number) =>
    request<MonteCarloResult>("/api/quantum/montecarlo", { n_bits, trials, seed: null }),
  compare: (maxBits: number) => request<{ rows: CompareRow[] }>(`/api/quantum/compare?max_bits=${maxBits}`),
  pqc: () => request<{ cards: PqcCard[] }>("/api/learn/pqc"),
  limitations: () => request<{ items: Limitation[] }>("/api/learn/limitations"),
  daily: () => request<DailyChallenge>("/api/challenge/daily"),
};

/** Mensaje para el usuario según el tipo de fallo. */
export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return err.message + " Comprueba que el backend esté en marcha.";
    if (err.status === 501) return "Este módulo todavía se está preparando en el servidor. Prueba de nuevo en unos minutos.";
    if (err.status === 422) return `Revisa los valores: ${err.message || "el servidor los rechazó."}`;
    return `El servidor respondió con un error ${err.status}${err.message ? `: ${err.message}` : "."}`;
  }
  return "Algo falló al procesar la respuesta del servidor.";
}
