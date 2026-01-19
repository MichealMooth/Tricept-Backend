# Backend Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate \
  && pnpm install --frozen-lockfile

# Build
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN pnpm prisma generate && pnpm build

# Runtime
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/index.js"]
