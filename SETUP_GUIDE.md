# 项目配置详细指南

## 📋 配置清单

在启动项目前，需要完成以下配置：
- [ ] 安装并启动 MySQL 服务
- [ ] 创建数据库
- [ ] 配置后端环境变量（.env 文件）
- [ ] 安装项目依赖
- [ ] 启动后端服务
- [ ] 启动前端服务

---

## 1️⃣ 安装并启动 MySQL 服务

### Windows 系统

#### 方法一：使用 MySQL 安装包
1. 下载 MySQL：
   - 访问 https://dev.mysql.com/downloads/mysql/
   - 选择 Windows (x86, 64-bit), ZIP Archive 或 MySQL Installer
   - 下载并安装

2. 启动 MySQL 服务：
   ```powershell
   # 方法1：使用服务管理器
   # 按 Win+R，输入 services.msc，找到 MySQL80，右键启动
   
   # 方法2：使用命令行（以管理员身份运行）
   net start MySQL80
   ```

3. 验证 MySQL 是否运行：
   ```powershell
   # 打开新的命令行窗口
   mysql --version
   # 如果显示版本号，说明安装成功
   ```

#### 方法二：使用 XAMPP（推荐新手）
1. 下载 XAMPP：https://www.apachefriends.org/
2. 安装 XAMPP
3. 打开 XAMPP Control Panel
4. 点击 MySQL 旁边的 "Start" 按钮
5. 状态变为绿色表示启动成功

### macOS 系统

```bash
# 使用 Homebrew 安装
brew install mysql

# 启动 MySQL 服务
brew services start mysql

# 验证是否运行
mysql --version
```

### Linux 系统

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install mysql-server

# 启动 MySQL 服务
sudo systemctl start mysql
sudo systemctl enable mysql  # 设置开机自启

# 验证
sudo systemctl status mysql
```

---

## 2️⃣ 创建数据库

### 步骤 1：登录 MySQL

打开命令行/终端，执行：

```bash
# Windows（如果设置了密码）
mysql -u root -p

# macOS/Linux
mysql -u root -p
```

输入 MySQL root 密码（如果设置了的话，没有设置直接按回车）

### 步骤 2：创建数据库

**Windows PowerShell 用户**（推荐）：

```powershell
# 方法1：使用 Get-Content（推荐）
Get-Content backend/database/QUICK_START.sql | mysql -u root -p

# 方法2：使用批处理文件（最简单）
# 双击运行 backend/database/创建数据库.bat

# 方法3：使用 cmd
cmd /c "mysql -u root -p < backend\database\QUICK_START.sql"
```

**Windows CMD 或 Linux/macOS 用户**：

```bash
# 在项目根目录执行（一键创建）
mysql -u root -p < backend/database/QUICK_START.sql
```

输入 MySQL 密码后，数据库和所有表会自动创建完成！

**如果遇到问题，请查看 `backend/database/创建数据库_手动方法.md`**

**其他方法**：

```bash
# 方法1：只创建数据库结构
mysql -u root -p < backend/database/create_database.sql

# 方法2：创建数据库并导入示例数据
mysql -u root -p < backend/database/create_database.sql
mysql -u root -p < backend/database/init_with_sample_data.sql
```

**详细说明请查看 `backend/database/README_数据库创建.md`**

### 步骤 3：验证数据库创建成功

```sql
-- 在 MySQL 命令行中执行
SHOW DATABASES;  -- 应该能看到 gradbot 数据库
USE gradbot;
SHOW TABLES;     -- 应该能看到 8 个表
```

---

## 3️⃣ 配置后端环境变量

### 步骤 1：创建 .env 文件

在 `backend` 目录下创建 `.env` 文件：

**Windows:**
```powershell
cd backend
# 如果 .env.example 存在，可以复制它
copy .env.example .env
# 或者直接创建新文件
notepad .env
```

**macOS/Linux:**
```bash
cd backend
cp .env.example .env
# 或者
nano .env
```

### 步骤 2：编辑 .env 文件内容

打开 `.env` 文件，填入以下内容：

```env
# 服务器端口
PORT=3000

# MySQL 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gradbot
DB_USER=root
DB_PASSWORD=你的MySQL密码

# OpenAI API 配置（可选，但不配置无法使用AI功能）
OPENAI_API_KEY=sk-你的OpenAI_API_Key

# 环境变量
NODE_ENV=development
```

### 配置说明

#### MySQL 配置
- `DB_HOST`: 数据库主机，本地使用 `localhost`
- `DB_PORT`: MySQL 端口，默认 `3306`
- `DB_NAME`: 数据库名称，使用 `gradbot`
- `DB_USER`: 数据库用户名，通常是 `root`
- `DB_PASSWORD`: **你的 MySQL root 密码**（如果没有设置密码，留空或删除这一行）

#### OpenAI API Key（可选）
1. 访问 https://platform.openai.com/api-keys
2. 登录你的 OpenAI 账号
3. 点击 "Create new secret key"
4. 复制生成的 API Key（格式：`sk-...`）
5. 粘贴到 `.env` 文件的 `OPENAI_API_KEY` 后面

**注意**：
- 如果没有 OpenAI API Key，AI 功能（选题生成、任务书生成等）将无法使用
- 其他功能（学生管理、数据查看等）仍然可以正常使用

---

## 4️⃣ 安装项目依赖

### 安装后端依赖

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 如果 npm install 很慢，可以使用国内镜像
npm install --registry=https://registry.npmmirror.com
```

