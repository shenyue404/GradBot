# 毕业设计辅助助手 - 数据库创建脚本（PowerShell版本）
# 使用方法：在PowerShell中执行：.\创建数据库.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "毕业设计辅助助手 - 数据库创建工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 获取脚本所在目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFile = Join-Path $scriptPath "QUICK_START.sql"

# 检查SQL文件是否存在
if (-not (Test-Path $sqlFile)) {
    Write-Host "错误：找不到 SQL 文件：$sqlFile" -ForegroundColor Red
    Read-Host "按 Enter 键退出"
    exit 1
}

# 提示输入密码
$password = Read-Host "请输入 MySQL root 密码" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

Write-Host ""
Write-Host "正在创建数据库..." -ForegroundColor Yellow

# 执行SQL文件
$env:MYSQL_PWD = $passwordPlain
Get-Content $sqlFile | mysql -u root --password=$passwordPlain

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "数据库创建成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "正在验证数据库..." -ForegroundColor Yellow
    
    # 验证数据库
    mysql -u root --password=$passwordPlain -e "USE gradbot; SHOW TABLES;"
    
    Write-Host ""
    Write-Host "数据库初始化完成！" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "数据库创建失败！" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "请检查：" -ForegroundColor Yellow
    Write-Host "1. MySQL 服务是否启动" -ForegroundColor Yellow
    Write-Host "2. 密码是否正确" -ForegroundColor Yellow
    Write-Host "3. 是否有创建数据库的权限" -ForegroundColor Yellow
}

# 清除密码
$env:MYSQL_PWD = ""
$passwordPlain = ""

Read-Host "`n按 Enter 键退出"


