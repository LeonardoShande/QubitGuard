# Guion del pitch QubitGuard (2:45, 4 integrantes)

Tiempo total 2:45, 15 s de margen para los 3:00. Roles: A, B, C, D (asignar nombres: TODO).
Cifras en "[dato de la demo]" se rellenan con lo que muestre la app en vivo; no se inventan.

| Tiempo | Bloque | Quién |
|---|---|---|
| 0:00-0:15 | Gancho | A |
| 0:15-0:30 | Problema | A |
| 0:30-0:55 | Mapeo estadístico a cuántico | B |
| 0:55-1:35 | Demo en vivo | C |
| 1:35-1:50 | Por qué Qiskit | B |
| 1:50-2:05 | Privacidad | D |
| 2:05-2:20 | Limitaciones | D |
| 2:20-2:40 | Impacto y adicción | A |
| 2:40-2:45 | Cierre | A |

## 0:00-0:15 Gancho (A)
"Adivina un número secreto entre 1 y 16. ¿Cuántos intentos esperas? Unos 8,5. Un ordenador cuántico lo encuentra en 3 pasos. ¿Cómo puede ser? Hoy lo vas a jugar, no solo leer."

## 0:15-0:30 Problema (A)
Los estudiantes aprenden "computación cuántica" como magia o como fórmulas sin intuición. Y la amenaza es real: el cifrado de hoy podría romperse en el futuro, y hay datos que se guardan ahora para descifrarlos después (harvest now, decrypt later). Falta una forma activa de entenderlo.

## 0:30-0:55 Mapeo estadístico a cuántico (B)
- Estadística: búsqueda aleatoria Monte Carlo. Con N = 2^n candidatos, el número esperado de intentos es (N+1)/2. Con N=16, 8,5 intentos.
- Cuántico: amplificación de amplitud de Grover. Iteraciones óptimas k = floor(π/4 · √N). Con n=4, k=3.
- Probabilidad de éxito: P(k) = sin²((2k+1)θ), con θ = asin(1/√N). Para n=4 y k=3 la teoría da P ≈ 96,1 %.
- Idea clave: Monte Carlo crece como N; Grover como √N. Es una mejora cuadrática, no exponencial.

## 0:55-1:35 Demo en vivo (C), 40 s
Pasos concretos (practicar el orden):
1. Pestaña "Reto diario": mostrar racha, XP y nivel; resolver el reto de hoy (5 s).
2. Pestaña "Laboratorio Grover": elegir 4 qubits y marcar un secreto (p. ej. 1010).
3. Pulsar "Ejecutar" con iteraciones = 3 y ruido FakeFez activado. Señalar el histograma: el secreto domina con [dato de la demo] % de los disparos.
4. Señalar la curva sin² exacta (Statevector) y el punto k=3 cerca de 96,1 %; comentar que la diferencia con el histograma es el ruido simulado.
5. Subir a 5 o 6 qubits y mostrar que el óptimo cambia ([dato de la demo]).
6. Pestaña "Azar frente a Grover": mostrar la tabla de speedup; para n=4, 8,5 intentos esperados frente a 3 iteraciones.
7. Mostrar el circuito dibujado (oráculo + difusor repetidos).
Plan B si falla la red: video grabado de la misma secuencia.

## 1:35-1:50 Por qué Qiskit (B)
Circuitos construidos con Qiskit 2.6; simulación con Qiskit Aer; ruido tomado del modelo FakeFez (simulado, no hardware real) para que el estudiante vea que los dispositivos reales fallan; Statevector para la curva exacta y validar contra la teoría; qiskit-ibm-runtime listo para ejecutar en hardware IBM con credenciales propias. Reproducible: tests pytest y CI en GitHub Actions.

## 1:50-2:05 Privacidad (D)
El analizador de contraseñas corre 100 % en el navegador (TypeScript local). La contraseña nunca va al backend; hay un test que lo comprueba. Además la sección poscuántica explica Grover contra AES, Shor contra RSA/ECC y los estándares NIST FIPS 203, 204 y 205.

## 2:05-2:20 Limitaciones (D)
Decimos lo que no hace: el ruido es simulado, no hardware real; Grover solo da mejora cuadrática, no rompe AES hoy; simulamos hasta 6 qubits porque la simulación clásica crece exponencialmente; con ruido la probabilidad real baja respecto a la teoría ([dato de la demo]). Validamos cada resultado contra la fórmula sin² y con tests.

## 2:20-2:40 Impacto y adicción (A)
Pensado desde 14 años. Un reto diario de unos 3 minutos con racha, XP y niveles: hábito diario, no maratón semanal. Es adictivo porque el feedback es inmediato y el jugador ve su acierto frente al azar. El docente puede usarlo semanalmente como actividad de aula.

## 2:40-2:45 Cierre (A)
"Monte Carlo adivina. Grover amplifica. QubitGuard te deja sentir la diferencia en 3 minutos al día. Gracias."

---

## Preguntas del jurado

### 1. ¿Por qué cuántico y no solo una animación?
Los resultados no están pintados: cada ejecución construye un circuito real en Qiskit, lo simula con Aer (con ruido FakeFez si se activa) y muestra disparos medidos. La curva teórica sin²((2k+1)θ) se calcula con Statevector y se compara con lo medido. Si el estudiante pasa de k óptimo, ve cómo la probabilidad baja (sobre-rotación), algo que una animación fija no enseña.

### 2. ¿La contraseña se envía a algún lado?
No. El análisis es 100 % local en el navegador; no hay ninguna petición al backend con la contraseña, y hay un test de privacidad que lo comprueba. Se puede verificar en la pestaña Network de las herramientas del navegador.

### 3. ¿Por qué es adictivo y para qué edad?
Desde 14 años, sin requisitos de álgebra lineal. El bucle es corto: reto diario de unos 3 minutos, racha, XP y niveles, feedback inmediato frente al azar. Uso diario para el estudiante; semanal para el docente en clase. La eficacia de retención aún no está medida: [dato de la demo] (pendiente de piloto).

### Extra 4. ¿Esto rompe contraseñas reales hoy?
No. Es un laboratorio educativo con simulaciones de hasta 6 qubits. Grover da mejora cuadrática (de N a √N) y hoy no existe hardware tolerante a fallos que ataque AES. Lo útil hoy es entender por qué se recomiendan claves más largas y migrar a criptografía poscuántica (NIST FIPS 203/204/205).

### Extra 5. ¿Qué harían con más tiempo o hardware real?
Ejecutar los mismos circuitos en un backend IBM real con qiskit-ibm-runtime y comparar contra FakeFez; medir con un piloto en aula la retención y la racha; añadir más conceptos de estadística/ML mapeados a cuántico; y ampliar el contenido poscuántico.
