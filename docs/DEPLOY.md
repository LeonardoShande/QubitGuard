# Despliegue y seguridad

QubitGuard corre como un solo proceso (FastAPI sirve la API y el frontend). Qiskit Aer necesita CPU y librerías nativas, así que no encaja en Cloudflare Workers; la forma recomendada de publicar la demo es dejar el servidor en una máquina propia y exponerlo con **Cloudflare Tunnel**, sin abrir puertos.

## Demo pública rápida (sin cuenta)

```bash
brew install cloudflared
../.venv/bin/python -m uvicorn app.main:app --port 8000
cloudflared tunnel --url http://localhost:8000
```

`cloudflared` imprime una URL `https://<algo>.trycloudflare.com`. Es temporal y cambia en cada arranque: sirve para el jurado durante el evento, no como hosting permanente.

## Con dominio propio (cuenta de Cloudflare)

1. `cloudflared tunnel login`, `cloudflared tunnel create qubitguard`, `cloudflared tunnel route dns qubitguard demo.tudominio.com`.
2. En el panel: SSL/TLS en modo Full y HSTS activado (el backend no envía HSTS porque en local se sirve por http).
3. WAF → Rate limiting: una regla para `POST /api/quantum/grover` (p. ej. 20 peticiones por minuto por IP). La simulación con ruido FakeFez es la operación más cara (~1-3 s de CPU).
4. Opcional: Cloudflare Access si la demo debe ser privada para el jurado.

## Lo que ya hace el backend

- Cabeceras: CSP `default-src 'self'` (sin scripts de terceros ni inline), `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, `X-Frame-Options: DENY`, COOP.
- Caché: contenido educativo y tablas deterministas con `max-age`; resultados de simulación `no-store`; frontend `no-cache` con ETag (304 barato y nunca JS viejo).
- Cálculo: caché en memoria de la curva Statevector, la tabla de comparación y las simulaciones con semilla; máximo 2 simulaciones ruidosas a la vez (si no, 503 con `Retry-After`).
- Validación: todos los cuerpos con `extra="forbid"` y rangos acotados; ningún endpoint acepta contraseñas.
- Privacidad: el analizador y el generador de contraseñas corren solo en el navegador (`crypto.getRandomValues`, sin semilla); hay tests que prohíben red, almacenamiento y `Math.random` en esos módulos.
