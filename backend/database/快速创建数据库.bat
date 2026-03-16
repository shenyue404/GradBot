@echo off
chcp 65001 >nul
echo ========================================
echo 毕业设计辅助助手 - 快速创建数据库
echo ========================================
echo.

REM 使用你的 MySQL 路径
set "MYSQL_CMD=D:\MySQL\MySQL Server 9.3\bin\mysql.exe"

REM 检查 MySQL 是否存在
if not exist "%MYSQL_CMD%" (
    echo [错误] 找不到 MySQL：%MYSQL_CMD%
    echo.
    echo 请检查 MySQL 是否安装在此路径
    pause
    exit /b 1
)

echo 使用 MySQL 路径：%MYSQL_CMD%
echo.

REM 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
set "SQL_FILE=%SCRIPT_DIR%QUICK_START.sql"

REM 检查 SQL 文件是否存在
if not exist "%SQL_FILE%" (
    echo [错误] 找不到 SQL 文件：%SQL_FILE%
    pause
    exit /b 1
)

echo ========================================
echo 请输入 MySQL root 密码
echo （如果没有设置密码，直接按回车）
echo ========================================
echo.

REM 执行 SQL 文件
type "%SQL_FILE%" | "%MYSQL_CMD%" -u root -p

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo 数据库创建成功！
    echo ========================================
    echo.
    echo 正在验证数据库...
    "%MYSQL_CMD%" -u root -p -e "USE gradbot; SHOW TABLES;"
    echo.
    echo ========================================
    echo 数据库初始化完成！
    echo ========================================
    echo.
    echo 下一步：
    echo 1. 配置 backend/.env 文件
    echo 2. 启动后端服务：cd backend ^&^& npm run dev
    echo 3. 启动前端服务：cd frontend ^&^& npm run dev
    echo.
) else (
    echo.
    echo ========================================
    echo 数据库创建失败！
    echo ========================================
    echo.
    echo 请检查：
    echo 1. MySQL 服务是否启动
    echo 2. 密码是否正确
    echo 3. 是否有创建数据库的权限
    echo.
)

pause


