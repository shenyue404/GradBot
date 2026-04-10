@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo ========================================
echo 创建 .env 环境变量配置文件
echo ========================================
echo.

REM 检查是否在 backend 目录
if not exist "package.json" (
    echo [错误] 请在 backend 目录下运行此脚本
    echo.
    echo 当前目录：%CD%
    pause
    exit /b 1
)

REM 检查 .env 文件是否已存在
if exist ".env" (
    echo [提示] .env 文件已存在
    set /p OVERWRITE="是否覆盖现有文件？(y/n): "
    if /i not "!OVERWRITE!"=="y" (
        echo 已取消操作
        pause
        exit /b 0
    )
)

echo.
echo 请输入以下配置信息：
echo.
echo ========================================
echo MySQL 数据库配置
echo ========================================
set /p DB_PASSWORD="MySQL root 密码（如果没有密码直接按回车）："

echo.
echo ========================================
echo OpenAI API 配置（可选）
echo ========================================
echo 如果需要使用AI功能，请输入 OpenAI API Key
echo 获取方式：访问 https://platform.openai.com/api-keys
echo 如果不需要AI功能，直接按回车跳过
echo.
set /p OPENAI_KEY="OpenAI API Key（可选，直接按回车跳过）："

echo.
echo 正在创建 .env 文件...

(
echo PORT=3000
echo.
echo # MySQL 数据库配置
echo DB_HOST=localhost
echo DB_PORT=3306
echo DB_NAME=gradbot
echo DB_USER=root
echo DB_PASSWORD=!DB_PASSWORD!
echo.
echo # OpenAI API 配置（可选，不配置AI功能无法使用）
echo # 获取方式：访问 https://platform.openai.com/api-keys
echo OPENAI_API_KEY=!OPENAI_KEY!
echo.
echo NODE_ENV=development
) > .env

echo.
echo ========================================
echo .env 文件创建成功！
echo ========================================
echo.
echo 文件位置：%CD%\.env
echo.
echo 配置内容：
echo   - MySQL 密码：已设置
if not "!OPENAI_KEY!"=="" (
    echo   - OpenAI API Key：已设置
) else (
    echo   - OpenAI API Key：未设置（AI功能将不可用）
)
echo.
echo 如果需要修改配置，请编辑 .env 文件
echo.
echo 下一步：启动后端服务
echo   cd backend
echo   npm run dev
echo.
pause

