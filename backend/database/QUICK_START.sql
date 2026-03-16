-- ============================================
-- 快速创建数据库 - 一键执行脚本
-- ============================================
-- 使用方法：
--   方法1：mysql -u root -p < QUICK_START.sql
--   方法2：在MySQL命令行中执行：source /path/to/QUICK_START.sql
-- ============================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS gradbot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gradbot;

-- ============================================
-- 创建所有表
-- ============================================

-- 1. 教师表
CREATE TABLE IF NOT EXISTS teachers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id VARCHAR(50) UNIQUE NOT NULL COMMENT '教师工号',
    name VARCHAR(100) NOT NULL COMMENT '姓名',
    department VARCHAR(100) COMMENT '院系',
    title VARCHAR(50) COMMENT '职称',
    phone VARCHAR(20) COMMENT '电话',
    email VARCHAR(100) COMMENT '邮箱',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_teacher_id (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教师表';

-- 2. 学生表
CREATE TABLE IF NOT EXISTS students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(50) UNIQUE NOT NULL COMMENT '学号',
    name VARCHAR(100) NOT NULL COMMENT '姓名',
    major VARCHAR(100) NOT NULL COMMENT '专业',
    class VARCHAR(50) COMMENT '班级',
    phone VARCHAR(20) COMMENT '电话',
    email VARCHAR(100) COMMENT '邮箱',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_major (major)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生表';

-- 3. 指导关系表
CREATE TABLE IF NOT EXISTS advisories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL COMMENT '教师ID',
    student_id INT NOT NULL COMMENT '学生ID',
    start_date DATE COMMENT '开始日期',
    end_date DATE COMMENT '结束日期',
    status VARCHAR(20) DEFAULT 'active' COMMENT '状态: active, completed, terminated',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY uk_teacher_student (teacher_id, student_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='指导关系表';

-- 4. 选题表
CREATE TABLE IF NOT EXISTS topics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL COMMENT '学生ID',
    title VARCHAR(500) NOT NULL COMMENT '选题标题',
    direction VARCHAR(200) COMMENT '研究方向',
    keywords TEXT COMMENT '关键词（JSON数组）',
    description TEXT COMMENT '选题描述',
    status VARCHAR(20) DEFAULT 'draft' COMMENT '状态: draft, confirmed, completed',
    generated_options TEXT COMMENT '生成的选题选项（JSON数组）',
    confirmed_at TIMESTAMP NULL COMMENT '确认时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_title (title(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='选题表';

-- 5. 评审表
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    topic_id INT NOT NULL COMMENT '选题ID',
    reviewer_id INT NOT NULL COMMENT '评审教师ID',
    content TEXT COMMENT '评审内容',
    ai_assistant TEXT COMMENT 'AI辅助意见',
    score DECIMAL(5,2) COMMENT '评分',
    status VARCHAR(20) DEFAULT 'draft' COMMENT '状态: draft, submitted, approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES teachers(id) ON DELETE CASCADE,
    INDEX idx_topic_id (topic_id),
    INDEX idx_reviewer_id (reviewer_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评审表';

-- 6. 任务书表
CREATE TABLE IF NOT EXISTS taskbooks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    topic_id INT NOT NULL COMMENT '选题ID',
    content TEXT COMMENT '任务书内容',
    requirements TEXT COMMENT '研究要求',
    schedule TEXT COMMENT '进度安排（JSON数组）',
    draft_content TEXT COMMENT '草稿内容',
    status VARCHAR(20) DEFAULT 'draft' COMMENT '状态: draft, reviewing, approved',
    confirmed_at TIMESTAMP NULL COMMENT '确认时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    INDEX idx_topic_id (topic_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务书表';

-- 7. 中期报告表
CREATE TABLE IF NOT EXISTS midterm_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    topic_id INT NOT NULL COMMENT '选题ID',
    progress TEXT COMMENT '进展情况',
    problems TEXT COMMENT '存在的问题',
    solutions TEXT COMMENT '解决方案',
    achievements TEXT COMMENT '取得的成果',
    key_comments TEXT COMMENT '关键点评',
    ai_analysis TEXT COMMENT 'AI分析结果',
    status VARCHAR(20) DEFAULT 'draft' COMMENT '状态: draft, submitted, reviewed',
    feedback TEXT COMMENT '反馈意见',
    submitted_at TIMESTAMP NULL COMMENT '提交时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    INDEX idx_topic_id (topic_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='中期报告表';

-- 8. 开题报告表
CREATE TABLE IF NOT EXISTS proposals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    topic_id INT NOT NULL COMMENT '选题ID',
    content TEXT COMMENT '报告内容',
    research_background TEXT COMMENT '研究背景',
    research_objectives TEXT COMMENT '研究目标',
    methodology TEXT COMMENT '研究方法',
    expected_results TEXT COMMENT '预期成果',
    ai_analysis TEXT COMMENT 'AI分析结果',
    status VARCHAR(20) DEFAULT 'draft' COMMENT '状态: draft, submitted, reviewing, approved',
    feedback TEXT COMMENT '反馈意见',
    submitted_at TIMESTAMP NULL COMMENT '提交时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    INDEX idx_topic_id (topic_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='开题报告表';

-- ============================================
-- 显示创建结果
-- ============================================
SELECT '========================================' AS '';
SELECT '数据库创建成功！' AS '状态';
SELECT '========================================' AS '';
SELECT CONCAT('数据库名称: ', DATABASE()) AS '信息';
SELECT CONCAT('字符集: utf8mb4') AS '信息';
SELECT CONCAT('排序规则: utf8mb4_unicode_ci') AS '信息';
SELECT '========================================' AS '';
SELECT '已创建的表：' AS '';
SHOW TABLES;
SELECT '========================================' AS '';
SELECT '数据库初始化完成，可以开始使用了！' AS '完成';


