# Entregables QubitGuard (cierre día 1)

## Descripción para el formulario (147 palabras, contadas con `wc -w`)

QubitGuard es un laboratorio web educativo de ciberseguridad cuántica para aprender probabilidades y amplitudes jugando. Mapea la búsqueda aleatoria Monte Carlo, que espera (N+1)/2 intentos, a la amplificación de amplitud de Grover, que necesita unas π/4·√N iteraciones. Con la metodología Predice, Observa, Explica, cada persona apuesta una probabilidad, ejecuta un circuito de Qiskit en simulador (2 a 6 qubits, Aer y ruido simulado FakeFez, sin hardware real) y la compara con la teoría; un explorador de amplitudes en vivo muestra cómo gira el estado. Medimos que el ruido borra la amplificación al crecer el circuito: éxito 0,80 con 3 qubits y 0,017 con 6, similar al azar. Incluye ruta de 5 pasos, 6 logros, reto diario de 3 minutos con racha, generador de contraseñas local y un CLI listo para hardware IBM. Tiene 72 pruebas de Python y 37 de frontend, y declara sus limitaciones. Desde 14 años.

## Datos del equipo

- Nombre del equipo: TODO
- Integrantes: TODO (4 personas: nombre, rol, contacto)
- Enlace al repo GitHub: TODO (actualizar si cambia el nombre/organización)
- Enlace a demo o video: TODO

## Checklist de entrega

- [ ] Repo GitHub público, con README, instrucciones de instalación y CI en verde
- [ ] Tests pasando en local (`pytest -q`: 67, de ellos 2 `slow`; `cd frontend && npm test`: 36; verificado el 24 de octubre de 2026) y en GitHub Actions
- [ ] Demo desplegada o video corto (máx. 3 min) con enlace funcional
- [ ] Descripción pegada en el formulario (texto de arriba)
- [ ] PPT: `pitch/QubitGuard_pitch.pptx` (8 slides; generar con `python pitch/build_deck.py`, requiere `python-pptx`), revisado en PowerPoint/Keynote: no se ha revisado el renderizado visual
- [ ] Nombre del equipo e integrantes completados
- [ ] Ensayo del pitch de 2:45 (máx. 3:00) con cronómetro (guion en `pitch/GUION.md`)
- [ ] Resultados medidos del README coinciden con lo que muestra la app en vivo (el guion ya trae las cifras medidas)
- [ ] Demo pública: `cloudflared tunnel --url http://localhost:8000` (ver `docs/DEPLOY.md`) o Docker/CasaOS (`docs/LUBUNTU_CASAOS.md`), y video de respaldo grabado

## Pendientes que hay que decir con honestidad

- **Hardware real de IBM:** no se ejecutó. El CLI `scripts/run_ibm_hardware.py` está listo y probado con dobles locales, pero ningún job se envió a IBM. Las cifras de FakeFez (n=3 a 6) son simulación local. Para ejecutar: cuenta IBM Quantum Platform plan Open, ver `docs/IBM_HARDWARE.md`.
- **Piloto con usuarios:** no se hizo. No hay datos de comprensión, edad real de uso ni retención diaria.
- **Docker/CasaOS:** la imagen no se ha construido ni ejecutado (no había Docker en la máquina de desarrollo).
- **Accesibilidad:** objetivo WCAG 2.2 AA verificado parcialmente; sin pruebas con lectores de pantalla ni certificación.
- **QAE:** QubitGuard no implementa Quantum Amplitude Estimation; el Monte Carlo es la referencia clásica.
