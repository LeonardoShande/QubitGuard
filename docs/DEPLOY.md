# Despliegue y seguridad

Para la laptop del usuario con **Lubuntu y CasaOS**, sigue la [guía específica con servicio systemd, acceso LAN y túnel](LUBUNTU_CASAOS.md). Incluye un prompt acotado para GLM 5.3 MAX.

QubitGuard corre como un solo proceso (FastAPI sirve la API y el frontend). Qiskit Aer necesita CPU y librerías nativas, así que no encaja en Cloudflare Workers; la forma recomendada de publicar la demo es dejar el servidor en una máquina propia y exponerlo con **Cloudflare Tunnel**, sin abrir puertos.

## Demo pública rápida (sin cuenta)

```bash
brew install cloudflared
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

El segundo comando se ejecuta desde la raíz con el entorno virtual activo, después de seguir la instalación del [README](../README.md#instalación-y-ejecución). En otra terminal:

```bash
cloudflared tunnel --url http://localhost:8000
```

`cloudflared` imprime una URL `https://<algo>.trycloudflare.com`. Es temporal y cambia en cada arranque: sirve para el jurado durante el evento, no como hosting permanente.

## Con dominio propio (cuenta de Cloudflare)

1. `cloudflared tunnel login`, `cloudflared tunnel create qubitguard`, `cloudflared tunnel route dns qubitguard demo.tudominio.com`.
2. En el panel: SSL/TLS en modo Full y HSTS activado (el backend no envía HSTS porque en local se sirve por http).
3. WAF → Rate limiting: configurar una regla para `POST /api/quantum/grover` según los recursos disponibles. Una tasa como 20 peticiones por minuto por IP es solo un ejemplo, no una capacidad medida ni una configuración ya aplicada. La disponibilidad de estas funciones depende de la cuenta y del servicio contratado.
4. Opcional: Cloudflare Access si la demo debe ser privada para el jurado.

## Lo que ya hace el backend

- Cabeceras: CSP `default-src 'self'` (sin scripts de terceros ni inline), `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, `X-Frame-Options: DENY`, COOP.
- Caché: contenido educativo y tablas deterministas con `max-age`; resultados de simulación `no-store`; frontend `no-cache` con ETag (304 barato y nunca JS viejo).
- Cálculo: caché en memoria de la curva Statevector, la tabla de comparación y las simulaciones con semilla; máximo 2 simulaciones ruidosas a la vez por proceso. Si tras esperar hasta 10 segundos no hay cupo, devuelve 503 con `Retry-After: 2`. Esto no limita las peticiones por IP ni la concurrencia de simulaciones ideales.
- Validación: todos los cuerpos con `extra="forbid"` y rangos acotados; ningún endpoint acepta contraseñas.
- Privacidad: el analizador y el generador de contraseñas corren solo en el navegador (`crypto.getRandomValues`, sin semilla); hay tests que prohíben red, almacenamiento y `Math.random` en esos módulos.

El túnel no mantiene el proceso por sí mismo ni evita que la computadora se suspenda. Para una publicación estable hace falta supervisión del servidor, disponibilidad de la máquina y verificación externa del enlace. Más workers implican cachés y límites independientes; no se ha medido aquí la capacidad bajo carga.
