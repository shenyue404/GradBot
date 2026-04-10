# GradBot

GradBot 是一个面向高校毕业设计全过程管理的前后端分离系统，覆盖学生、教师、管理员三类角色，支持选题、任务书、开题报告、中期检查、教师审核、管理员调配与进度预警等完整流程。

当前项目已经接入 MySQL，并集成 DeepSeek API，用于学生端智能生成、教师端 AI 评估与 AI 评语生成。

## 功能概览

### 学生端
- 智能生成选题，返回 5 个中文备选题目
- 提交与查看选题状态
- 智能生成任务书、开题报告、中期报告
- 保存草稿、提交审核、上传已有文档
- 查看教师反馈与阶段状态
- 查看 AI 连通性检测页

### 教师端
- 查看本人名下学生的选题、任务书、开题报告和中期报告
- 对任务书、开题报告、中期报告进行 AI 评分
- 基于 AI 自动生成评语，并支持教师手动修改后提交
- 审核通过、退回修改、拒绝
- 查看个人资料与指导信息

### 管理员端
- 全校教师与学生名单管理
- 单个录入教师、学生
- Excel 批量导入教师、学生
- 建立和调整师生指导关系
- 查看教师名下学生详情
- 查看全校学生进度、质量预警
- 按学院、专业、年级筛选风险学生

## 技术栈

### 后端
- Node.js
- Express
- Sequelize
- MySQL
- OpenAI SDK（对接 DeepSeek 兼容接口）
- Multer
- xlsx

### 前端
- React
- TypeScript
- Vite
- Ant Design
- Axios
- React Router

## 项目结构

```text
GradBot/
├─ backend/                   后端服务
│  ├─ src/
│  │  ├─ config/              数据库配置
│  │  ├─ models/              Sequelize 模型
│  │  ├─ routes/              业务路由
│  │  ├─ services/            AI 与业务服务
│  │  └─ index.js             服务入口
│  ├─ seed_test_data.js       测试数据脚本
│  └─ package.json
├─ frontend/                  前端应用
│  ├─ src/
│  │  ├─ components/          布局与通用组件
│  │  ├─ pages/               学生 / 教师 / 管理员页面
│  │  ├─ utils/               API 封装
│  │  └─ App.tsx
│  └─ package.json
├─ SETUP_GUIDE.md             环境配置说明
├─ USAGE_GUIDE.md             使用说明
└─ 一键启动项目.bat          Windows 一键启动脚本
```

## 环境要求

- Node.js 16 及以上
- MySQL 8.0 推荐
- npm

## 环境变量

后端 `backend/.env` 至少需要包含以下配置：

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=gradbot
DB_USER=root
DB_PASSWORD=你的数据库密码

DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_API_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

AI_TIMEOUT_MS=12000
JWT_SECRET=gradbot-secret
NODE_ENV=development
```

前端 `frontend/.env` 示例：

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## 安装与启动

### 1. 安装依赖

分别在前后端目录执行：

```bash
cd backend
npm install
```

```bash
cd frontend
npm install
```

### 2. 准备数据库

确保本机 MySQL 已启动，并提前创建数据库：

```sql
CREATE DATABASE gradbot DEFAULT CHARACTER SET utf8mb4;
```

### 3. 启动后端

```bash
cd backend
npm start
```

开发模式也可以使用：

```bash
npm run dev
```

后端默认地址：

```text
http://localhost:3000
```

健康检查接口：

```text
http://localhost:3000/api/health
```

AI 连通检查接口：

```text
http://localhost:3000/api/health/ai
```

### 4. 启动前端

```bash
cd frontend
npm run dev
```

前端默认地址：

```text
http://localhost:5173
```

### 5. 一键启动

Windows 环境下也可以直接运行根目录脚本：

```powershell
.\一键启动项目.bat
```

## 测试数据

后端已内置测试数据脚本：

```bash
cd backend
npm run seed
```

这个脚本会：
- 初始化管理员、教师、学生账号
- 建立默认师生指导关系
- 插入部分选题、任务书、开题报告和中期报告示例数据

## 测试账号

以下账号由 `backend/seed_test_data.js` 生成，默认密码统一为：

```text
GradBot123!
```

### 管理员
- `admin@gradbot.local`

### 教师
- `teacher@gradbot.local`
- `wangqian@gradbot.local`
- `chentao@gradbot.local`

### 学生
- `student@gradbot.local`
- `liuyang@gradbot.local`
- `zhaoyue@gradbot.local`
- `sunke@gradbot.local`
- `zhouting@gradbot.local`
- `hefan@gradbot.local`
- `yangfan@gradbot.local`
- `wudi@gradbot.local`

## 常用脚本

### 后端

```bash
npm start
```

启动后端服务。

```bash
npm run dev
```

使用 `nodemon` 启动后端开发服务。

```bash
npm run seed
```

重置并写入测试数据。

### 前端

```bash
npm run dev
```

启动开发服务器。

```bash
npm run build
```

构建前端生产包。

```bash
npm run preview
```

预览构建结果。

## 当前项目特点

- 学生端智能生成已统一走真实 AI 调用链
- 教师端 AI 评分与 AI 评语已接入后端服务
- 管理员端支持师生绑定、进度预警和批量导入
- 任务书、开题报告、中期报告页面已按中文模板进行适配
- 项目内含 AI 连通性检测页，便于排查 DeepSeek 调用问题

## 说明

- 如果 AI 连通检测正常，但页面生成卡住，优先重启前后端并查看学生端右下角调试信息
- 如果 MySQL 无法自动启动，请以管理员身份运行脚本或手动启动 `MySQL80`
- 如果前端端口或后端端口被占用，请先关闭已有进程再启动

## 相关文档

- [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- [USAGE_GUIDE.md](./USAGE_GUIDE.md)
