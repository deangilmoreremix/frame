FROM node:18-alpine AS base
RUN npm install -g pnpm@8.15.0
WORKDIR /app

FROM base AS prod
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* .npmrc* ./
COPY packages/frame-common ./packages/frame-common
COPY packages/frame-backend ./packages/frame-backend
RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm --filter @frame/common run build
RUN pnpm --filter @frame/backend run build
EXPOSE 4000
CMD ["pnpm", "--filter", "@frame/backend", "start"]
