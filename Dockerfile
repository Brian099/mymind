# 默认使用可国内直连的 Node 镜像加速源（也可替换为标准 node:20-alpine）
ARG NODE_IMAGE=docker.m.daocloud.io/library/node:20-alpine

# Stage 1: Build the Vue 3 Frontend
FROM ${NODE_IMAGE} AS client-builder
WORKDIR /app/client

# 配置 npm 国内镜像加速构建
RUN npm config set registry https://registry.npmmirror.com

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# Stage 2: Production Server & Single Container Packaging
FROM ${NODE_IMAGE} AS runner
WORKDIR /app

# 配置 Alpine 国内镜像源与 npm 镜像
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories || true
RUN apk add --no-cache python3 make g++

WORKDIR /app/server
RUN npm config set registry https://registry.npmmirror.com

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
