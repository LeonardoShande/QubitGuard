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

## Encargo concreto para GLM 5.3 MAX

```text
Ayúdame a desplegar QubitGuard en mi laptop Lubuntu con CasaOS. Tu alcance es instalación y verificación del servidor; no cambies interfaz, fondo ASCII, introducción IBM, lógica Qiskit ni contratos de API. No estás solo en el proyecto: preserva los cambios de otros agentes.

Lee docs/LUBUNTU_CASAOS.md. Primero comprueba versión de Lubuntu/Python, arquitectura, RAM disponible, puerto, ruta del checkout y si cloudflared corre nativo, en red host o bridge. No leas ni imprimas tokens, contraseñas o archivos de credenciales.

Prepara un plan con rutas y puertos reales. Reutiliza el túnel existente sin modificar sus otras rutas. Antes de escribir servicios o publicar una ruta nueva, muéstrame los cambios concretos para aprobarlos. Solo ejecuta si te autorizo y tienes acceso real a esa laptop; no supongas que la terminal local está en Linux.

Valida instalación, pytest, arranque manual, servicio systemd y health local. Tras autorizar la publicación, comprueba HTTPS desde otra red y una interacción de Grover. Prueba el arranque tras reinicio únicamente cuando yo confirme que se puede reiniciar la laptop.

Entrega comandos ejecutados y sus salidas resumidas, URL verificada, commit instalado, forma de consultar logs y procedimiento de vuelta atrás. Separa lo probado de lo pendiente. No hagas push, merges ni cambios ajenos al despliegue.
```
