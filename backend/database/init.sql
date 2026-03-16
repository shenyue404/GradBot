-- 初始化数据（可选）
-- 插入示例数据用于测试

USE gradbot;

-- 插入示例教师
INSERT INTO teachers (teacher_id, name, department, title, phone, email) VALUES
('T001', '张教授', '计算机科学学院', '教授', '13800138001', 'zhang@example.com'),
('T002', '李老师', '计算机科学学院', '副教授', '13800138002', 'li@example.com')
ON DUPLICATE KEY UPDATE name=name;

-- 插入示例学生
INSERT INTO students (student_id, name, major, class, phone, email) VALUES
('S001', '王同学', '计算机科学与技术', '计科2021-1', '13900139001', 'wang@example.com'),
('S002', '刘同学', '软件工程', '软工2021-1', '13900139002', 'liu@example.com')
ON DUPLICATE KEY UPDATE name=name;

-- 插入示例指导关系
INSERT INTO advisories (teacher_id, student_id, start_date, status) VALUES
(1, 1, CURDATE(), 'active'),
(1, 2, CURDATE(), 'active')
ON DUPLICATE KEY UPDATE status=status;


