# Encargo para GLM 5.3: claridad, respuesta visual y accesibilidad

Copia el siguiente texto en GLM 5.3. Tu parte está separada del contenido de Claude y del guardado de Codex.

---

Trabaja en QubitGuard, únicamente en la experiencia visual de «Protege la bóveda». Lee `docs/BOVEDA_AURA_Y_GUARDADO.md`, `frontend/assets/vault.css`, el bloque `#boveda` de `frontend/index.html`, `frontend/src/vault-ui.ts` y `frontend/src/practice-rating.ts`. Conserva las mejoras de fases y pistas ya presentes.

Archivos exclusivos que puedes editar:

- `frontend/assets/vault.css`.
- Solo el bloque `#boveda` de `frontend/index.html`, manteniendo todos los ids y nombres de controles que usa TypeScript.
- `docs/QA_BOVEDA_GLM53_V2.md`, nuevo informe con capturas y comprobaciones.

Claude será dueño de los textos científicos de `vault-model.ts`. Codex integra la lógica y persistencia; no modifiques TypeScript, puntuación, almacenamiento, API, generador, motor Qiskit, estilos globales o despliegue. Si necesitas un hook de interacción nuevo, describe el cambio para que el integrador lo incorpore.

Objetivos:

1. Hacer que la guía situada junto a la contraseña se entienda de inmediato: inventar → mejorar → predecir → ejecutar → explicar. Evita una pared de avisos; conserva una explicación accesible de límites y privacidad en los detalles.
2. Dar personalidad a «Meh», «Buena», «Épica» y «Nivel dios: tu clave tiene aura» con color y movimiento breve. Sin destellos, sonido automático ni efectos que compitan con el experimento. Mantener texto equivalente y respetar movimiento reducido.
3. Dejar clara la diferencia entre puntuación de la clave (0–100), mejor marca de misión, XP acumulado y rango. No introduzcas promesas de contraseña invulnerable ni seguridad certificada por IBM.
4. Revisar la jerarquía del mensaje de guardado automático y los botones de descargar/restaurar. No ocultes la advertencia si el navegador bloquea almacenamiento. Los ids `vault-save-status`, `vault-export`, `vault-import`, `vault-import-file` y `vault-backup-feedback` deben permanecer intactos.
5. Comprobar 320 px y escritorio: texto sin superposiciones, botones utilizables, foco visible, etiquetas de formularios, zoom al 200 % y contraste. La sección debe seguir funcionando sin animación. No cambies la lista «Evidencia» ya corregida.
6. Documentar el flujo con clave vacía, ejemplo con patrones, ejemplo con aura, simulación cargando, error recuperable y misión completada. Separa pruebas ejecutadas de las que no pudiste realizar.

Entrega el diff, capturas y observaciones en español. No añadas librerías ni recursos externos. No hagas commit/push, no publiques ni escribas en `frontend/dist`. El integrador compilará y verificará TypeScript, pruebas y recorrido con los cambios de Claude.
