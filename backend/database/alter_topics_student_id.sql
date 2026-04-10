-- 修改topics表的student_id字段，允许为null
USE gradbot;

-- 删除原有的外键约束
ALTER TABLE topics DROP FOREIGN KEY topics_ibfk_1;

-- 修改字段允许为null
ALTER TABLE topics MODIFY COLUMN student_id INT NULL COMMENT '学生ID';

-- 重新添加外键约束，允许null值
ALTER TABLE topics 
ADD CONSTRAINT fk_topics_student_id 
FOREIGN KEY (student_id) REFERENCES students(id) 
ON DELETE SET NULL;

-- 添加索引
CREATE INDEX idx_student_id ON topics(student_id);