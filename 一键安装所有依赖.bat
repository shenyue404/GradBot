@echo off
chcp 65001 >nul
echo ========================================
echo 毕业设计辅助助手 - 一键安装所有依赖
echo ========================================
echo.

REM 检查是否在项目根目录
if not exist "backend\package.json" (
    echo [错误] 请在项目根目录运行此脚本
    echo.
    echo 当前目录：%CD%
    pause
    exit /b 1
)

echo 步骤 1/2：安装后端依赖...
echo.
cd backend
if not exist "node_modules" (
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 后端依赖安装失败
        pause
        exit /b 1
    )
    echo [完成] 后端依赖安装成功
) else (
    echo [跳过] 后端依赖已安装
)

echo.
echo 步骤 2/2：安装前端依赖...
echo.
cd ..\frontend
if not exist "node_modules" (
    echo 正在清理缓存...
    call npm cache clean --force >nul 2>&1
    echo 正在安装依赖（使用国内镜像）...
    call npm install --registry=https://registry.npmmirror.com --legacy-peer-deps
    if %errorlevel% neq 0 (
        echo.
        echo [错误] 前端依赖安装失败
        echo.
        echo 请尝试：
        echo 1. 运行 frontend\修复安装问题.bat
        echo 2. 运行 frontend\使用镜像安装.bat
        echo 3. 查看 frontend\README_安装问题解决.md
        echo.
        pause
        exit /b 1
    )
    echo [完成] 前端依赖安装成功
) else (
    echo [跳过] 前端依赖已安装
)

cd ..

echo.
echo ========================================
echo 所有依赖安装完成！
echo ========================================
echo.
echo 下一步：
echo 1. 创建数据库：运行 backend\database\快速创建数据库.bat
echo 2. 配置环境变量：运行 backend\创建.env文件.bat
echo 3. 启动后端：cd backend ^&^& npm run dev
echo 4. 启动前端：cd frontend ^&^& npm run dev
echo.
pause

