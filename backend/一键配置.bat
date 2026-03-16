@echo off
chcp 65001 >nul
echo ========================================
echo 毕业设计辅助助手 - 一键配置工具
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

echo 步骤 1/2：检查依赖安装...
if not exist "node_modules" (
    echo [提示] 依赖未安装，正在安装...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo [完成] 依赖安装成功
) else (
    echo [完成] 依赖已安装
)

echo.
echo 步骤 2/2：配置环境变量...
if exist ".env" (
    echo [提示] .env 文件已存在
    set /p OVERWRITE="是否重新配置？(y/n): "
    if /i not "!OVERWRITE!"=="y" (
        echo 已跳过配置
        goto :end
    )
)

call "创建.env文件.bat"

:end
echo.
echo ========================================
echo 配置完成！
echo ========================================
echo.
echo 下一步操作：
echo 1. 检查 .env 文件中的配置是否正确
echo 2. 启动后端服务：npm run dev
echo.
pause


