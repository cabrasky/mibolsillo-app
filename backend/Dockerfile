FROM python:3.12-slim AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.12-slim

RUN groupadd -r gastos && useradd -r -g gastos -d /app -s /bin/false gastos

WORKDIR /app
COPY --from=builder /root/.local /usr/local
COPY . .

# Versión del despliegue (git short sha inyectado por CI)
ARG GIT_SHA=dev
RUN echo "$GIT_SHA" > /app/version.txt

EXPOSE 8000
USER gastos
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
