# Protege la bóveda: versión local y trabajo separado

Implementado el 24 de octubre de 2026. Campaña educativa de tres misiones que reutiliza `/api/quantum/grover`, sin modificar el motor cuántico ni el contrato de API.

## Verlo en Windows

Desde la raíz de este checkout:

```powershell
.\.venv-local\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Abrir <http://127.0.0.1:8000/#boveda>. Si ya está abierto el servidor de esta sesión, solo abrir la dirección. Para detenerlo, Ctrl+C en la terminal que lo ejecuta. El entorno `.venv-local` es exclusivo de Windows y está ignorado por Git; el entorno antiguo de la carpeta padre pertenece a otra plataforma.

Tras editar TypeScript hay que compilar, desde `frontend/`:

```powershell
node node_modules/typescript/bin/tsc
node --test test/password.test.mjs test/generator.test.mjs test/progress.test.mjs test/dom.test.mjs test/ambience.test.mjs test/explorer.test.mjs test/vault.test.mjs
```

Pruebas Python desde la raíz: `.\.venv-local\Scripts\python.exe -m pytest -q`. Recargar el navegador después de compilar. Para compartir el progreso, usar siempre el mismo origen: `localhost` y `127.0.0.1` tienen almacenamiento separado.

## Qué incluye

- Tres escenarios: distribución uniforme (3 qubits, k=0), amplificación (4 qubits, k=3) y sobreiteración (4 qubits, k=5).
- Preparación de una clave ficticia local, con metas de longitud y heurística claramente identificadas como reglas del juego.
- Predicción fijada antes de ejecutar, mediciones reales de Aer, tablero de frecuencias, circuito textual y explicación con pistas.
- Puntuación al completar: preparación 25, predicción correcta 25, experimento 20, explicación correcta 30. Una predicción incorrecta permite completar con 75 y repetir para llegar a 100.
- Mejores marcas por misión; repetir no duplica puntos ni XP. Mejorar de 75 a 100 suma solo 25 XP. La explicación es obligatoria para desbloquear la siguiente misión.
- Rangos de esta campaña: 0 Aprendiz, 50 Explorador, 100 Constructor, 200 Estratega y 300 Guardián. El nivel global anterior conserva sus reglas; cada panel identifica su progreso.
- Migración del progreso anterior dentro de `qubitguard.progress.v1`, añadiendo únicamente `vault` con identificadores y puntuaciones.
- La clave ficticia no sale del input hacia API ni almacenamiento, y se vacía después de una ejecución correcta. La API recibe n, objetivo binario sintético, k, shots, seed y noisy.
- Corrección del flujo de texto en la lista «Qué sabemos y qué no», usando un párrafo de texto junto al indicador y código inline.

## Límites educativos

El analizador de contraseñas es una heurística clásica y limitada. Los umbrales son metas ilustrativas de las misiones; no acreditan entropía real ni cumplen por sí solos una norma de autenticación. Qiskit ejecuta un ejemplo de 8 o 16 candidatos; no procesa ni rompe la clave escrita. La campaña enseña distribuciones → amplitudes mediante Grover; no implementa QAE ni un modelo QML entrenado. Tres misiones constituyen una primera sesión, no evidencia de retención. Hace falta un piloto con estudiantes.

## Verificación de esta entrega

- 75 pruebas Python aprobadas, incluida la simulación ruidosa anterior y los tres escenarios nuevos. Hay un aviso de deprecación de Starlette/httpx; no hubo fallos.
- TypeScript sin errores y 41 pruebas de frontend aprobadas.
- Recorrido en navegador con Aer: misión inicial al 12,5 % teórico, amplificación al 96,1 % y sobreiteración al 12,5 %.
- Se probó una predicción incorrecta (75 puntos), pista tras una explicación incorrecta, mejora de 75 a 100 sumando solo 25 XP, desbloqueo secuencial y persistencia del rango Guardián al recargar.
- Inspección visual en escritorio y a 320 px: la bóveda no desborda y la lista Evidencia mantiene el código inline sin texto solapado. Capturas en `outputs/boveda-local/`.
- No se realizó un piloto con estudiantes ni se midió retención.

## Reparto para Claude y GLM

Estos encargos se entregan por separado. No se han enviado a otros chats ni se ha atribuido trabajo a esos modelos. Ambos deben comenzar leyendo el estado de Git y preservar archivos ya modificados. Un integrador revisa y compila los cambios finales; no ejecutar dos compilaciones simultáneas sobre `frontend/dist`.

### Claude: contenido, comprensión y piloto

Copiar este encargo:

> Trabaja en QubitGuard, en la campaña «Protege la bóveda». Lee `docs/BOVEDA_Y_ENCARGOS.md`, `frontend/src/vault-model.ts`, `frontend/src/vault-ui.ts` y `tests/test_vault_experiments.py`. Tu objetivo es mejorar la claridad para estudiantes desde 14 años y evaluar el encaje «distribuciones de probabilidad → superposición y amplitudes» del reto EdTech. Puedes editar exclusivamente los textos de las tres misiones en `frontend/src/vault-model.ts` y crear `docs/PILOTO_BOVEDA.md`. Conserva los ids, tipos, claves, parámetros n/k, umbrales, puntuación y rangos: GLM trabaja en la UI y necesita ese contrato estable. Mejora preguntas, distractores y pistas para comprobar conceptos, evitando respuestas obvias por longitud o tono. Distingue fase, probabilidad y frecuencia; recuerda que el oráculo solo no cambia |a|². No presentes Qiskit como certificación de contraseñas ni Grover como QAE. Diseña un piloto de cinco participantes con tres preguntas antes/después, tareas observables, consentimiento apropiado y plantilla de resultados sin datos sensibles; no inventes resultados. Entrega diff, justificación y riesgos; no modifiques CSS, HTML, API, progreso, generador, motor, dist, dependencias o despliegue. No hagas commit/push. Si necesitas cambiar el contrato de misiones, propón el cambio al integrador antes de tocarlo.

### GLM: interacción y accesibilidad del minijuego

Copiar este encargo:

> Trabaja en QubitGuard, únicamente en la UI de «Protege la bóveda». Lee `docs/BOVEDA_Y_ENCARGOS.md`, `frontend/src/vault-ui.ts`, `frontend/assets/vault.css` y el contrato de `frontend/src/vault-model.ts`, que pertenece a Claude. Puedes editar `frontend/src/vault-ui.ts`, `frontend/assets/vault.css` y solo el bloque HTML `#boveda` en `frontend/index.html`. Tu objetivo es que las fases preparar → predecir → observar → explicar sean claras, dinámicas y cómodas en 320 px y escritorio. Conserva todos los ids públicos existentes, la interfaz de misiones y los cálculos de puntos. Mejora feedback, estados de carga/reintento y foco de teclado, y comprueba movimiento reducido, ausencia de desbordamiento y mensajes para lectores de pantalla. No añadas librerías ni peticiones externas. Nunca envíes o guardes la clave de práctica, ni cambies la afirmación de que el tablero es sintético. No toques estilos globales, la sección Evidencia, main.ts, progress.ts, vault-model.ts, API, motor Qiskit, generador, dist o despliegue. Documenta pruebas reales en `docs/QA_BOVEDA_GLM.md`, separándolas de las pendientes. No hagas commit/push. El integrador compilará dist al terminar ambos trabajos.

### Integración final

Revisar ambos diffs y ejecutar TypeScript, pruebas de frontend y Python. Comprobar tres misiones, predicción incorrecta, pista tras explicación incorrecta, mejora 75→100, repetición sin XP extra y persistencia al recargar. Verificar que las solicitudes a `/api/quantum/grover` solo contienen parámetros sintéticos. Probar también el laboratorio anterior, el reto diario y el generador. Compilar y entregar `frontend/dist` actualizado. Solo después considerar una misión nueva, adaptación al error o conexión con el reto diario.
