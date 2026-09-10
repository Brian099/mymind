ARG NODE_IMAGE=node:20-alpine

# Stage 1: Build the Vue 3 Frontend
FROM ${NODE_IMAGE} AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# Stage 2: Production Server & Single Container Packaging
FROM ${NODE_IMAGE} AS runner
WORKDIR /app

RUN apk add --no-cache python3 make g++

WORKDIR /app/server

COPY server/package*.json ./
RUN npm install --omit=dev

COPY server/ ./

# Copy built frontend assets into client/dist
COPY --from=client-builder /app/client/dist /app/client/dist

# Setup data persistence folder
RUN mkdir -p /app/data

ENV PORT=8080
ENV DATA_DIR=/app/data
ENV DB_PATH=/app/data/database.sqlite
ENV NODE_ENV=production

EXPOSE 8080

VOLUME ["/app/data"]

CMD ["node", "src/server.js"]
