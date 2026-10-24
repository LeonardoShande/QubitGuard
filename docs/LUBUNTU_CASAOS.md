# QubitGuard en Lubuntu con CasaOS

Guía para ejecutar QubitGuard en tu laptop Linux y abrirlo desde el navegador o desde un dominio propio. Estos pasos se prepararon para Lubuntu con CasaOS; no se han ejecutado en tu servidor. La versión exacta de Lubuntu, su IP y la ubicación del túnel todavía no se han comprobado.

## Arquitectura propuesta

```text
Navegador → dominio HTTPS / Cloudflare Tunnel → laptop Lubuntu:8781
                                                    │
                                        FastAPI + frontend + Qiskit Aer
                                                    │
                                      servicio systemd qubitguard.service
```

CasaOS puede seguir gestionando tus contenedores. Esta opción ejecuta QubitGuard como servicio nativo de Lubuntu; no necesita convertirlo en un contenedor ni instalar Node en el servidor. El JavaScript compilado ya está en el repositorio.

La sección 7 describe una alternativa con Docker Compose que CasaOS puede gestionar como una aplicación más; elige una de las dos, no ambas.

## 1 Comprobar la laptop

Ejecuta en una terminal de **Lubuntu**, con tu usuario habitual:

```bash
cat /etc/os-release
python3 --version
uname -m
hostname -I
ss -ltn | grep ':8781'
```

Necesitas Python 3.11 o superior y el puerto 8781 libre. Si el último comando no imprime nada, no encontró un listener en ese puerto. Si Python es anterior a 3.11, usa un intérprete compatible instalado para tu distribución antes de crear el entorno; no reemplaces el Python del sistema. Conserva la IP privada para el acceso por red local.

## 2 Instalar la aplicación

```bash
sudo apt update
sudo apt install git python3-venv curl
mkdir -p "$HOME/apps"
cd "$HOME/apps"
git clone https://github.com/LeonardoShande/QubitGuard.git
cd QubitGuard
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m pytest -q
```

Si ya existe ese checkout, revisa `git status` y actualízalo con `git pull --ff-only` desde su raíz; no vuelvas a clonarlo encima. Si elegiste otro intérprete compatible, úsalo también en el comando de creación del entorno.

