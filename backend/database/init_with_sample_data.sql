-- 毕业设计辅助助手数据库初始化（包含示例数据）
-- 使用方法：mysql -u root -p < init_with_sample_data.sql

-- 使用数据库
USE gradbot;

-- 清空现有数据（可选，谨慎使用）
-- TRUNCATE TABLE proposals;
-- TRUNCATE TABLE midterm_reports;
-- TRUNCATE TABLE taskbooks;
-- TRUNCATE TABLE reviews;
-- TRUNCATE TABLE topics;
-- TRUNCATE TABLE advisories;
-- TRUNCATE TABLE students;
-- TRUNCATE TABLE teachers;

-- 插入示例教师
INSERT INTO teachers (teacher_id, name, department, title, phone, email) VALUES
('T001', '张教授', '计算机科学学院', '教授', '13800138001', 'zhang@example.com'),
('T002', '李老师', '计算机科学学院', '副教授', '13800138002', 'li@example.com'),
('T003', '王老师', '软件工程学院', '讲师', '13800138003', 'wang@example.com')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 插入示例学生
INSERT INTO students (student_id, name, major, class, phone, email) VALUES
('S001', '王同学', '计算机科学与技术', '计科2021-1', '13900139001', 'wang@example.com'),
('S002', '刘同学', '软件工程', '软工2021-1', '13900139002', 'liu@example.com'),
('S003', '张同学', '计算机科学与技术', '计科2021-2', '13900139003', 'zhang@example.com'),
('S004', '李同学', '软件工程', '软工2021-2', '13900139004', 'li@example.com')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 插入示例指导关系
INSERT INTO advisories (teacher_id, student_id, start_date, status) VALUES
(1, 1, CURDATE(), 'active'),
(1, 2, CURDATE(), 'active'),
(2, 3, CURDATE(), 'active'),
(2, 4, CURDATE(), 'active')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 插入示例选题
INSERT INTO topics (student_id, title, direction, keywords, description, status) VALUES
(1, '基于深度学习的图像识别系统研究', '人工智能', '["深度学习", "图像识别", "卷积神经网络"]', '研究基于深度学习的图像识别技术，设计并实现一个图像识别系统。', 'confirmed'),
(2, '基于Spring Boot的在线教育平台设计与实现', 'Web开发', '["Spring Boot", "在线教育", "微服务"]', '设计并实现一个功能完善的在线教育平台，支持课程管理、在线学习等功能。', 'confirmed'),
(3, '基于机器学习的推荐系统研究', '机器学习', '["机器学习", "推荐系统", "协同过滤"]', '研究推荐算法，设计并实现一个个性化推荐系统。', 'draft'),
(4, '移动应用开发框架研究与实践', '移动开发', '["移动应用", "React Native", "跨平台"]', '研究跨平台移动应用开发框架，开发一个实际应用案例。', 'draft')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 显示插入结果
SELECT '示例数据插入完成！' AS message;
SELECT COUNT(*) AS teacher_count FROM teachers;
SELECT COUNT(*) AS student_count FROM students;
SELECT COUNT(*) AS topic_count FROM topics;


