# Limitaciones

QubitGuard es una herramienta didáctica. Esto es lo que no hace y por qué importa. El mismo contenido se sirve en `GET /api/learn/limitations` desde `app/content/limitations.json`.

## 1. El oráculo ya conoce la respuesta
El oráculo marca el estado objetivo porque lo elegimos nosotros. En un ataque real habría que codificar la función hash o el cifrado como circuito cuántico reversible, con gran número de puertas y qubits auxiliares. Aquí solo ilustramos la mecánica de Grover.

## 2. La ventaja es solo cuadrática
Se pasa de (N+1)/2 intentos esperados a ~pi/4·raíz(N) iteraciones. Es una gran mejora, pero duplicar los bits de la clave restaura el margen de seguridad. Shor, que sí rompe RSA/ECC, no se simula aquí.

## 3. Ruido NISQ: modelo simulado, no hardware real
El modo ruidoso usa FakeFez, un modelo de ruido simulado basado en datos de calibración de un procesador IBM. No se ejecuta nada en hardware cuántico físico. Las probabilidades con ruido ilustran el efecto, no miden un dispositivo.

## 4. El costo del circuito crece con el problema
Las iteraciones crecen como ~raíz(N) y cada una incluye puertas multicontroladas. Su descomposición y profundidad dependen del número de qubits, ancillas, topología y transpilación; no se afirma un costo universal lineal en n. Más profundidad puede acumular más error y degradar el éxito medido. La curva dibujada con Statevector sigue siendo ideal.

## 5. 6 qubits son 64 estados
El laboratorio se limita a 2..6 qubits para ser inmediato. La tabla comparativa hasta 256 bits extrapola con la fórmula; no se simula ningún circuito de ese tamaño.

## 6. No existe hoy un ataque cuántico práctico a contraseñas ni a AES
Aun con un computador tolerante a fallos, Grover es secuencial y con corrección de errores su costo real sería enorme. AES-256 conserva ~128 bits de seguridad idealizada. El riesgo cuántico concreto es sobre RSA/ECC (Shor), y por eso existen FIPS 203, 204 y 205.

## 7. El estimador de entropía de contraseñas es heurístico
Se basa en longitud y tipos de caracteres y detecta algunos patrones. No modela diccionarios reales ni filtraciones, así que puede sobreestimar contraseñas predecibles. Se calcula solo en el navegador.

## 8. Monte Carlo usa el PRNG de NumPy
Reproducible con semilla, pero no criptográfico. Sirve para ilustrar la estadística de (N+1)/2 intentos, no para generar secretos.

## 9. Grover no es un modelo de machine learning
El proyecto compara una búsqueda clásica con amplificación de amplitud. No entrena modelos ni implementa estimación cuántica de amplitud para acelerar un Monte Carlo general. El encaje EdTech debe explicarse desde el concepto estadístico de búsqueda y probabilidades.

## 10. Las métricas no aíslan exclusivamente el ruido
Los modos ideal y FakeFez usan distintos objetivos y niveles de optimización. Profundidad, layout y puertas pueden cambiar además del ruido. Un estudio controlado requeriría el mismo circuito transpilado con y sin modelo de ruido.

## 11. La meta de contraseñas es educativa
La interfaz usa 128 bits como meta y muestra unos 64 bits efectivos frente a Grover idealizado. La etiqueta «resistente a Grover» no certifica seguridad; el análisis de texto humano es heurístico y los tiempos cuánticos usan una tasa hipotética. No hay conexión entre las contraseñas introducidas y el oráculo ejecutado.
