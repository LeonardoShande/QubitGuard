# Guion del pitch QubitGuard (2:45, 4 integrantes)

Tiempo total 2:45, 15 s de margen para los 3:00. Roles: A, B, C, D (asignar nombres: TODO).
Las cifras de este guion son resultados medidos (ver README, "Resultados medidos"). Lo que muestre la app en vivo puede variar en el tercer decimal según el estado marcado; leer la pantalla, no el guion.

## Mapa de la rúbrica

| Criterio (peso) | Bloque que lo responde |
|---|---|
| Innovación, validación y limitaciones (25 %) | Gancho/Problema (A), Validación y limitaciones (D), demo del ruido (C) |
| Qiskit y claridad (25 %) | Mapeo estadístico a cuántico (B), Por qué Qiskit (B), demo (C) |
| EdTech: metodología y ganas de volver (20 %) | Demo Predice-Observa-Explica (C), Impacto EdTech (A) |
| Rigor y reproducibilidad (15 %) | Por qué Qiskit y rigor (B), Validación (D) |
| Arquitectura (15 %) | Seguridad y arquitectura (D) |

## Tiempos

| Tiempo | Bloque | Quién |
|---|---|---|
| 0:00-0:15 | Gancho | A |
| 0:15-0:30 | Problema | A |
| 0:30-0:50 | Mapeo estadístico a cuántico | B |
| 0:50-1:35 | Demo en vivo | C |
| 1:35-1:50 | Por qué Qiskit y rigor | B |
| 1:50-2:05 | Seguridad y arquitectura | D |
| 2:05-2:20 | Validación y limitaciones | D |
| 2:20-2:40 | Impacto EdTech | A |
| 2:40-2:45 | Cierre | A |

## 0:00-0:15 Gancho (A)
"Adivina un número secreto entre 1 y 16. Al azar esperas 8,5 intentos. Un ordenador cuántico lo encuentra con 3 pasos. Aquí no lo lees: primero apuestas, luego lo ves."

## 0:15-0:30 Problema (A)
Lo cuántico se enseña como magia o como fórmulas sin intuición. Y la amenaza es real: hay datos que se guardan hoy para descifrarlos después (harvest now, decrypt later). Falta una forma activa de entenderlo.

## 0:30-0:50 Mapeo estadístico a cuántico (B)
- Estadística: búsqueda aleatoria Monte Carlo. Con N = 2^n candidatos, intentos esperados (N+1)/2. Con N=16, 8,5.
- Cuántico: amplificación de amplitud de Grover, k = floor(π/4 · √N). Con n=4, k=3.
- P(k) = sin²((2k+1)θ), θ = asin(1/√N). Para n=4, k=3, la teoría da 96,1 %.
- Idea clave: Monte Carlo crece como N, Grover como √N. Mejora cuadrática, no exponencial.

## 0:50-1:35 Demo en vivo (C), 45 s
Orden exacto (nombres de la página; practicar con cronómetro):
1. (0:50, 5 s) En "Tu ruta" señalar los 5 pasos y el contador de logros.
2. (0:55, 20 s) Ir a "Laboratorio Grover": 4 qubits, un estado marcado, iteraciones óptimas. En "Tu predicción" mover el control de "Probabilidad de acertar" (decirlo en voz alta, p. ej. "creo que 60 %"). Pulsar "Ejecutar circuito". En "Predice, observa, explica" leer los tres números: predijiste, teoría 96,1 %, medido (leer la pantalla; en la prueba salió 0,953 a 0,957). Leer la explicación frente al azar (k/N) y la XP ganada.
3. (1:15, 10 s) Activar "Ruido de un procesador IBM (FakeFez)", subir a 6 qubits con 6 iteraciones y 256 disparos, ejecutar. Señalar profundidad y puertas de 2 qubits: el éxito cae a niveles de azar (medido con el estado 100000: 0,031 con profundidad 4447 y 1706 puertas de 2 qubits; azar = 0,0156). El ruido borra la amplificación.
4. (1:25, 10 s) Ir a "Tu contraseña", panel "Genera tu contraseña": modo "Caracteres" con 20 de longitud (ver bits en pantalla), pulsar "Generar otra". Señalar los bits, "Efectivos frente a Grover" y la "Meta resistente a Grover: 128 bits" (64 efectivos). Mencionar que el modo "Frase de palabras" necesita 12 palabras para llegar a esa meta y que "Mejorar la mía" suma bits a tu base. Decir: "se genera aquí, en tu navegador, sin semilla".
Plan B si falla la red o el servidor: video grabado de la misma secuencia. La app funciona sin internet; solo necesita el servidor local o el túnel.

