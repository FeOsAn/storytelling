# Build stage — needs toolchain for the better-sqlite3 native module
FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# Runtime stage
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
# SQLite must live on a mounted volume in production:
# set STORYFIT_DB=/data/data.db and mount a volume at /data.
EXPOSE 5000
CMD ["node", "dist/index.cjs"]
