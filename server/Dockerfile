# ==============================================================================
# LYFADS ERP - Backend Dockerfile (Multi-stage build)
# ==============================================================================

# Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies (needed for bcrypt, openssl for prisma)
RUN apk add --no-cache python3 make g++ openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Production Stage
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl dumb-init

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER node

EXPOSE 3000

CMD ["dumb-init", "node", "dist/main.js"]
