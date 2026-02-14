# ---------- Stage 1: Build ----------
FROM rust:bookworm as builder
WORKDIR /app

COPY Cargo.toml Cargo.lock ./

RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

COPY . .

RUN cargo build --release

# ---------- Stage 2: Runtime ----------
FROM debian:bookworm

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    nodejs \
    npm \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g typescript
    
WORKDIR /app

COPY --from=builder /app/target/release/runtime /app/runtime

RUN chmod +x /app/runtime

EXPOSE 8080

CMD ["/app/runtime"]