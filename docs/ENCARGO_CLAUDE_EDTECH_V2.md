# Encargo para Claude: aprendizaje y próxima sesión de la bóveda

Copia el siguiente texto en Claude. Este es un encargo nuevo: conserva las preguntas, fases y el piloto que ya existan.

---

Trabaja sobre QubitGuard y revisa el minijuego «Protege la bóveda» para estudiantes desde 14 años. Lee `docs/BOVEDA_Y_ENCARGOS.md`, `docs/BOVEDA_AURA_Y_GUARDADO.md`, `frontend/src/vault-model.ts`, `frontend/src/vault-ui.ts` y `docs/PILOTO_BOVEDA.md` si existe.

Tu parte es el contenido pedagógico y las razones para volver. GLM 5.3 trabajará en la presentación, así que tus archivos exclusivos son:

- `frontend/src/vault-model.ts`: únicamente textos de las tres misiones (historias, preguntas, opciones, pistas y explicaciones).
- `docs/MICRORETOS_BOVEDA_V2.md`: nuevo banco propuesto de seis microretos y una secuencia de siete días.
- `docs/REVISION_DIDACTICA_BOVEDA_V2.md`: hallazgos, límites y propuesta de validación con estudiantes.

Conserva ids, nombres de campos, índices correctos coherentes con las opciones, parámetros n/k, umbrales y reglas de XP. No añadas misiones al array actual ni cambies el contrato sin coordinar con el integrador. No alteres el módulo de guardado, las etiquetas, HTML, CSS, API, Qiskit, generador o dependencias.

Objetivos:

1. Que el estudiante pueda explicar distribución uniforme, amplitud/fase, diferencia entre probabilidad y frecuencia y por qué demasiadas iteraciones empeoran el resultado. Usa analogías breves y preguntas que detecten confusiones, no memorización de fórmulas.
2. Mantener el puente EdTech «distribuciones de probabilidad → superposición y amplitudes». Las contraseñas son contexto, el tablero sintético es el experimento. No llames QAE o QML entrenado a Grover.
3. Explicar que «Meh», «Buena», «Épica» y «Nivel dios: tu clave tiene aura» son etiquetas del juego. El analizador no certifica seguridad ni mide la entropía real de una contraseña humana.
4. Diseñar seis microretos con objetivo, enunciado, opciones, respuesta razonada, pista específica, error que diagnostica y duración estimada. Incluir al menos dos actividades de transferencia: explicar un caso nuevo y escoger un experimento que compruebe una idea.
5. Proponer cómo repetir lo fallado al día siguiente sin borrar XP, sin castigar el error y sin exigir volver por una racha. No implementes otra persistencia; entrega el contrato de datos mínimo al integrador.
6. Revisar el piloto existente y proponer cómo medir comprensión y regreso voluntario. No atribuyas resultados a estudiantes que no participaron ni uses XP como evidencia de aprendizaje.

Entrega los cambios acotados, el banco y la revisión en español. Enumera qué se verificó y qué queda por probar. No hagas commit/push, no envíes trabajos a IBM y no recompiles `frontend/dist` mientras GLM esté trabajando. El integrador hará la compilación final y la prueba conjunta.
