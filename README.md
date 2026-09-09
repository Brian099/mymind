# OpenMindMap - 自建云端思维导图平台

一套轻量级、高颜值、支持 **Docker 容器化一键部署** 的多用户思维导图 Web 平台。

![Vue 3](https://img.shields.io/badge/Vue-3.5-brightgreen.svg)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)
![SQLite](https://img.shields.io/badge/Database-SQLite-blue.svg)
![Docker](https://img.shields.io/badge/Deploy-Docker-2496ED.svg)

---

## ✨ 核心特性

- 🧠 **专业思维导图引擎**：基于 `simple-mind-map`，支持多种布局（逻辑结构图、思维导图、组织结构图、目录组织图、鱼骨图、时间轴等）。
- 👥 **用户体系与数据隔离**：支持多用户独立注册/登录（JWT 认证），用户间脑图数据完全隔离。
- 🔗 **免登录公开分享**：支持为每张脑图一键生成专属分享短链，他人无需登录即可在浏览器中以交互式只读模式浏览。
- 🔒 **访问密码保护**：分享链接支持选填访问密码，保护私密脑图不被未经授权访问。
- 📦 **全格式导入与导出**：
  - **导入**：支持 JSON/SMM 原生格式、Markdown 大纲格式解析导入。
  - **导出**：支持导出为 **PNG 高清图**、**SVG 矢量图**、**PDF 文档**、**Markdown 大纲**、**JSON 原生工程文件**。
- 💾 **单文件 SQLite 持久化**：零额外数据库运维负担，只需挂载单个 `./data` 目录即可完整备份和迁移全部数据。
- ⚡ **自动保存与快捷键**：编辑过程前端防抖自动同步至服务端，支持 `Tab` 添加子节点、`Enter` 添加同级节点、`Del` 删除、`Ctrl+S` 保存等。

---

## 🚀 Docker 一键部署

只需一条命令即可在服务器或本地运行：

### 1. 使用 Docker Compose（推荐）

在项目根目录下执行：

```bash
# 启动容器并在后台运行
docker compose up -d
```

启动完成后，打开浏览器访问：`http://<你的服务器IP>:8080`

### 2. 手动 Docker Build & Run

```bash
# 构建镜像
docker build -t open-mindmap:latest .

# 运行容器并挂载数据卷
docker run -d \
  -p 8080:8080 \
  --name open-mindmap \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  open-mindmap:latest
```

---

## 💻 本地开发指南

### 1. 安装依赖

```bash
# 1. 安装服务端依赖
cd server
npm install

# 2. 安装前端依赖
cd ../client
npm install
```

### 2. 启动开发环境

```bash
# 启动后端服务 (默认端口 3000)
cd server
npm run dev

# 启动前端 Vite 热重载服务 (默认端口 5173，自动代理 API)
cd client
npm run dev
```

浏览器访问 `http://localhost:5173` 即可进行实时调试与开发。

---

## 📂 项目目录结构

```
思维导图/
├── client/                     # Vue 3 前端工程
│   ├── src/
│   │   ├── api/                # Axios 请求封装与拦截器
│   │   ├── components/         # 分享弹窗、导入导出弹窗等通用组件
│   │   ├── router/             # Vue Router 路由守卫与配置
│   │   ├── stores/             # Pinia 状态管理 (Auth 用户鉴权)
│   │   ├── utils/              # Markdown 解析与脑图辅助工具
│   │   └── views/              # 登录、注册、工作台、脑图编辑、只读分享视图
│   ├── package.json
│   └── vite.config.js
├── server/                     # Node.js + Express 后端服务
│   ├── src/
│   │   ├── middleware/         # JWT 鉴权中间件
│   │   ├── routes/             # 认证、脑图 CRUD、公开分享接口
│   │   ├── db.js               # SQLite 数据库初始化与连接池
│   │   └── server.js           # Express 服务入口与前端静态托管
│   └── package.json
├── data/                       # 数据库持久化目录 (挂载卷)
│   └── database.sqlite
├── Dockerfile                  # 多阶段构建 Dockerfile
├── docker-compose.yml          # Docker Compose 编排文件
└── README.md                   # 项目文档
```

---

## 🎯 快捷键指南

| 快捷键 | 功能 |
| :--- | :--- |
| `Tab` | 选中节点时，创建**子节点** |
| `Enter` | 选中节点时，创建**同级节点** |
| `Delete` / `Backspace` | 删除当前选中节点 |
| `Ctrl + Z` | 撤销上一步操作 |
| `Ctrl + Y` | 重做 |
| `Ctrl + S` | 手动保存脑图数据 |
| `鼠标滚轮` / `双指捏合` | 缩放与平移画布 |
| `双击节点` | 进入富文本节点编辑模式 |

---

## 📄 License
MIT License.
