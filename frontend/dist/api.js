// Cliente del contrato docs/API.md. Rutas relativas: la UI se sirve desde el mismo FastAPI.
export class ApiError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
async function request(path, body) {
    let res;
    try {
        res = await fetch(path, body === undefined ? undefined : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    }
    catch {
        throw new ApiError(0, "No hay conexión con el servidor del laboratorio.");
    }
    if (!res.ok) {
        let detail = "";
        try {
            const data = (await res.json());
            detail = typeof data.detail === "string" ? data.detail
                : Array.isArray(data.detail) ? data.detail.map((d) => d.msg ?? "").join("; ") : "";
        }
        catch { /* cuerpo no JSON */ }
        throw new ApiError(res.status, detail);
    }
    return (await res.json());
}
// Caché en memoria por sesión para respuestas deterministas. Guarda la promesa, así que dos
// llamadas simultáneas comparten una sola petición; si falla se borra para poder reintentar.
const memo = new Map();
function cached(key, load) {
    let hit = memo.get(key);
    if (!hit) {
        hit = load();
        memo.set(key, hit);
        hit.catch(() => memo.delete(key));
    }
    return hit;
}
export const api = {
    grover: (body) => request("/api/quantum/grover", body),
    groverCurve: (n_qubits) => cached(`curve:${n_qubits}`, () => request("/api/quantum/grover-curve", { n_qubits })),
    monteCarlo: (n_bits, trials) => request("/api/quantum/montecarlo", { n_bits, trials, seed: null }),
    compare: (maxBits) => {
        const path = `/api/quantum/compare?max_bits=${maxBits}`;
        return cached(path, () => request(path));
    },
    pqc: () => cached("/api/learn/pqc", () => request("/api/learn/pqc")),
    limitations: () => cached("/api/learn/limitations", () => request("/api/learn/limitations")),
    daily: () => cached("/api/challenge/daily", () => request("/api/challenge/daily")),
};
/** Mensaje para el usuario según el tipo de fallo. */
export function describeError(err) {
    if (err instanceof ApiError) {
        if (err.status === 0)
            return err.message + " Comprueba que el backend esté en marcha.";
        if (err.status === 503)
            return "El simulador está ocupado con otra ejecución. Espera un par de segundos y reintenta.";
        if (err.status === 501)
            return "Este módulo todavía se está preparando en el servidor. Prueba de nuevo en unos minutos.";
        if (err.status === 422)
            return `Revisa los valores: ${err.message || "el servidor los rechazó."}`;
        return `El servidor respondió con un error ${err.status}${err.message ? `: ${err.message}` : "."}`;
    }
    return "Algo falló al procesar la respuesta del servidor.";
}
