@echo off
chcp 65001 >nul
echo ========================================
echo MySQL 路径查找工具
echo ========================================
echo.

echo 正在搜索常见的 MySQL 安装路径...
echo.

REM 常见的 MySQL 安装路径
set "PATHS[0]=D:\MySQL\MySQL Server 9.3\bin\mysql.exe"
set "PATHS[1]=C:\xampp\mysql\bin\mysql.exe"
set "PATHS[2]=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
set "PATHS[3]=C:\Program Files\MySQL\MySQL Server 8.1\bin\mysql.exe"
set "PATHS[4]=C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe"
set "PATHS[5]=C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe"
set "PATHS[6]=C:\Program Files (x86)\MySQL\MySQL Server 5.7\bin\mysql.exe"
set "PATHS[7]=D:\xampp\mysql\bin\mysql.exe"
set "PATHS[8]=D:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

set FOUND=0

for /L %%i in (0,1,7) do (
    call set "CURRENT_PATH=%%PATHS[%%i]%%"
    if exist "!CURRENT_PATH!" (
        echo [找到] !CURRENT_PATH!
        set FOUND=1
    )
)

REM 检查 PATH 环境变量中是否有 mysql
where mysql >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo [找到] MySQL 已在系统 PATH 中
    where mysql
    set FOUND=1
)

echo.

if %FOUND% equ 0 (
    echo [未找到] 未在常见路径中找到 MySQL
    echo.
    echo 请手动查找 mysql.exe：
    echo 1. 打开文件管理器
    echo 2. 搜索 "mysql.exe"
    echo 3. 找到后，复制完整路径
    echo.
    echo 或者：
    echo 1. 打开 XAMPP Control Panel
    echo 2. 查看 MySQL 的安装路径
    echo.
) else (
    echo ========================================
    echo 找到 MySQL 安装！
    echo ========================================
    echo.
    echo 如果 MySQL 不在 PATH 中，请使用完整路径执行命令：
    echo 例如：C:\xampp\mysql\bin\mysql.exe -u root -p
    echo.
)

pause

