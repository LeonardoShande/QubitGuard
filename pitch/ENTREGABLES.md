# Entregables QubitGuard (cierre día 1)

## Descripción para el formulario (144 palabras, contadas con `wc -w`)

QubitGuard es un laboratorio web educativo de ciberseguridad cuántica que se aprende jugando. Mapea un concepto de estadística, la búsqueda aleatoria Monte Carlo (adivinar un secreto entre N=2^n toma (N+1)/2 intentos), a su equivalente cuántico, la amplificación de amplitud de Grover (unas π/4·√N iteraciones). Con circuitos de 2 a 6 qubits en Qiskit, Aer y ruido simulado FakeFez (no es hardware real), cada persona sigue la metodología Predice, Observa, Explica: apuesta una probabilidad antes de ejecutar y compara con la teoría y lo medido. Incluye ruta de 5 pasos, 6 logros, reto diario de unos 3 minutos con racha y XP, y un generador de contraseñas con CSPRNG que corre solo en el navegador, con la meta de 128 bits frente a Grover. Diseñado para WCAG 2.2 AA, tiene 42 pruebas de Python y 23 de frontend, y declara sus limitaciones. Desde 14 años.

## Datos del equipo

- Nombre del equipo: TODO
- Integrantes: TODO (4 personas: nombre, rol, contacto)
- Enlace al repo GitHub: TODO (actualizar si cambia el nombre/organización)
- Enlace a demo o video: TODO

## Checklist de entrega

- [ ] Repo GitHub público, con README, instrucciones de instalación y CI en verde
- [ ] Tests pasando en local (`pytest -q`: 42; `cd frontend && npm test`: 23) y en GitHub Actions
- [ ] Demo desplegada o video corto (máx. 3 min) con enlace funcional
- [ ] Descripción pegada en el formulario (texto de arriba)
- [ ] PPT: `pitch/QubitGuard_pitch.pptx` (generar con `python pitch/build_deck.py`), revisado en PowerPoint/Keynote
- [ ] Nombre del equipo e integrantes completados
- [ ] Ensayo del pitch de 2:45 (máx. 3:00) con cronómetro (guion en `pitch/GUION.md`)
- [ ] Resultados medidos del README coinciden con lo que muestra la app en vivo (el guion ya trae las cifras medidas)
- [ ] Demo pública: `cloudflared tunnel --url http://localhost:8000` (ver `docs/DEPLOY.md`) y video de respaldo grabado
