FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src
COPY public ./public

FROM node:20-alpine

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app /app

USER appuser

EXPOSE 3000

HEALTHCHECK CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

CMD ["node", "src/app.js"]