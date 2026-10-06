FROM node:22-bookworm-slim AS frontend
WORKDIR /build
COPY logintel_ui/package*.json ./
RUN npm ci
COPY logintel_ui/ ./
ENV VITE_SOURCE_URL=/source/
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY requirements-render.txt ./
RUN pip install --no-cache-dir -r requirements-render.txt
COPY LogIntel_engine/ ./LogIntel_engine/
COPY live_app/ ./live_app/
COPY render_app.py ./
COPY render_wsgi.py ./
COPY --from=frontend /build/dist ./logintel_ui/dist
ENV NEUROLOG_LOCAL_MODE=true OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1
CMD ["sh", "-c", "exec gunicorn render_wsgi:application --bind 0.0.0.0:${PORT:-10000} --workers 1 --threads 4 --timeout 90"]
