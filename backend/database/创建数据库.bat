@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo ========================================
echo 毕业设计辅助助手 - 数据库创建工具
echo ========================================
echo.

REM 检测 MySQL 是否在 PATH 中
where mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] 未找到 mysql 命令！
    echo.
    echo 正在自动搜索 MySQL 安装路径...
    echo.
    
    REM 常见的 MySQL 安装路径
    set "MYSQL_CMD="
    
    if exist "D:\MySQL\MySQL Server 9.3\bin\mysql.exe" (
        set "MYSQL_CMD=D:\MySQL\MySQL Server 9.3\bin\mysql.exe"
        echo [找到] 使用 MySQL Server 9.3
    ) else if exist "C:\xampp\mysql\bin\mysql.exe" (
        set "MYSQL_CMD=C:\xampp\mysql\bin\mysql.exe"
        echo [找到] 使用 XAMPP 的 MySQL
    ) else if exist "D:\xampp\mysql\bin\mysql.exe" (
        set "MYSQL_CMD=D:\xampp\mysql\bin\mysql.exe"
        echo [找到] 使用 XAMPP 的 MySQL
    ) else if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
        set "MYSQL_CMD=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
        echo [找到] 使用 MySQL Server 8.0
    ) else if exist "C:\Program Files\MySQL\MySQL Server 8.1\bin\mysql.exe" (
        set "MYSQL_CMD=C:\Program Files\MySQL\MySQL Server 8.1\bin\mysql.exe"
        echo [找到] 使用 MySQL Server 8.1
    ) else if exist "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe" (
        set "MYSQL_CMD=C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe"
        echo [找到] 使用 MySQL Server 5.7
    )
    
    if "!MYSQL_CMD!"=="" (
        echo [未找到] 未在常见路径中找到 MySQL
        echo.
        echo 请手动输入 MySQL 的完整路径：
        echo 例如：C:\xampp\mysql\bin\mysql.exe
        echo.
        set /p MYSQL_PATH="请输入 mysql.exe 的完整路径："
        
        if not exist "!MYSQL_PATH!" (
            echo.
            echo [错误] 路径不存在：!MYSQL_PATH!
            echo.
            echo 请尝试：
            echo 1. 运行 查找MySQL路径.bat 查找 MySQL 位置
            echo 2. 检查 MySQL 是否已安装
            echo 3. 将 MySQL 的 bin 目录添加到系统 PATH
            echo.
            pause
            exit /b 1
        )
        
        set "MYSQL_CMD=!MYSQL_PATH!"
    )
) else (
    set "MYSQL_CMD=mysql"
    echo [找到] MySQL 已在系统 PATH 中
)

echo.
echo 正在使用：%MYSQL_CMD%
echo.
echo ========================================
echo 请输入 MySQL root 密码
echo （如果没有设置密码，直接按回车）
echo ========================================
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

REM 执行 SQL 文件
type "%SQL_FILE%" | %MYSQL_CMD% -u root -p

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo 数据库创建成功！
    echo ========================================
    echo.
    echo 正在验证数据库...
    %MYSQL_CMD% -u root -p -e "USE gradbot; SHOW TABLES;"
    echo.
    echo ========================================
    echo 数据库初始化完成！
    echo ========================================
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
    echo 4. MySQL 路径是否正确
    echo.
)

pause
