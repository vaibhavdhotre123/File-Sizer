# syntax=docker/dockerfile:1

# Install dependencies once, then reuse them for the build and production stages.
FROM node:22-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production

# Only production dependencies are needed to run Next.js.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

RUN addgroup --system --gid 1001 nextjs \
  && adduser --system --uid 1001 nextjs \
  && chown -R nextjs:nextjs /app

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["npm", "start"]
