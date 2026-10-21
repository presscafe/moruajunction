# Morua Junction — Rust API service.
#
# Multi-stage: the Rust build happens in the official image (crates.io is
# reachable there), the runtime image carries only the binary and a CA
# bundle. The SQLite file lives on a mounted volume so the mall keeps its
# ledger across restarts.

FROM rust:1-slim AS builder
WORKDIR /build

RUN apt-get update \
 && apt-get install -y --no-install-recommends pkg-config \
 && rm -rf /var/lib/apt/lists/*

COPY rust/Cargo.toml rust/Cargo.lock* ./
COPY rust/src ./src
COPY rust/seed ./seed

RUN cargo build --release --locked

FROM debian:bookworm-slim
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --system --create-home --uid 10001 morua

COPY --from=builder /build/target/release/morua /usr/local/bin/morua
COPY rust/seed/morua.json /app/seed/morua.json

RUN mkdir -p /app/data && chown -R morua:morua /app
USER morua

ENV MORUA_DB=/app/data/morua.db
ENV PORT=8787
EXPOSE 8787
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 \
  CMD ["/usr/local/bin/morua", "--health"]

ENTRYPOINT ["/usr/local/bin/morua"]
