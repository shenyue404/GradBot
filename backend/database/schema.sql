-- 毕业设计辅助助手数据库结构
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS gradbot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gradbot;

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

-- 9. 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '用户姓名',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱地址',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
    role ENUM('student', 'teacher', 'admin') NOT NULL COMMENT '用户角色',
    student_id VARCHAR(50) UNIQUE COMMENT '学号（学生用户）',
    teacher_id VARCHAR(50) UNIQUE COMMENT '工号（教师用户）',
    department VARCHAR(100) COMMENT '院系',
    major VARCHAR(100) COMMENT '专业（学生用户）',
    class VARCHAR(50) COMMENT '班级（学生用户）',
    phone VARCHAR(20) COMMENT '联系电话',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 添加 users 表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_teacher_id ON users(teacher_id);