## 1:35-1:50 Por qué Qiskit y rigor (B)
Circuitos con Qiskit 2.6; `AerSimulator` para disparos; `FakeFez` para el ruido de un chip IBM (simulado, no hardware real); `Statevector` para la curva exacta y `transpile` para medir profundidad y puertas de 2 qubits. Validado: error máximo 6e-14 entre la curva y la fórmula, 42 pruebas de Python y 23 de frontend, todo con semilla fija y reproducible con los comandos del README.

## 1:50-2:05 Seguridad y arquitectura (D)
Un proceso: FastAPI sirve API y frontend (TypeScript sin dependencias de runtime). Las contraseñas, analizadas o generadas, nunca salen del navegador; tests prohíben red, almacenamiento y Math.random en ese código. CSP `default-src 'self'`, solo archivos públicos, caché, gzip y máximo 2 simulaciones ruidosas a la vez. Demo pública con Cloudflare Tunnel. Accesible WCAG 2.2 AA: contraste medido, teclado, 320 px, gráficos con texto alternativo.

## 2:05-2:20 Validación y limitaciones (D)
Resultados medidos: n=4, k=3, 2048 disparos, éxito medido 0,954 frente a 0,961 teórico. Monte Carlo de 10 bits con 5000 ensayos: media 513,3 frente a 512,5 esperado. Y con FakeFez en n=6, el ruido lo deja en azar. Decimos lo que no hace: el oráculo ya conoce la respuesta, la ventaja es cuadrática, el ruido es simulado y hoy no hay ataque cuántico práctico a AES. Retención en aula: sin medir todavía.

## 2:20-2:40 Impacto EdTech (A)
Desde 14 años, sin álgebra lineal. Metodología Predice, Observa, Explica: te comprometes antes de mirar y el resultado te corrige. Ruta de 5 pasos, 6 logros, XP y reto diario de unos 3 minutos con racha: una razón para volver mañana. El docente lo usa como actividad de aula.

## 2:40-2:45 Cierre (A)
"Monte Carlo adivina. Grover amplifica. Predice, mira y compruébalo en 3 minutos al día. Gracias."

---

## Preguntas del jurado

### 1. ¿Por qué cuántico y no solo una animación?
Los resultados no están pintados: cada ejecución construye un circuito real en Qiskit, lo simula con Aer (con ruido FakeFez si se activa) y muestra disparos medidos. La curva sin²((2k+1)θ) sale de Statevector y coincide con la fórmula (error máximo 6e-14). Si el estudiante pasa del k óptimo, la probabilidad baja (sobre-rotación), algo que una animación fija no enseña.

### 2. ¿La contraseña se envía a algún lado?
No. Analizar y generar ocurren en el navegador; ningún endpoint recibe contraseñas y un test lo comprueba. La CSP `default-src 'self'` impide cargar código de terceros. Se verifica en la pestaña Network.

### 3. ¿Por qué querrán volver, y para qué edad?
Desde 14 años. Hay un bucle corto: predecir, ver, recibir XP, subir la ruta y mantener la racha del reto diario (unos 3 minutos). La retención aún no está medida; haría falta un piloto en aula.

### 4. ¿Esto rompe contraseñas reales hoy?
No. Simulamos hasta 6 qubits. Grover da mejora cuadrática y hoy no existe hardware tolerante a fallos que ataque AES. Lo útil es entender por qué se recomiendan claves de 128 bits o más y migrar a criptografía poscuántica (NIST FIPS 203/204/205).

### 5. ¿Qué harían con más tiempo o hardware real?
Ejecutar los circuitos en un backend IBM real con qiskit-ibm-runtime y compararlos con FakeFez; medir retención en un piloto de aula; mapear más conceptos de estadística y ML a cuántico.

### 6. ¿Y si hago ingeniería inversa del generador?
El código es público a propósito, y aun así no sirve para reproducir una contraseña. No hay semilla ni estado: cada carácter o palabra sale de `crypto.getRandomValues`, el generador criptográfico del navegador, con muestreo por rechazo para que no haya sesgo. Leer el código solo revela el método, no el resultado; la seguridad está en la entropía, no en ocultar el algoritmo (principio de Kerckhoffs). La contraseña tampoco se envía ni se guarda. Lo que sí se puede revisar es el cálculo de bits, que es exacto por inclusión-exclusión, y los tests que prohíben `Math.random`.
