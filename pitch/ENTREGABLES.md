# Entregables QubitGuard (cierre día 1)

## Descripción para el formulario (147 palabras, contadas con `wc -w`)

QubitGuard es un laboratorio web educativo que enseña ciberseguridad cuántica jugando. Toma un concepto de estadística, la búsqueda aleatoria Monte Carlo (adivinar un secreto entre N=2^n toma en promedio (N+1)/2 intentos), y lo mapea a su equivalente cuántico: la amplificación de amplitud de Grover, que necesita solo floor(π/4·√N) iteraciones. El estudiante lo prueba con circuitos de 2 a 6 qubits en Qiskit 2.6 y Aer, con ruido simulado del modelo FakeFez (no es hardware real), y compara el histograma medido con la curva exacta sin²((2k+1)θ) calculada con Statevector. Incluye un reto diario con racha, XP y niveles, un analizador de contraseñas que corre 100 % en el navegador, y una sección de criptografía poscuántica (NIST FIPS 203/204/205). Backend FastAPI, frontend sin frameworks, pruebas con pytest y CI en GitHub Actions. Pensado desde 14 años, con uso diario de unos 3 minutos. Las limitaciones se explican con honestidad.

## Datos del equipo

- Nombre del equipo: TODO
- Integrantes: TODO (4 personas: nombre, rol, contacto)
- Enlace al repo GitHub: TODO (actualizar si cambia el nombre/organización)
- Enlace a demo o video: TODO

## Checklist de entrega

- [ ] Repo GitHub público, con README, instrucciones de instalación y CI en verde
- [ ] Tests pytest pasando en local (`pytest`) y en GitHub Actions
- [ ] Demo desplegada o video corto (máx. 3 min) con enlace funcional
- [ ] Descripción pegada en el formulario (texto de arriba)
- [ ] PPT: `pitch/QubitGuard_pitch.pptx` (generar con `python pitch/build_deck.py`), revisado en PowerPoint/Keynote
- [ ] Nombre del equipo e integrantes completados
- [ ] Ensayo del pitch de 3 min con cronómetro (guion en `pitch/GUION.md`)
- [ ] Resultados de la demo anotados para reemplazar los "[dato de la demo]" del guion
