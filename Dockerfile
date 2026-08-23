# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# e-KokoT6 — Next.js 16 + Prisma 6 (PostgreSQL)
# Bina:  docker build -t ekokot6 .
# Guna:  lihat docker-compose.yml (disyorkan) atau DOCKER.md
# ---------------------------------------------------------------------------

ARG NODE_VERSION=24-alpine

# ==== 1. deps — pasang semua dependency (dev disertakan, perlu untuk build) ==
FROM node:${NODE_VERSION} AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
# `postinstall` menjalankan `prisma generate`, jadi skema mesti ada dahulu
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ==== 2. builder — jana Prisma Client + `next build` (mod standalone) ========
FROM node:${NODE_VERSION} AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# NEXT_PUBLIC_* ditanam masa build — mesti dihantar sebagai build arg.
ARG NEXT_PUBLIC_APP_NAME="KoKurikulum"
ARG NEXT_PUBLIC_INSTITUSI="KTE (Prauniversiti) Desa Mahkota"
ARG NEXT_PUBLIC_BASE_URL="http://localhost:3000"
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_INSTITUSI=$NEXT_PUBLIC_INSTITUSI \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

ENV NEXT_TELEMETRY_DISABLED=1 \
    DOCKER_BUILD=1 \
    NODE_ENV=production
# Placeholder sahaja: tiada sambungan DB sebenar berlaku semasa build.
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/placeholder?schema=public"

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ==== 3. migrator — imej berasingan untuk `migrate deploy` & seed ============
FROM node:${NODE_VERSION} AS migrator
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src
CMD ["npx", "prisma", "migrate", "deploy"]

# ==== 4. runner — imej produksi yang langsing ================================
FROM node:${NODE_VERSION} AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Enjin Prisma kadangkala tidak lengkap dalam jejak output standalone.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# STORAGE_DRIVER="local" menulis ke public/uploads — lekapkan volume di sini.
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
