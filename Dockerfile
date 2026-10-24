FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# app/main.py monta el frontend solo si existe frontend/index.html: conserva esta ruta relativa (/app/app, /app/frontend).
COPY app ./app
COPY frontend/index.html frontend/styles.css ./frontend/
COPY frontend/dist ./frontend/dist
COPY frontend/assets ./frontend/assets

# Sin escrituras en tiempo de ejecución: el contenedor puede correr con read_only.
RUN useradd --uid 10001 --create-home --shell /usr/sbin/nologin qubitguard
USER qubitguard

EXPOSE 8781

# slim no trae curl; urllib falla con código distinto de cero si /api/health no responde.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8781/api/health', timeout=3)"]

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8781", "--workers", "1", "--proxy-headers"]
