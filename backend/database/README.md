# 数据库初始化说明

## 数据库结构

本项目使用 MySQL 数据库，数据库结构基于 ERD 图设计。

## 初始化步骤

### 1. 创建数据库

```bash
# 登录 MySQL
mysql -u root -p

# 执行 SQL 脚本创建数据库和表
source backend/database/schema.sql
```

或者直接执行：

```bash
mysql -u root -p < backend/database/schema.sql
```

### 2. 初始化示例数据（可选）

```bash
mysql -u root -p gradbot < backend/database/init.sql
```

### 3. 配置环境变量

在 `backend/.env` 文件中配置数据库连接信息：

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gradbot
DB_USER=root
DB_PASSWORD=your_password_here
```

## 数据库表结构

### 核心表

1. **teachers** - 教师表
2. **students** - 学生表
3. **advisories** - 指导关系表（教师-学生多对多关系）
4. **topics** - 选题表
5. **reviews** - 评审表
6. **taskbooks** - 任务书表
7. **midterm_reports** - 中期报告表
8. **proposals** - 开题报告表

### 关系说明

- 一个教师可以指导多个学生（通过 advisories 表）
- 一个学生可以被多个教师指导（通过 advisories 表）
- 一个学生可以有多个选题（topics）
- 一个选题可以有多个评审（reviews）
- 一个选题对应一个任务书（taskbooks）
- 一个选题可以有多个中期报告（midterm_reports）
- 一个选题可以有多个开题报告（proposals）

## 使用 Sequelize ORM

项目使用 Sequelize 作为 ORM，模型定义在 `backend/src/models/` 目录下。

### 同步数据库（开发环境）

```javascript
import { syncDatabase } from './models/index.js';

// 强制同步（会删除现有表，谨慎使用）
await syncDatabase(true);

// 普通同步（只创建不存在的表）
await syncDatabase(false);
```

## 注意事项

1. 确保 MySQL 版本 >= 5.7 或使用 MySQL 8.0+
2. 字符集使用 utf8mb4 以支持 emoji 和特殊字符
3. 外键约束已启用，删除操作会级联删除相关记录
4. 所有表都有 created_at 和 updated_at 时间戳字段


