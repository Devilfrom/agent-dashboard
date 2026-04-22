# Multi-Agent Command Center

可视化多Agent协作指挥中心 - 支持实时任务调度、流程可视化、AI模型切换。

![Preview](docs/preview.png)

## 功能特性

- 🎯 **多Agent协作**: 内置5种专业Agent（研究员、工程师、创作者、审核员、指挥官）
- 📊 **实时流程可视化**: React Flow 节点编排，支持拖拽和缩放
- 🎮 **3D游戏化界面**: Three.js 实现的沉浸式视觉效果
- 🔄 **流式响应**: 支持 SSE 流式输出，实时展示AI思考过程
- 🔧 **灵活后端**: 支持对接多种AI API（OpenAI兼容、MiniMax等）
- 📝 **结果导出**: 任务执行结果可查看、复制和导出

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/Devilfrom/agent-dashboard.git
cd agent-dashboard
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
pip install -r requirements.txt

# 安装前端依赖 (需要 Node.js 18+)
cd ../
npm install
```

### 3. 配置后端

编辑 `backend/server.py`，修改以下配置：

```python
# API 配置
API_BASE_URL = "http://your-api-endpoint.com/v1"  # 你的AI API地址
MODEL_NAME = "your-model-name"                     # 使用的模型名称
API_KEY = "your-api-key"                          # API密钥
```

### 4. 启动服务

```bash
# 终端1: 启动后端 (端口3001)
python backend/server.py

# 终端2: 启动前端开发服务器 (端口5173)
npm run dev
```

或者使用构建版本：

```bash
# 终端1: 启动后端
python backend/server.py

# 终端2: 启动静态文件服务器 (端口5301)
# Python
python -m http.server 5301

# Node.js (推荐)
npx serve dist -l 5301
```

### 5. 访问

打开浏览器访问: http://localhost:5301

## 项目结构

```
agent-dashboard/
├── backend/                 # Flask 后端
│   ├── server.py           # 主服务入口
│   └── requirements.txt    # Python 依赖
├── src/                    # React 前端源码
│   ├── components/         # UI 组件
│   │   ├── AgentFlow.tsx   # 流程图组件
│   │   ├── ControlPanel.tsx # 控制面板
│   │   ├── ResultPanel.tsx # 结果展示
│   │   └── ...
│   ├── store/              # 状态管理
│   └── App.tsx             # 主应用
├── dist/                   # 构建产物
├── package.json
└── vite.config.ts
```

## API 端点

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/api/agents` | 获取Agent列表 |
| POST | `/api/chat` | 单轮对话 |
| POST | `/api/chat/stream` | 流式对话 |
| POST | `/api/task/start` | 启动多Agent任务 |
| GET | `/api/task/<id>/status` | 获取任务状态 |
| GET | `/api/task/<id>/results` | 获取任务结果 |

## 内置Agent

| Agent | 角色 | 描述 |
|-------|------|------|
| `researcher` | 研究员 | 调研分析、资料收集 |
| `coder` | 工程师 | 代码开发、技术实现 |
| `writer` | 创作者 | 文档撰写、内容创作 |
| `reviewer` | 审核员 | 质量审核、问题发现 |
| `orchestrator` | 指挥官 | 任务调度、流程协调 |

## 配置示例

### MiniMax API

```python
API_BASE_URL = "https://api.minimax.chat/v1"
MODEL_NAME = "MiniMax-Text-01"
API_KEY = "your-minimax-api-key"
```

### 自定义OpenAI兼容API

```python
API_BASE_URL = "http://your-gateway:36007/ai/uifm/open/v1"
MODEL_NAME = "minimax-m25"
API_KEY = "your-api-key"
```

## 开发

### 前端开发

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build
```

### 后端开发

```bash
# 启动服务
python backend/server.py

# 访问API文档
# 启动后访问 http://localhost:3001/docs (Swagger UI)
```

## 技术栈

- **前端**: React 18, TypeScript, Vite, TailwindCSS, React Flow, Three.js
- **后端**: Flask, Python 3.10+
- **状态管理**: Zustand
- **动画**: Framer Motion, GSAP

## License

MIT