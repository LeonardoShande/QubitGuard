# Arquitectura

## Capas

```text
frontend/ (TypeScript, tsc)  ->  app/api/  ->  app/quantum/  ->  Qiskit / Aer / FakeFez
 UI, análisis de contraseña      routers       experimentos      simulación
 (solo en el navegador)          FastAPI       puros de Python
                                 app/content/*.json (texto educativo)
```

- `frontend/`: TypeScript sin frameworks y sin dependencias de runtime, compilado con `tsc` a `frontend/dist`. Módulos: `main.ts` (UI y flujo Predice, Observa, Explica), `api.ts` (cliente con caché por sesión y deduplicación en vuelo), `charts.ts` (SVG con título, descripción y tabla), `progress.ts` (ruta de 5 pasos, 6 logros, XP, racha; `localStorage`), `password.ts` (analizador), `generator.ts` y `wordlist.ts` (generador CSPRNG), `password-ui.ts`, `dom.ts`.
- `app/main.py`: crea la aplicación FastAPI, monta los routers, añade gzip, cabeceras de seguridad y política de caché, y sirve solo los archivos públicos de `frontend/` (el resto devuelve 404).
- `app/api/quantum.py`: validación de peticiones (Pydantic, `extra="forbid"`) y llamada a los experimentos.
- `app/quantum/`: lógica de Qiskit (circuito de Grover, curva, Monte Carlo, comparación).
- `app/api/learn.py` y `app/content/*.json`: tarjetas poscuánticas y limitaciones; los JSON se leen una vez al importar.
- `app/api/challenge.py`: reto diario con `math` solamente (no importa Qiskit).

## Seguridad y rendimiento

- CSP `default-src 'self'` y demás cabeceras en cada respuesta (salvo `/docs`, `/redoc`, `/openapi.json`).
- Caché: `/api/learn/*`, `compare` y `capabilities` con `max-age=3600`; reto diario `max-age=300`; simulaciones `no-store`; estáticos `no-cache` con ETag.
- En servidor: caché en memoria de curva, comparación y simulaciones con semilla (copias aisladas).
- Límite de 2 simulaciones FakeFez simultáneas: la tercera recibe 503 con `Retry-After`.
- Demo pública: Cloudflare Tunnel ([DEPLOY.md](DEPLOY.md)). Sin dependencias externas en el navegador, así que funciona sin internet.

## Generador de contraseñas

Módulo del navegador, sin llamadas de red ni almacenamiento. `randomInt` toma `crypto.getRandomValues` con muestreo por rechazo; `generateChars`, `generatePassphrase` (2072 palabras, 11,02 bits por palabra) y `strengthen` (inserta caracteres al azar en posiciones al azar; solo cuenta la entropía añadida) devuelven `bits` y `groverBits` (la mitad). La entropía con clases obligatorias se calcula por inclusión-exclusión en escala logarítmica. Los tests prohíben red, almacenamiento y `Math.random` en estos módulos.

## Flujo

1. El usuario predice la probabilidad o las iteraciones óptimas.
2. El navegador llama a `POST /api/quantum/grover` con n, estado marcado, iteraciones, shots y si hay ruido.
3. El router valida y delega en `app/quantum`.
4. Qiskit construye el circuito, lo transpila para el backend (ideal o FakeFez), lo ejecuta en Aer y mide profundidad y puertas de dos qubits.
5. La respuesta incluye conteos, éxito medido y teórico, y el diagrama del circuito lógico. El frontend dibuja y compara predicción, teoría y medida, da XP y explica.

El reto diario es determinista: la fecha UTC (ISO) se pasa por sha256 y alimenta `random.Random`, de modo que todos ven el mismo reto sin base de datos. `?date=YYYY-MM-DD` permite pruebas y demos.

## Por qué cada pieza de Qiskit

| Pieza | Para qué | Por qué no otra cosa |
|---|---|---|
| `Statevector` | Probabilidad exacta por iteración (curva) | Sin ruido de muestreo; la curva de sin²((2k+1)·theta) se ve limpia |
| `AerSimulator` | Muestreo con shots y conteos | Imita la medición de un dispositivo real |
| `FakeFez` | Modelo de ruido realista | Enseña el efecto del ruido sin acceso a hardware (simulado, no real) |
| `transpile` | Profundidad y puertas de dos qubits | Son las métricas que importan en hardware real |

NumPy cubre Monte Carlo porque es estadística clásica y no necesita Qiskit.

## Decisiones

- Sin frameworks de frontend ni dependencias de runtime: menos superficie, menos dependencias, compilación simple con `tsc`, fácil de leer en un hackathon.
- Un solo proceso: FastAPI sirve API y estáticos; un solo comando para correr.
- Contraseñas (analizadas y generadas) solo en el navegador: ningún endpoint las recibe y un test lo comprueba.
- Accesibilidad como requisito: WCAG 2.2 AA, con contrastes medidos en [../frontend/UX_AUDIT.md](../frontend/UX_AUDIT.md).
- Contenido en JSON: se edita sin tocar código y se carga una vez.
- Contrato de API fijo en [API.md](API.md); limitaciones en [LIMITACIONES.md](LIMITACIONES.md).
