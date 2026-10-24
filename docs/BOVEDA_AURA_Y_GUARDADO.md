# Guía, etiquetas y progreso persistente

Actualización del 24 de octubre de 2026. Se conservaron las mejoras recientes de fases, preguntas y pistas.

## Qué ve el estudiante

La guía abierta junto al campo explica cómo inventar una clave de práctica, mejorarla y completar la secuencia predecir → ejecutar → explicar. Las reglas técnicas y los bits están en un detalle desplegable, sin ocupar el lugar de las instrucciones.

El ejemplo recibe una puntuación de 0 a 100 y una etiqueta:

| Puntuación del ejemplo | Etiqueta |
|---|---|
| 0–39 | Meh… podemos mejorarla |
| 40–69 | Buena: ya toma forma |
| 70–89 | Épica: subiste el nivel |
| 90–100 | Nivel dios: tu clave tiene aura |

Es una escala ilustrativa a partir del analizador existente. Las claves cortas o con patrones detectados no alcanzan el tramo superior. No es una medida de seguridad real, una norma de autenticación ni una certificación de IBM. No se concede XP por escribir caracteres o generar ejemplos repetidamente.

La preparación aporta 25 puntos al terminar la misión; la predicción correcta aporta 25, el experimento 20 y la explicación 30. Se conserva la mejor marca; mejorar de 75 a 100 solo añade 25 XP. Los rangos de campaña siguen llegando a 300 puntos.

## Cómo se conserva el progreso

- La clave existente `qubitguard.progress.v1` sigue siendo compatible. No se borra por cambiar de día.
- Se guardan XP, mejores marcas, misiones, logros, respuestas y rachas en el navegador del dispositivo. Nunca el texto de la contraseña, su hash ni un historial de ejemplos.
- Se mantiene una copia redundante local para recuperar un JSON principal dañado. Se avisa si se usa esa copia.
- La UI prueba la escritura al abrir y muestra si el almacenamiento está activo o bloqueado. Si está bloqueado, se puede jugar en memoria y exportar una copia antes de cerrar.
- El cambio de fecha renueva retos y límites diarios; una racha puede romperse, pero no resta XP ni reinicia misiones.
- «Descargar mi progreso» genera un JSON portable de campos permitidos. «Restaurar una copia» valida formato/tamaño, conserva las mejores marcas y evita reducir o duplicar el XP ya recuperado. Es progreso personal editable, no una clasificación competitiva segura.
- Cambiar de navegador, de perfil, de puerto o entre `localhost` y `127.0.0.1` crea otro origen. Para llevarse los puntos se usa la copia portable. Borrar los datos del sitio o cerrar ciertas sesiones privadas puede eliminar el guardado local.

## Archivos y validación

- `frontend/src/practice-rating.ts`: etiquetas y puntuación del ejemplo, sin persistencia ni red.
- `frontend/src/progress.ts`: normalización, guardado, respaldo, exportación y restauración.
- `frontend/src/progress-ui.ts`: mensaje de guardado y controles de copia.
- `frontend/src/vault-ui.ts`, `frontend/assets/vault.css` e `index.html`: integración con la guía y el medidor.
- `frontend/test/persistence.test.mjs`: conservación entre días, límites diarios, respaldo dañado, almacenamiento bloqueado, copia portable e idempotencia de restauración.

Los tests de fechas simulan el regreso al día siguiente: no se cambió el reloj del equipo. El guardado sigue siendo local; no se añadió base de datos ni cuenta de usuario.

Verificado en esta actualización: TypeScript y 47 pruebas del frontend aprobadas; cuatro pruebas Python de privacidad aprobadas. En navegador se comprobó el cambio de etiqueta Meh→aura, la restauración desde un archivo, una misión Qiskit sin duplicar XP y la persistencia tras recargar. Se revisó escritorio y 320 px sin desbordamiento.

El navegador integrado no devolvió el evento de descarga en la prueba automática, por lo que no se confirmó la creación física del archivo descargado. El botón también ofrece la copia en texto para guardarla manualmente. La serialización y restauración sí fueron verificadas. No se ejecutó un estudio con estudiantes.

## Trabajo independiente para los otros modelos

- Claude: `docs/ENCARGO_CLAUDE_EDTECH_V2.md`, contenido científico y próxima sesión de aprendizaje.
- GLM 5.3: `docs/ENCARGO_GLM53_BOVEDA_V2.md`, presentación, accesibilidad y respuesta visual.

Sus archivos permitidos están separados. Un integrador debe revisar y compilar al final; no se deben ejecutar dos compilaciones simultáneas sobre `frontend/dist`.
