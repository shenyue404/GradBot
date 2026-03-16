# 环境变量配置说明

## .env 文件配置

### 方法一：使用批处理文件（推荐）⭐

双击运行 `创建.env文件.bat`，按提示输入：
- MySQL root 密码
- OpenAI API Key（可选）

### 方法二：手动创建

1. 在 `backend` 目录下创建 `.env` 文件
2. 复制 `环境变量配置.env` 文件的内容
3. 修改以下配置：

```env
PORT=3000

# MySQL 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gradbot
DB_USER=root
DB_PASSWORD=你的MySQL密码

# OpenAI API 配置（可选）
OPENAI_API_KEY=你的OpenAI_API_Key

NODE_ENV=development
```

## 必须配置的项

### DB_PASSWORD（必须）
- 填写你的 MySQL root 密码
- 如果没有设置密码，可以留空：`DB_PASSWORD=`
- 例如：`DB_PASSWORD=123456`

## 可选配置的项

### OPENAI_API_KEY（可选）
- 如果需要使用AI功能（选题生成、任务书生成等），需要配置
- 获取方式：
  1. 访问 https://platform.openai.com/api-keys
  2. 登录你的 OpenAI 账号
  3. 创建新的 API Key
  4. 复制并粘贴到配置中
- 如果不配置，AI功能将无法使用，但其他功能正常

## 配置完成后

保存 `.env` 文件，然后启动后端服务：

```bash
cd backend
npm run dev
```

如果看到 "MySQL 数据库连接成功"，说明配置正确！


