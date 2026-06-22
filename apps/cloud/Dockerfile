# Vidova cloud (accounts / credits / billing) — FastAPI.
# Deploy target: Railway / Fly / Render / any container host.
FROM python:3.11-slim

# psycopg2-binary ships libpq, so no apt build deps are needed.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install deps first for layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code only (the .dockerignore keeps .env, *.db, tests out of the image).
COPY app ./app

# Railway/Fly inject $PORT at runtime; default to 8787 for local `docker run`.
ENV PORT=8787
EXPOSE 8787

# Shell form so $PORT expands. Bind 0.0.0.0 so the platform can route to it.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
