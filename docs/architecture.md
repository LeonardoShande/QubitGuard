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
- `app/api/challenge.py`: reto diario con módulos de la biblioteca estándar (no importa Qiskit).

## Seguridad y rendimiento

- CSP `default-src 'self'`, con estilos inline e imágenes `data:` permitidos. `/docs`, `/redoc` y `/openapi.json` omiten esa CSP y conservan las demás cabeceras de seguridad.
- Caché: `/api/learn/*`, `compare` y `capabilities` con `max-age=3600`; reto diario `max-age=300`; simulaciones `no-store`; estáticos `no-cache` con ETag.
- En servidor: caché en memoria de curva, comparación y simulaciones con semilla (copias aisladas).
- Límite de 2 simulaciones FakeFez simultáneas por proceso: una nueva ejecución espera hasta 10 segundos por un cupo; si no lo obtiene, recibe 503 con `Retry-After: 2`.
- Demo pública: Cloudflare Tunnel ([DEPLOY.md](DEPLOY.md)). La interfaz y los experimentos funcionan con el servidor local sin internet después de instalar dependencias; el túnel, las fuentes enlazadas y los recursos externos de Swagger/ReDoc sí necesitan conexión.

## Generador de contraseñas

Módulo del navegador, sin llamadas de red ni almacenamiento. `randomInt` toma `crypto.getRandomValues` con muestreo por rechazo; `generateChars`, `generatePassphrase` (2072 palabras, 11,02 bits por palabra) y `strengthen` (inserta caracteres al azar en posiciones al azar; solo cuenta la entropía añadida) devuelven `bits` y `groverBits` (la mitad). La entropía con clases obligatorias se calcula por inclusión-exclusión en escala logarítmica. Los tests prohíben red, almacenamiento y `Math.random` en estos módulos.

## Flujo

1. El usuario predice la probabilidad o las iteraciones óptimas.
2. El navegador llama a `POST /api/quantum/grover` con n, estado marcado, iteraciones, shots y si hay ruido.
3. El router valida y delega en `app/quantum`.
4. Qiskit construye el circuito, lo transpila para el backend (ideal o FakeFez), lo ejecuta en Aer y mide profundidad y puertas de dos qubits.
5. La respuesta incluye conteos, éxito medido y teórico, y el diagrama del circuito lógico. El frontend dibuja y compara predicción, teoría y medida, da XP y explica.

El reto diario es determinista: una fecha ISO se pasa por SHA-256 y alimenta `random.Random`, de modo que la misma fecha produce el mismo reto sin base de datos. La API usa UTC si se omite `?date=YYYY-MM-DD`; el frontend envía expresamente la fecha local del navegador para alinear reto, racha y topes diarios.

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
- Accesibilidad como objetivo: criterios WCAG 2.2 AA y contrastes registrados en [../frontend/UX_AUDIT.md](../frontend/UX_AUDIT.md), sin certificación de conformidad completa.
- Contenido en JSON: se edita sin tocar código y se carga una vez.
- Contrato de API fijo en [API.md](API.md); limitaciones en [LIMITACIONES.md](LIMITACIONES.md).

Para el recorrido por funciones y las notas de compatibilidad del starter, consulta [GUIA_DEL_CODIGO.md](GUIA_DEL_CODIGO.md). El análisis de adecuación al reto está en [REVISION_PROMPT_Y_BASES.md](REVISION_PROMPT_Y_BASES.md).
