# 数据库创建指南

## 🚀 快速创建数据库（推荐）

### 方法一：使用快速脚本（最简单）

```bash
# 在项目根目录执行
mysql -u root -p < backend/database/QUICK_START.sql
```

输入 MySQL 密码后，数据库会自动创建完成！

### 方法二：使用完整脚本

```bash
# 创建数据库和表结构
mysql -u root -p < backend/database/create_database.sql

# （可选）导入示例数据
mysql -u root -p < backend/database/init_with_sample_data.sql
```

## 📋 文件说明

| 文件名 | 说明 | 用途 |
|--------|------|------|
| `QUICK_START.sql` | **推荐使用** | 一键创建数据库和所有表 |
| `create_database.sql` | 创建数据库结构 | 只创建表，不包含示例数据 |
| `init_with_sample_data.sql` | 初始化示例数据 | 插入测试用的教师、学生等数据 |
| `schema.sql` | 原始结构文件 | 参考文件 |

## ✅ 验证数据库创建成功

执行以下命令验证：

```bash
mysql -u root -p -e "USE gradbot; SHOW TABLES;"
```

应该看到 8 个表：
- teachers
- students
- advisories
- topics
- reviews
- taskbooks
- midterm_reports
- proposals

## 🔍 检查数据库状态

```sql
-- 登录 MySQL
mysql -u root -p

-- 使用数据库
USE gradbot;

-- 查看所有表
SHOW TABLES;

-- 查看表结构（示例）
DESC students;

-- 查看数据数量
SELECT 
    'teachers' AS table_name, COUNT(*) AS count FROM teachers
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'topics', COUNT(*) FROM topics;
```

## ⚠️ 注意事项

1. **如果数据库已存在**：脚本会使用 `CREATE DATABASE IF NOT EXISTS`，不会覆盖现有数据
2. **如果表已存在**：脚本会使用 `CREATE TABLE IF NOT EXISTS`，不会删除现有表
3. **外键约束**：所有表都有外键约束，删除数据时会级联删除相关记录

## 🆘 如果遇到问题

### 问题1：权限不足
```sql
-- 如果提示权限不足，需要授予权限
GRANT ALL PRIVILEGES ON gradbot.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### 问题2：字符集问题
如果遇到字符集错误，确保 MySQL 版本 >= 5.7，并且支持 utf8mb4。

### 问题3：外键约束错误
如果外键创建失败，检查：
1. 引用的表是否已创建
2. 数据类型是否匹配
3. 引擎是否为 InnoDB

## 📝 下一步

数据库创建完成后：
1. 配置 `backend/.env` 文件中的数据库连接信息
2. 启动后端服务：`cd backend && npm run dev`
3. 查看是否显示 "MySQL 数据库连接成功"

祝使用愉快！🎓