El entorno debe crearse en Linux. No copies la `.venv` de macOS: los paquetes de Aer incluyen binarios específicos de plataforma. El aislamiento y la recreación de entornos se describen en la [documentación de venv](https://docs.python.org/3/library/venv.html).

## 3 Probar en la red local

Desde `~/apps/QubitGuard`:

```bash
.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8781 --workers 1
```

En la propia laptop abre `http://127.0.0.1:8781`. Desde otra computadora de la misma red, abre `http://IP_PRIVADA_DE_LA_LAPTOP:8781`, reemplazando el marcador por la IP real. `0.0.0.0` es una dirección de escucha, no una URL para abrir.

Ese comando permite acceso desde la LAN. La aplicación no tiene autenticación: úsalo en una red de confianza y revisa el firewall existente si el acceso está bloqueado. No necesitas abrir puertos del router ni publicar el panel administrativo de CasaOS.

En otra terminal de Lubuntu:

```bash
curl -fsS http://127.0.0.1:8781/api/health
curl -fsS http://127.0.0.1:8781/api/quantum/capabilities
```

Detén la ejecución manual con `Ctrl+C` antes de iniciar el servicio. Para una demo pequeña se usa un solo worker: las cachés y el límite de dos simulaciones ruidosas son por proceso. No se ha medido la capacidad con usuarios simultáneos. Opciones del servidor en la [documentación de Uvicorn](https://uvicorn.dev/settings/).

## 4 Mantenerlo encendido con systemd

Este bloque asume la ruta `~/apps/QubitGuard` y debe ejecutarse como tu usuario habitual con permisos sudo. Comprueba primero que no existe un servicio del mismo nombre:

```bash
systemctl status qubitguard.service --no-pager
```

Si ya existe, revisa `systemctl cat qubitguard.service` y conserva una copia de su configuración antes de sustituirla. Para una instalación nueva:

```bash
sudo tee /etc/systemd/system/qubitguard.service >/dev/null <<EOF
[Unit]
Description=QubitGuard Quantum Lab
After=network.target

[Service]
Type=simple
User=$(id -un)
WorkingDirectory=$HOME/apps/QubitGuard
ExecStart=$HOME/apps/QubitGuard/.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8781 --workers 1
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now qubitguard.service
systemctl status qubitguard.service --no-pager
curl -fsS http://127.0.0.1:8781/api/health
```

`Restart=on-failure` permite que systemd intente recuperar el proceso si falla; no demuestra recuperación hasta probarla en esa laptop. Véase [systemd.service](https://freedesktop.org/software/systemd/man/latest/systemd.service.html).

Comandos de operación:

```bash
journalctl -u qubitguard.service -n 100 --no-pager
sudo systemctl restart qubitguard.service
sudo systemctl stop qubitguard.service
```

La laptop debe permanecer encendida y conectada. Suspenderla o cerrar la tapa con suspensión interrumpe la demo aunque el servicio esté habilitado.

## 5 Publicar con tu dominio y túnel

Primero comprueba cómo corre tu túnel actual, sin copiar ni compartir tokens:

```bash
systemctl status cloudflared --no-pager
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
```

En el túnel existente, añade **solo una ruta nueva para QubitGuard**, con un subdominio libre. Por ejemplo, `qubitguard.tudominio.com` es un marcador, no un dominio ya configurado.

| Dónde corre cloudflared | Destino del servicio HTTP |
|---|---|
| En Lubuntu como proceso nativo, o contenedor con red host | `http://127.0.0.1:8781` |
| Dentro de un contenedor con red bridge de CasaOS | `http://IP_PRIVADA_DE_LA_LAPTOP:8781`, si es alcanzable desde ese contenedor. |

Dentro de un contenedor bridge, `127.0.0.1` apunta al propio contenedor, no a Lubuntu. No cambies la red de todos tus contenedores para resolverlo. Verifica el destino desde la red del conector y preserva las rutas de los demás servicios.

Si aún no tienes un túnel y ya dispones de `cloudflared`, una prueba temporal es:

```bash
cloudflared tunnel --url http://127.0.0.1:8781
```

La URL temporal depende de ese proceso y puede cambiar al reiniciar. Para un dominio estable, usa tu túnel persistente y su configuración existente; la [guía oficial de ejecución como servicio en Linux](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/as-a-service/linux/) distingue ese ciclo de vida del servicio de la aplicación.

Desde otra red, verifica la URL real y `/api/health`, ejecuta Grover y comprueba `/assets/quantum-ascii.svg`. Publicar la interfaz y la API bajo el mismo origen evita cambiar el cliente TypeScript.

Si tu panel de CasaOS permite accesos web, puedes añadir la URL final como acceso directo; también puedes guardarla como favorito en Chrome. Esa tarjeta no sustituye al servicio systemd. No se ha inspeccionado tu panel ni se presupone su URL o una opción concreta de su versión.

## 6 Actualizaciones y vuelta atrás

Antes de actualizar, anota el commit instalado y revisa que no haya cambios locales:

```bash
cd "$HOME/apps/QubitGuard"
git status --short
git rev-parse HEAD
```

Con el árbol limpio, actualiza y comprueba:

```bash
git pull --ff-only
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m pytest -q
sudo systemctl restart qubitguard.service
curl -fsS http://127.0.0.1:8781/api/health
```

Si falla una actualización, conserva los logs y vuelve al commit anotado con `git switch --detach COMMIT_ANTERIOR`, reinstala sus dependencias y reinicia el servicio. El marcador se sustituye por el hash real. Esta vuelta atrás de código no garantiza recuperar versiones exactas de Python porque las dependencias tienen rangos; para una publicación estable conviene registrar también las versiones instaladas o conservar el entorno anterior.

## 7 Opción Docker / CasaOS

Esta opción sustituye a las secciones 2, 3, 4 y 6 de esta guía: en vez de crear la `.venv` y un servicio systemd, todo QubitGuard (FastAPI, Qiskit Aer y el frontend ya compilado) corre dentro de un contenedor que Docker Compose reconstruye desde el repositorio. No necesitas Node ni Python en la laptop, solo Docker con el plugin Compose.

> Honestidad sobre el alcance: estos pasos **no se han ejecutado en tu servidor**. Se escribieron en una máquina donde Docker no está instalado, así que la imagen no se ha construido ni arrancado. El `compose.yaml` sí se validó como YAML. Las versiones concretas de Lubuntu, Docker y CasaOS de tu laptop no se han comprobado.

### 7.1 Primera instalación (en la terminal de la laptop)

Instala Docker si aún no lo tienes (una sola vez). Si CasaOS ya funciona en la laptop, Docker ya está instalado y puedes saltar este bloque:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git curl
sudo usermod -aG docker "$USER"
```

Si `docker compose version` falla después de esto (por ejemplo en Lubuntu 22.04, donde el paquete puede no existir), instala el plugin desde el repositorio oficial de Docker: <https://docs.docker.com/engine/install/ubuntu/>.

Cierra sesión y vuelve a entrar para que el grupo `docker` se aplique (o reinicia). Comprueba:

```bash
docker --version
docker compose version
```

Descarga el repositorio y construye:

```bash
mkdir -p "$HOME/apps"
git clone https://github.com/LeonardoShande/QubitGuard.git "$HOME/apps/QubitGuard"
cd "$HOME/apps/QubitGuard"
docker compose build
docker compose up -d
```

Si el checkout ya existía, no lo clones otra vez: `cd "$HOME/apps/QubitGuard" && git pull --ff-only`.

Comprueba que arrancó y que la API responde:

```bash
docker compose ps
curl -s http://127.0.0.1:8781/api/health
```

`docker compose ps` debe mostrar `qubitguard` en estado `running` (o `healthy` tras unos segundos). La respuesta esperada de `curl` es un JSON con `"status":"ok"`. En la propia laptop abre `http://127.0.0.1:8781`; desde otra computadora de la misma red, `http://IP_PRIVADA_DE_LA_LAPTOP:8781` (obtén la IP con `hostname -I`). La aplicación no tiene autenticación: úsala en una red de confianza y no abras puertos del router para ella.

Notas sobre la imagen:

- Se construye sobre `python:3.13-slim`, instala `requirements.txt` y copia solo `app/` y los archivos del frontend que el navegador usa (`index.html`, `styles.css`, `dist/`, `assets/`). `frontend/src/` y `frontend/node_modules/` quedan fuera por `.dockerignore`; el JavaScript compilado ya está versionado.
- Corre como usuario sin privilegios, con sistema de archivos de solo lectura y sin capabilities (`read_only`, `cap_drop: [ALL]`, `no-new-privileges`). Los límites `mem_limit: 1g` y `cpus: "2"` del `compose.yaml` son ejemplos conservadores, no valores medidos.
- El `HEALTHCHECK` está en el `Dockerfile` (usa `urllib` porque la imagen slim no trae `curl`).
- La imagen no incluye `scripts/` ni guarda credenciales de IBM Quantum: para ejecutar contra hardware real sigue usando la instalación nativa de esta guía.

### 7.2 Gestionarlo desde CasaOS

Que CasaOS muestre un stack arrancado desde la terminal depende de su versión: algunas solo gestionan las aplicaciones instaladas desde su propio panel. Hay dos caminos; ninguno se ha probado en tu servidor.

**A. Terminal (fiable):** con `docker compose up -d` del paso 7.1 la aplicación ya funciona en `http://IP_PRIVADA:8781`, aparezca o no en el panel. Se controla con los comandos del paso 7.3.

**B. Panel de CasaOS (para verla y controlarla ahí):**

1. Construye la imagen una vez desde la terminal: `docker compose build`. Esto deja la imagen local `qubitguard:local`.
2. Si la arrancaste en el paso 7.1, detenla para liberar el puerto: `docker compose down`.
3. En CasaOS abre **App Store → Custom Install** (en algunas versiones, el botón **+** → *Install a customized app*) y elige **Import**.
4. Pega el contenido de `compose.yaml` **quitando la línea `build: .`**. CasaOS no compila código: usará la imagen `qubitguard:local` que ya existe en la máquina.
5. Instala. QubitGuard aparece en el panel con su puerto 8781 y desde ahí se abre, se detiene o se reinicia.

Para actualizar por el camino B: `git pull && docker compose build` en la terminal y después reinicia la app desde CasaOS.

### 7.3 Actualizar, ver logs y detener

```bash
cd "$HOME/apps/QubitGuard"
git status --short          # debe estar vacío o solo con cambios propios
git pull --ff-only
docker compose up -d --build
docker compose logs -f       # Ctrl+C para salir de los logs, no detiene el contenedor
docker compose down          # detiene y elimina el contenedor; la imagen queda
```

`up -d --build` reconstruye la imagen con el código nuevo y recrea el contenedor. Para volver a un commit anterior: `git switch --detach COMMIT_ANTERIOR`, luego `docker compose up -d --build` (el marcador se sustituye por el hash real).

### 7.4 Publicar con Cloudflare Tunnel

Con el contenedor en marcha, el destino del túnel es `http://localhost:8781` si `cloudflared` corre en la laptop de forma nativa o en un contenedor con red host. Si `cloudflared` corre en otro contenedor con red bridge, `localhost` apunta al propio contenedor: usa `http://IP_PRIVADA_DE_LA_LAPTOP:8781`.

Añade **solo una ruta nueva** al túnel existente (por ejemplo `qubitguard.tudominio.com`) y conserva las rutas de los demás servicios. Prueba temporal, si ya tienes `cloudflared`:

```bash
cloudflared tunnel --url http://localhost:8781
```

La URL temporal cambia al reiniciar y no sirve para una demo estable. **No expongas el panel de administración de CasaOS** (ni su puerto) a través del túnel: solo el puerto 8781 de QubitGuard. QubitGuard no implementa autenticación, así que cualquiera con el dominio puede usarlo y consumir CPU simulando circuitos.

### 7.5 Problemas frecuentes

| Síntoma | Qué revisar |
|---|---|
| `port is already allocated` / puerto ocupado | Ya hay algo escuchando en 8781 (`ss -ltn \| grep ':8781'`). Detén el servicio systemd antiguo (`sudo systemctl disable --now qubitguard.service`) o el proceso manual antes de usar Docker. |
| El contenedor arranca y se reinicia | `docker compose logs --tail=100 qubitguard`; suele ser una dependencia que no se instaló o el puerto tomado dentro del contenedor. |
| `docker compose ps` dice `unhealthy` | Espera el `start-period` (30 s) y prueba `docker compose exec qubitguard python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8781/api/health').status)"`. |
| La página no carga pero la API sí | Comprueba que `frontend/index.html` y `frontend/dist/` están en la imagen: `docker compose exec qubitguard ls frontend`. |
| La build tarda mucho o se queda sin memoria | Compilar es sobre todo descargar e instalar ruedas de Qiskit y Aer (cientos de MB). La primera build puede tardar varios minutos. |
| Arquitectura ARM (laptop ARM) frente a x86 | Qiskit Aer publica ruedas `manylinux` para CPython 3.13 en `x86_64` **y** `aarch64` (verificado en PyPI para qiskit-aer 0.18.0), así que no debería compilar desde fuente. Si tu CPU no es ninguna de esas dos, la build intentaría compilar y necesitaría más tiempo, memoria y herramientas de C++. |

El límite de dos simulaciones ruidosas simultáneas es por proceso y aquí hay un solo worker; con varias personas usando la demo a la vez, unas pueden recibir `503 SimulatorBusy`. No se ha medido la capacidad con usuarios simultáneos.

## Encargo concreto para GLM 5.3 MAX

```text
Ayúdame a desplegar QubitGuard en mi laptop Lubuntu con CasaOS. Tu alcance es instalación y verificación del servidor; no cambies interfaz, fondo ASCII, introducción IBM, lógica Qiskit ni contratos de API. No estás solo en el proyecto: preserva los cambios de otros agentes.

Lee docs/LUBUNTU_CASAOS.md. Primero comprueba versión de Lubuntu/Python, arquitectura, RAM disponible, puerto, ruta del checkout y si cloudflared corre nativo, en red host o bridge. No leas ni imprimas tokens, contraseñas o archivos de credenciales.

Prepara un plan con rutas y puertos reales. Reutiliza el túnel existente sin modificar sus otras rutas. Antes de escribir servicios o publicar una ruta nueva, muéstrame los cambios concretos para aprobarlos. Solo ejecuta si te autorizo y tienes acceso real a esa laptop; no supongas que la terminal local está en Linux.

Valida instalación, pytest, arranque manual, servicio systemd y health local. Tras autorizar la publicación, comprueba HTTPS desde otra red y una interacción de Grover. Prueba el arranque tras reinicio únicamente cuando yo confirme que se puede reiniciar la laptop.

Entrega comandos ejecutados y sus salidas resumidas, URL verificada, commit instalado, forma de consultar logs y procedimiento de vuelta atrás. Separa lo probado de lo pendiente. No hagas push, merges ni cambios ajenos al despliegue.
```