### 安装前端依赖

```bash
# 进入前端目录（新开一个终端窗口）
cd frontend

# 安装依赖
npm install

# 或使用国内镜像
npm install --registry=https://registry.npmmirror.com
```

---

## 5️⃣ 启动后端服务

### 在 backend 目录执行：

```bash
cd backend
npm run dev
```

### 成功标志

看到以下输出表示启动成功：
```
MySQL 数据库连接成功
服务器运行在端口 3000
```

### 如果看到错误

**错误：`MySQL 数据库连接失败`**
- 检查 MySQL 服务是否启动
- 检查 `.env` 文件中的数据库配置是否正确
- 检查数据库密码是否正确

**错误：`Cannot find module`**
- 运行 `npm install` 安装依赖

---

## 6️⃣ 启动前端服务

### 新开一个终端窗口，在 frontend 目录执行：

```bash
cd frontend
npm run dev
```

### 成功标志

看到以下输出表示启动成功：
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 如果看到错误

**错误：端口被占用**
- 修改 `frontend/vite.config.ts` 中的端口号
- 或关闭占用 5173 端口的程序

---

## 7️⃣ 访问系统

### 打开浏览器

访问：**http://localhost:5173**

### 应该看到

- 左侧菜单栏（学生信息管理、选题指导等）
- 顶部标题栏（毕业设计辅助助手）
- 主内容区域

---

## 🔧 常见问题解决

### 问题 1：MySQL 连接失败

**症状**：后端启动时显示 "MySQL 数据库连接失败"

**解决方法**：
1. 检查 MySQL 服务是否运行：
   ```bash
   # Windows
   net start MySQL80
   
   # macOS
   brew services start mysql
   
   # Linux
   sudo systemctl start mysql
   ```

2. 测试 MySQL 连接：
   ```bash
   mysql -u root -p
   # 如果能登录，说明 MySQL 正常
   ```

3. 检查 `.env` 文件配置：
   - `DB_PASSWORD` 是否正确
   - `DB_USER` 是否为 `root`
   - `DB_NAME` 是否为 `gradbot`

### 问题 2：数据库不存在

**症状**：提示 "Unknown database 'gradbot'"

**解决方法**：
```bash
# 执行数据库初始化脚本
mysql -u root -p < backend/database/schema.sql
```

### 问题 3：端口被占用

**症状**：`Error: listen EADDRINUSE: address already in use :::3000`

**解决方法**：
1. 找到占用端口的进程并关闭
2. 或修改 `.env` 文件中的 `PORT` 为其他端口（如 3001）

### 问题 4：前端无法连接后端

**症状**：前端页面显示网络错误或 404

**解决方法**：
1. 确认后端服务已启动（看到 "服务器运行在端口 3000"）
2. 检查 `frontend/vite.config.ts` 中的代理配置：
   ```typescript
   proxy: {
     '/api': {
       target: 'http://localhost:3000',
       changeOrigin: true,
     },
   }
   ```
3. 确认后端端口与配置一致

### 问题 5：AI 功能报错

**症状**：选题生成、任务书生成等功能报错

**解决方法**：
1. 检查 `.env` 文件中是否配置了 `OPENAI_API_KEY`
2. 确认 API Key 有效（访问 OpenAI 平台检查）
3. 确认 API Key 有足够的额度

---

## ✅ 验证配置是否成功

### 测试步骤

1. **测试数据库连接**：
   ```bash
   # 在 MySQL 命令行中
   USE gradbot;
   SELECT COUNT(*) FROM students;  # 应该返回 0（如果还没有数据）
   ```

2. **测试后端 API**：
   ```bash
   # 在浏览器或使用 curl
   curl http://localhost:3000/api/health
   # 应该返回：{"status":"ok","message":"服务运行正常"}
   ```

3. **测试前端页面**：
   - 打开 http://localhost:5173
   - 点击左侧菜单，应该能正常跳转
   - 尝试添加一个学生，应该能成功

---

## 📝 快速检查清单

启动项目前，确认以下事项：

- [ ] MySQL 服务已启动
- [ ] 数据库 `gradbot` 已创建
- [ ] `backend/.env` 文件已配置
- [ ] 后端依赖已安装（`backend/node_modules` 存在）
- [ ] 前端依赖已安装（`frontend/node_modules` 存在）
- [ ] 后端服务已启动（终端显示 "服务器运行在端口 3000"）
- [ ] 前端服务已启动（终端显示 "Local: http://localhost:5173"）
- [ ] 浏览器能访问 http://localhost:5173

---

## 🎯 下一步

配置完成后，请参考 `USAGE_GUIDE.md` 了解如何使用系统的各项功能。

祝使用愉快！🎓

