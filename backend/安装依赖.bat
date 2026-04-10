@echo off
chcp 65001 >nul
echo ========================================
echo 安装后端项目依赖
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

echo 当前目录：%CD%
echo.
echo 正在安装依赖，请稍候...
echo.

REM 安装依赖
call npm install

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo 依赖安装成功！
    echo ========================================
    echo.
    echo 下一步：
    echo 1. 配置 .env 文件（运行 创建.env文件.bat 或手动创建）
    echo 2. 启动服务：npm run dev
    echo.
) else (
    echo.
    echo ========================================
    echo 依赖安装失败！
    echo ========================================
    echo.
    echo 请检查：
    echo 1. Node.js 是否已安装
    echo 2. npm 是否可用
    echo 3. 网络连接是否正常
    echo.
)

pause


