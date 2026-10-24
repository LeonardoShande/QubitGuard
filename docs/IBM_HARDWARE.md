# El circuito del laboratorio en IBM Quantum

Este CLI importa `build_grover_circuit`, `optimal_iterations` y `theoretical_success`
de `app.quantum.experiments`: usa el mismo oráculo, difusor y mediciones del
laboratorio. Es un proceso independiente; arrancar FastAPI no crea una cuenta,
consulta una cola ni envía jobs a IBM.

## Preparación y credenciales

Usa el entorno Python del proyecto con sus dependencias ya instaladas. Esta guía
se verificó con Python 3.13, Qiskit 2.6.1, Aer 0.18.0 y Runtime 0.51.0.
Los comandos siguientes se ejecutan desde la raíz del repositorio; `python`
representa ese intérprete.

1. Crea un IBMid e inicia sesión en [IBM Quantum Platform](https://quantum.cloud.ibm.com/).
2. En **Instances**, crea o selecciona una instancia **Open Plan** en `us-east`.
   Copia su CRN y crea una API key en el panel de la plataforma. Comprueba que la
   instancia elegida pertenece al plan gratuito.
3. Elige una de las dos formas de autenticación siguientes. El CLI no acepta
   `--token`, no guarda cuentas y no incluye credenciales en sus JSON o mensajes.

**Cuenta guardada por el usuario.** Abre `python` de forma interactiva y ejecuta:

```python
import os
from getpass import getpass
from pathlib import Path
from qiskit_ibm_runtime import QiskitRuntimeService

old_umask = os.umask(0o077)
try:
    QiskitRuntimeService.save_account(
        channel="ibm_quantum_platform",
        token=getpass("IBM API key (oculta): "),
        instance=input("CRN de tu instancia Open: ").strip(),
        set_as_default=True,
    )
finally:
    os.umask(old_umask)
os.chmod(Path.home() / ".qiskit" / "qiskit-ibm.json", 0o600)
```

En Runtime 0.51 el SDK guarda la clave en `~/.qiskit/qiskit-ibm.json`, fuera del
repositorio, sin cifrarla. Protege ese archivo y no lo compartas. El ejemplo no
sobrescribe una cuenta existente. Después, el CLI llama a `QiskitRuntimeService()`.

**Variables de entorno, sin guardar una cuenta.** En zsh/macOS:

```zsh
read -rs "QISKIT_IBM_TOKEN?IBM API key (oculta): "
echo
export QISKIT_IBM_TOKEN
read "QISKIT_IBM_INSTANCE?CRN de tu instancia Open: "
export QISKIT_IBM_INSTANCE
```

Así la clave no queda escrita como argumento ni como literal en el historial.
El CLI pasa estas variables a
`QiskitRuntimeService(channel="ibm_quantum_platform", token=..., instance=...)`.
`--instance CRN` tiene prioridad sobre la variable de instancia. Al terminar:

```zsh
unset QISKIT_IBM_TOKEN QISKIT_IBM_INSTANCE
```

No actives logs de depuración del SDK al compartir una sesión con credenciales.
Si falla la cuenta, revisa CRN, permisos, API key, conexión y región; el CLI oculta
el texto bruto de las excepciones del SDK para evitar revelar datos de la cuenta.

## Tres modos

**Fake (por defecto, sin red ni cuenta).** Transpila para `FakeFez()` con un preset
pass manager de nivel 3 y ejecuta en `AerSimulator.from_backend(FakeFez())` con el
modelo de ruido local del paquete instalado:

```sh
python scripts/run_ibm_hardware.py --mode fake --n-qubits 3 --marked 101 --shots 1024 --seed 7
python -m scripts.run_ibm_hardware --mode fake --n-qubits 4 --marked 1010 --shots 1024 --seed 7
```

**Dry-run (requiere cuenta y red).** Consulta el backend y transpila, pero no
construye un Sampler ni envía un job:

```sh
python -m scripts.run_ibm_hardware --mode dry-run --n-qubits 3 --marked 101 --seed 7
python -m scripts.run_ibm_hardware --mode dry-run --backend NOMBRE_REAL --n-qubits 3 --marked 101 --seed 7
```

Sin `--backend`, usa
`service.least_busy(operational=True, simulator=False, min_num_qubits=n)`.
La compilación usa `generate_preset_pass_manager(optimization_level=3,
backend=backend, seed_transpiler=seed)`. El JSON contiene profundidad, cantidad de
puertas de dos qubits y layout; `counts`, `measured_success` y `job_id` son `null`.
Este modo del CLI no llama a `SamplerV2.run(dry_run=True)`, que sí enviaría una
petición a IBM.

**IBM (ejecución real; consume cuota).** Usa la misma compilación y envía un solo
circuito con `SamplerV2(mode=backend).run([compiled], shots=shots)`:

```sh
python -m scripts.run_ibm_hardware --mode ibm --n-qubits 3 --marked 101 --shots 1024 --seed 7
```

Imprime `job_id` inmediatamente, con flush, antes de esperar `job.result()`.
Conserva ese identificador. Si se cierra la terminal o falla la conexión, recuperar
no vuelve a enviar el circuito:

```sh
python -m scripts.run_ibm_hardware --mode ibm --job-id ID_DEL_JOB --out results/recuperado.json
```

La recuperación usa los parámetros originales guardados en
`circuit_metadata.qubitguard`, no los defaults de la nueva invocación. Admite jobs
de un solo circuito creados por este CLI cuyos metadatos se conserven; rechaza
otros jobs sin adivinar el estado marcado. Lee `result[0].data.meas.get_counts()`:
`measure_all()` del constructor crea precisamente el registro `meas`.

`--n-qubits` admite 2–6; `--marked` debe ser binario y tener esa longitud
(el default `101` solo sirve para n=3). `--iterations` admite 0–20 y por defecto
usa el óptimo del laboratorio. `--shots` admite 1–8192, default 1024; `--seed`
admite 0–4294967295. La seed controla la transpilación y, en fake, el muestreo de
Aer; no fija las mediciones del hardware.

## Resultados medidos offline

Mediciones del **24 de octubre de 2026 UTC**, FakeFez local, 1024 shots, seed 7,
optimización 3 y las versiones indicadas arriba. No son resultados de una QPU:

| n | marcado | k | profundidad | puertas 2q | aciertos | éxito medido | ideal | azar 1/N |
|---|---------|---|-------------|------------|----------|--------------|-------|----------|
| 3 | 101 | 2 | 137 | 39 | 821/1024 | 80,1758 % | 94,5313 % | 12,5 % |
| 4 | 1010 | 3 | 448 | 111 | 678/1024 | 66,2109 % | 96,1319 % | 6,25 % |
| 5 | 10101 | 4 | 1456 | 517 | 188/1024 | 18,3594 % | 99,9182 % | 3,125 % |
| 6 | 101010 | 6 | 4447 | 1706 | 17/1024 | 1,6602 % | 99,6586 % | 1,5625 % |

Para reproducir las dos últimas filas:

```sh
python -m scripts.run_ibm_hardware --mode fake --n-qubits 5 --marked 10101 --shots 1024 --seed 7
python -m scripts.run_ibm_hardware --mode fake --n-qubits 6 --marked 101010 --shots 1024 --seed 7
```

Con n=3 cabe esperar que el ruido reduzca el éxito respecto al ideal, frecuentemente
hacia un valor entre ideal y azar. No es una cota garantizada: ruido sesgado y
fluctuaciones de shots pueden dar incluso menos que 1/N. Con n≥5, descomponer y
enrutar las puertas multicontroladas aumenta mucho la profundidad; el ruido puede
acercar la distribución al azar, como se observa aquí con n=6. n=5 aún conserva una
señal mayor que 1/N en esta simulación. Backend, calibración, versiones, layout,
marcado y optimización afectan al resultado; no extrapoles estas cifras a una QPU.

**No se ejecutaron `dry-run` ni `ibm` contra IBM** en esta validación: no había
cuenta configurada. La selección de backend, envío, lectura de `meas` y recuperación
se probaron con dobles locales, sin red. La autenticación, cola y ejecución real
quedan pendientes de una cuenta del usuario.

## Cuota, evidencia y límites

La documentación oficial consultada indica para Open Plan hasta **10 minutos de
tiempo QPU por ventana móvil de 28 días**; revisa el panel y las condiciones
vigentes, incluidas promociones. La espera de cola no equivale al tiempo QPU.
`least_busy` no garantiza un plazo de ejecución; disponibilidad, mantenimiento,
prioridades y cuota pueden retrasar o rechazar el job. Empieza con n=3 y un solo
job, y revisa primero su compilación con `dry-run`.
[Planes y límites oficiales](https://quantum.cloud.ibm.com/docs/en/guides/plans-overview).

Cada ejecución guarda `results/ibm_<timestamp UTC>.json` o la ruta `--out`.
No sobrescribe archivos existentes. Incluye fecha UTC de preparación del reporte,
versiones de Qiskit/Runtime/Aer, modo, backend, job_id, n, marcado, k, shots, seed,
profundidad, puertas 2q, layout inicial/final, counts, éxito observado, éxito ideal
y referencia aleatoria. Los layouts mapean índices lógicos a qubits físicos,
excluyendo ancillas. La recuperación conserva la fecha y versiones originales y
añade `retrieved_at_utc`.

Al citar una ejecución real usa, por ejemplo: «QubitGuard, backend `<backend>`,
reporte preparado `<date_utc>`, job `<job_id>`, n=3, marcado 101, k=2, 1024 shots;
Qiskit `<versión>`, Runtime `<versión>`». Adjunta el JSON y consulta el job en
Workloads para la hora efectiva de ejecución. Para fake, escribe explícitamente
«simulación local FakeFez» y `job_id=null`.

Este experimento conoce el estado marcado para construir el oráculo. No rompe
contraseñas reales, no demuestra ventaja práctica de rendimiento y no incluye
corrección de errores ni mitigación configurada por este CLI. La profundidad es
una métrica del circuito transpilado, no tiempo QPU ni tiempo de cola. Los counts
tienen incertidumbre estadística y FakeFez representa una instantánea de ruido,
no la calibración actual del procesador. Conserva JSON y versiones para comparar.

## Referencias oficiales

- [Qiskit Runtime / IBM Quantum Compute](https://docs.quantum.ibm.com/api/qiskit-ibm-runtime).
- [SamplerV2](https://docs.quantum.ibm.com/api/qiskit-ibm-runtime/sampler-v2) y
  [estructura de resultados y registros clásicos](https://quantum.cloud.ibm.com/docs/en/guides/sampler-input-output).
- [Transpilación con preset pass managers](https://docs.quantum.ibm.com/guides/transpile-with-pass-managers).
- [Código fuente de Qiskit](https://github.com/Qiskit/qiskit).

La API instalada de Runtime 0.51 se inspeccionó con `inspect.signature` y
`inspect.getsource`: `ChannelType` admite `ibm_quantum_platform`, `least_busy`
admite `min_num_qubits` y filtros, y `SamplerV2` admite `mode=backend` y
`run(..., shots=...)`. La documentación más reciente también presenta primitivas
Executor nuevas; este CLI usa la API SamplerV2 solicitada e instalada.
