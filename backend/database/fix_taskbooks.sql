-- 修复任务书表结构
-- 检查并修复taskbooks表的字段约束

-- 首先删除外键约束（如果存在）
SET @foreign_key_name = (
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_NAME = 'taskbooks' AND COLUMN_NAME = 'topic_id' 
    AND TABLE_SCHEMA = DATABASE()
);

SET @sql = IF(
    @foreign_key_name IS NOT NULL,
    CONCAT('ALTER TABLE taskbooks DROP FOREIGN KEY ', @foreign_key_name),
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 修改topic_id字段为允许NULL
ALTER TABLE taskbooks 
MODIFY COLUMN topic_id INT NULL DEFAULT NULL;

-- 重新添加外键约束，允许NULL值
ALTER TABLE taskbooks 
ADD CONSTRAINT fk_taskbooks_topic_id 
FOREIGN KEY (topic_id) REFERENCES topics(id) 
ON DELETE SET NULL
ON UPDATE CASCADE;