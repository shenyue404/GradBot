-- 修改topics表的student_id字段，允许为null并设置默认值为null
USE gradbot;

-- 修改字段允许为null并设置默认值
ALTER TABLE topics MODIFY COLUMN student_id INT NULL DEFAULT NULL COMMENT '学生ID';

-- 如果存在外键约束，先删除再重新添加
-- 删除可能存在的外键约束（如果存在）
SET @foreign_key_name = (
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_NAME = 'topics' 
    AND COLUMN_NAME = 'student_id' 
    AND TABLE_SCHEMA = 'gradbot'
    AND REFERENCED_TABLE_NAME IS NOT NULL
);

SET @sql = IF(@foreign_key_name IS NOT NULL, 
    CONCAT('ALTER TABLE topics DROP FOREIGN KEY ', @foreign_key_name), 
    'SELECT 1');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 重新添加外键约束，允许null值
ALTER TABLE topics 
ADD CONSTRAINT fk_topics_student_id 
FOREIGN KEY (student_id) REFERENCES students(id) 
ON DELETE SET NULL;