FROM node:24-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

COPY src/ ./src/

RUN mkdir -p /data && chown appuser:appgroup /data

USER appuser

ENV PORT=3000
ENV DB_PATH=/data/grocery.db

EXPOSE 3000

CMD ["node", "src/server.js"]
