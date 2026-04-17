FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG APPHUB_API_KEY
ARG APPHUB_API_URL
ARG APPHUB_APP_SLUG
ARG APPHUB_DATA_BASE_URL
ENV APPHUB_API_URL=$APPHUB_API_URL
ENV APPHUB_API_KEY=$APPHUB_API_KEY
ENV APPHUB_DATA_BASE_URL=$APPHUB_DATA_BASE_URL
ENV APPHUB_APP_SLUG=$APPHUB_APP_SLUG

RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=80

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 80
CMD ["node", "server.js"]
