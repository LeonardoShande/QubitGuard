# Guion del pitch QubitGuard (2:45, 4 integrantes)

Tiempo total 2:45, 15 s de margen para los 3:00. Roles: A, B, C, D (asignar nombres: TODO). El deck tiene 8 slides (`pitch/QubitGuard_pitch.pptx`); la columna "Slide" indica cuál mostrar.
Las cifras de este guion son resultados medidos (ver README, secciones 5 y 7). Lo que muestre la app en vivo puede variar en el tercer decimal según el estado marcado; leer la pantalla, no el guion.

## Mapa de la rúbrica

| Criterio (peso) | Bloque que lo responde |
|---|---|
| Innovación, validación y limitaciones (25 %) | Problema (A), el ruido borra la amplificación (B), Validación y limitaciones (D) |
| Qiskit y claridad (25 %) | Mapeo estadístico a cuántico (B), Por qué Qiskit (B), demo y explorador (C) |
| EdTech: metodología y ganas de volver (20 %) | Demo Predice-Observa-Explica (C), Impacto EdTech (A) |
| Rigor y reproducibilidad (15 %) | Por qué Qiskit y rigor (B), Validación (D) |
| Arquitectura (15 %) | Seguridad y arquitectura (D) |

## Tiempos

| Tiempo | Bloque | Quién | Slide |
|---|---|---|---|
| 0:00-0:12 | Gancho | A | 1 |
| 0:12-0:30 | Problema | A | 2 |
| 0:30-0:48 | Mapeo estadístico a cuántico | B | 3 |
| 0:48-1:38 | Demo en vivo (50 s) | C | app |
| 1:38-1:55 | Por qué Qiskit y el ruido | B | 5, 6 |
| 1:55-2:08 | Seguridad y arquitectura | D | 4 |
| 2:08-2:22 | Validación y limitaciones | D | 7 |
| 2:22-2:40 | Impacto EdTech | A | 8 |
| 2:40-2:45 | Cierre | A | 8 |

## 0:00-0:12 Gancho (A)
"Adivina un número secreto entre 1 y 16. Al azar esperas 8,5 intentos; un ordenador cuántico lo encuentra con 3 pasos. Aquí no lo lees: primero apuestas, luego lo ves."

## 0:12-0:30 Problema (A)
Es la sección "El problema" de la página. Lo cuántico se enseña como magia o como fórmulas sin intuición: las amplitudes pueden ser negativas y se cancelan, y la estadística escolar no lo anticipa. Además, la amenaza se cuenta con alarmismo ("romperá todas las contraseñas") cuando en realidad hay datos que se guardan hoy para descifrarlos mañana (harvest now, decrypt later). Falta una forma activa de entenderlo. Público: desde 14 años, unos 3 minutos al día.

## 0:30-0:48 Mapeo estadístico a cuántico (B)
- Eje del reto: distribuciones de probabilidad a superposición y amplitudes. Distribución uniforme: amplitud 1/√N en cada estado.
- Estadística: búsqueda aleatoria Monte Carlo. Con N = 2^n candidatos, intentos esperados (N+1)/2. Con N=16, 8,5.
- Cuántico: amplificación de amplitud de Grover, k = floor(π/4 · √N). Con n=4, k=3. P(k) = sin²((2k+1)θ), θ = asin(1/√N): teoría 96,1 %.
- Idea clave: Monte Carlo crece como N, Grover como √N. Mejora cuadrática, no exponencial.
- Aclarar si preguntan: no implementamos Quantum Amplitude Estimation; Monte Carlo es la referencia clásica.

