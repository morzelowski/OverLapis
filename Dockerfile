# ---- Build stage ----
FROM node:20-slim AS build

RUN apt-get update && apt-get install -y \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json* ./
COPY client/package.json client/
COPY server/package.json server/

# Install all dependencies (including devDependencies for building)
RUN npm install

# Copy source code
COPY tsconfig.base.json ./
COPY client/ client/
COPY server/ server/

# Build client (tsc + vite build -> client/dist/)
RUN npm run build --workspace=client

# Build server (tsc -> server/dist/)
RUN npm run build --workspace=server

# ---- Production stage ----
FROM node:20-slim

RUN apt-get update && apt-get install -y \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json* ./
COPY server/package.json server/

# Install production deps only (server workspace)
RUN npm install --workspace=server --omit=dev

# Clean up build tools after native deps are compiled
RUN apt-get purge -y python3 make g++ && apt-get autoremove -y

# Copy built artifacts
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/client/dist client/dist

# Create docs directory (Welcome.md is seeded at runtime if empty)
RUN mkdir -p /app/docs

VOLUME /app/docs

EXPOSE 4444

ENV NODE_ENV=production
ENV PORT=4444

CMD ["node", "server/dist/index.js"]
