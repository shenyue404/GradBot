# 从 MongoDB 迁移到 MySQL 指南

## 变更说明

项目已从 MongoDB 迁移到 MySQL，使用 Sequelize ORM。

## 主要变更

### 1. 数据库模型

- **旧**: 使用 Mongoose (MongoDB)
- **新**: 使用 Sequelize (MySQL)

所有模型文件已更新，位于 `backend/src/models/` 目录。

### 2. 数据库配置

- **旧**: `MONGODB_URI` 环境变量
- **新**: MySQL 连接配置（`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`）

### 3. 模型导入方式

**旧方式 (Mongoose)**:
```javascript
import Student from '../models/Student.js';
const student = await Student.findById(id);
```

**新方式 (Sequelize)**:
```javascript
import { Student } from '../models/index.js';
const student = await Student.findByPk(id);
```

### 4. 查询方法变更

| MongoDB (Mongoose) | MySQL (Sequelize) |
|-------------------|-------------------|
| `findById(id)` | `findByPk(id)` |
| `findOne({ field: value })` | `findOne({ where: { field: value } })` |
| `find({ field: value })` | `findAll({ where: { field: value } })` |
| `create(data)` | `create(data)` |
| `findByIdAndUpdate(id, data)` | `update(data, { where: { id } })` |
| `findByIdAndDelete(id)` | `destroy({ where: { id } })` |
| `populate('field')` | `include: [{ model: Model, as: 'field' }]` |

### 5. 路由文件需要更新

所有路由文件（`backend/src/routes/*.js`）需要更新以使用新的 Sequelize 模型和查询方法。

## 迁移步骤

1. **安装新依赖**:
   ```bash
   cd backend
   npm install sequelize mysql2
   npm uninstall mongoose
   ```

2. **初始化数据库**:
   ```bash
   mysql -u root -p < backend/database/schema.sql
   ```

3. **更新环境变量**:
   在 `.env` 文件中配置 MySQL 连接信息。

4. **更新路由文件**:
   将所有路由文件中的 Mongoose 查询改为 Sequelize 查询。

## 注意事项

- Sequelize 使用 `findByPk` 而不是 `findById`
- 关联查询使用 `include` 而不是 `populate`
- 条件查询需要包装在 `where` 对象中
- JSON 字段（如 keywords）需要手动序列化/反序列化