## 0:48-1:38 Demo en vivo (C), 50 s
Orden exacto (nombres de la página; practicar con cronómetro):
1. (0:48, 4 s) En "Tu ruta" señalar los 5 pasos y el contador de logros.
2. (0:52, 20 s) Ir a "Laboratorio Grover": 4 qubits, un estado marcado, iteraciones óptimas. En "Tu predicción" mover "Probabilidad de acertar" (decirlo en voz alta, p. ej. "creo que 60 %"). Pulsar "Ejecutar circuito". En "Predice, observa, explica" leer los tres números: predijiste, teoría 96,1 %, medido (leer la pantalla; en la prueba salió 0,953 a 0,957). Leer una línea de la explicación y la XP ganada.
3. (1:12, 12 s) Ir a "Amplitudes" (el explorador se desbloquea tras la predicción): 4 qubits, pulsar "Siguiente iteración" una vez para ver el oráculo (cambia el signo del marcado) y el difusor (refleja respecto a la media), y arrastrar iteraciones más allá del óptimo: la flecha sigue girando y la probabilidad baja. Se calcula en el navegador, sin servidor.
4. (1:24, 8 s) Volver al laboratorio, activar "Ruido de un procesador IBM (FakeFez)", 6 qubits, 6 iteraciones, 256 disparos, ejecutar. Señalar profundidad y puertas de 2 qubits: el éxito cae a nivel de azar (medido con el estado 101010: 0,031 con profundidad 4447 y 1706 puertas de 2 qubits; azar = 0,0156). El ruido borra la amplificación.
5. (1:32, 6 s) "Tu contraseña", panel "Genera tu contraseña": 20 caracteres, pulsar "Generar otra", señalar los bits y "Efectivos frente a Grover" (la meta es 128 bits, 64 efectivos). Decir: "se genera aquí, en tu navegador, sin semilla".

Si falta tiempo, recortar el paso 5. Plan B si falla la red o el servidor: video grabado de la misma secuencia. La app funciona sin internet; solo necesita el servidor local o el túnel.

## 1:38-1:55 Por qué Qiskit y el ruido (B)
Slides 5 y 6. Circuitos con Qiskit 2.6 que se ejecutan: `AerSimulator` para disparos, `FakeFez` para el ruido de un chip IBM (simulado, no hardware real), `Statevector` para la curva exacta y `transpile` para medir profundidad y puertas de 2 qubits. Argumento fuerte, medido con nuestro CLI en FakeFez (semilla 7, 1024 disparos): el éxito baja de 0,80 con 3 qubits a 0,017 con 6, igual que el azar. El ruido NISQ borra la amplificación al crecer el circuito. El CLI (`dry-run` e `ibm`) ya está listo para hardware real; todavía no se ha ejecutado.

Tabla de apoyo (slide 6):

| n | Profundidad | Puertas de 2 qubits | Éxito medido | Ideal | Azar |
|---|---|---|---|---|---|
| 3 | 137 | 39 | 0,802 | 0,945 | 0,125 |
| 4 | 448 | 111 | 0,662 | 0,961 | 0,0625 |
| 5 | 1456 | 517 | 0,184 | 0,999 | 0,031 |
| 6 | 4447 | 1706 | 0,0166 | 0,997 | 0,0156 |

## 1:55-2:08 Seguridad y arquitectura (D)
Slide 4. Un proceso: FastAPI sirve API y frontend (TypeScript sin dependencias de runtime). Las contraseñas, analizadas o generadas, nunca salen del navegador; tests prohíben red, almacenamiento y Math.random en ese código. CSP `default-src 'self'`, solo archivos públicos, caché, gzip y máximo 2 simulaciones ruidosas a la vez. Demo pública con Cloudflare Tunnel o Docker/CasaOS. Objetivo WCAG 2.2 AA verificado parcialmente: teclado, 320 px, contraste medido.

## 2:08-2:22 Validación y limitaciones (D)
Slide 7. Medido: n=4, k=3, 2048 disparos, éxito 0,953 frente a 0,961 teórico; Monte Carlo de 10 bits con 5000 ensayos, media 513,3 frente a 512,5; curva Statevector contra fórmula con error máximo 6e-14; 72 pruebas de Python y 37 de frontend. Lo que no hace: el oráculo ya conoce la respuesta, la ventaja es cuadrática, el ruido es simulado y no hay ejecución en hardware real, no hay QAE y hoy no hay ataque cuántico práctico a AES. El piloto con usuarios y la retención en aula están pendientes.

