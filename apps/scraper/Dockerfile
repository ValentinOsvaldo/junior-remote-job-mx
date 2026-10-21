# Scraper image: no local Python needed. Used by `pnpm scrape:docker` and CI.
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy PYTHONIOENCODING=utf-8 PYTHONUNBUFFERED=1

# Dependencies first so code changes don't reinstall them
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project

COPY src ./src
COPY tests ./tests
RUN uv sync --frozen

ENTRYPOINT ["uv", "run", "--no-sync", "scrape", "--out", "/out/jobs.json"]