## 2:22-2:40 Impacto EdTech (A)
Slide 8. Desde 14 años, sin álgebra lineal. Metodología Predice, Observa, Explica: te comprometes antes de mirar y el resultado te corrige. Ruta de 5 pasos, 6 logros, XP y reto diario de unos 3 minutos con racha: una razón para volver mañana. El docente lo usa como actividad de aula.

## 2:40-2:45 Cierre (A)
"Monte Carlo adivina. Grover amplifica. Predice, mira y compruébalo en 3 minutos al día. Gracias."

---

## Preguntas del jurado

### 1. ¿Por qué cuántico y no solo una animación?
Los resultados del laboratorio no están pintados: cada ejecución construye un circuito real en Qiskit, lo simula con Aer (con ruido FakeFez si se activa) y muestra disparos medidos. La curva sin²((2k+1)θ) sale de Statevector y coincide con la fórmula (error máximo 6e-14). El explorador sí usa la fórmula, y lo decimos: su valor es didáctico y su fidelidad está comprobada contra Qiskit de 2 a 6 qubits. Si el estudiante pasa del k óptimo, la probabilidad baja (sobre-rotación), algo que una animación fija no enseña.

### 2. ¿La contraseña se envía a algún lado?
No. Analizar y generar ocurren en el navegador; ningún endpoint recibe contraseñas y un test lo comprueba. La CSP `default-src 'self'` impide cargar código de terceros. Se verifica en la pestaña Network.

### 3. ¿Por qué querrán volver, y para qué edad?
Desde 14 años. Hay un bucle corto: predecir, ver, recibir XP, subir la ruta y mantener la racha del reto diario (unos 3 minutos). La retención aún no está medida; haría falta un piloto en aula.

### 4. ¿Esto rompe contraseñas reales hoy?
No. Simulamos hasta 6 qubits. Grover da mejora cuadrática y hoy no existe hardware tolerante a fallos que ataque AES. Lo útil es entender por qué se recomiendan claves de 128 bits o más y migrar a criptografía poscuántica (NIST FIPS 203/204/205).

### 5. ¿Lo ejecutaron en hardware cuántico real de IBM?
No, y lo decimos. Medimos en FakeFez, un modelo de ruido local de un procesador IBM. Dejamos listo un CLI (`scripts/run_ibm_hardware.py`) que usa el mismo circuito, `generate_preset_pass_manager` y `SamplerV2`, con los modos `fake`, `dry-run`, `ibm` y recuperación por `--job-id`; el token nunca va en argumentos. Falta una cuenta con cuota para enviar el primer job. Con 3 qubits esperamos algo parecido a FakeFez, pero no lo afirmamos hasta medirlo.

### 6. ¿Implementan Quantum Amplitude Estimation?
No. Nuestro par es distribuciones de probabilidad a superposición y amplitudes. El Monte Carlo del laboratorio es la referencia clásica de la búsqueda; no lo presentamos como QAE.

### 7. ¿Qué harían con más tiempo o hardware real?
Ejecutar un job de 3 qubits en un backend IBM real con el CLI y compararlo con FakeFez; medir comprensión y retención en un piloto de aula; mapear más conceptos de estadística y ML a cuántico.

### 8. ¿Y si hago ingeniería inversa del generador?
El código es público a propósito, y aun así no sirve para reproducir una contraseña. No hay semilla ni estado: cada carácter o palabra sale de `crypto.getRandomValues`, el generador criptográfico del navegador, con muestreo por rechazo para que no haya sesgo. Leer el código solo revela el método, no el resultado; la seguridad está en la entropía, no en ocultar el algoritmo (principio de Kerckhoffs). La contraseña tampoco se envía ni se guarda. Lo que sí se puede revisar es el cálculo de bits, que es exacto por inclusión-exclusión, y los tests que prohíben `Math.random`.
