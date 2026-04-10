import sequelize from './src/config/database.js';

async function insertCorrectData() {
  try {
    console.log('清空现有数据...');
    
    // 按照外键依赖顺序删除数据
    await sequelize.query("DELETE FROM advisories");
    await sequelize.query("DELETE FROM reviews");
    await sequelize.query("DELETE FROM taskbooks");
    await sequelize.query("DELETE FROM midterm_reports");
    await sequelize.query("DELETE FROM proposals");
    await sequelize.query("DELETE FROM topics");
    await sequelize.query("DELETE FROM students");
    await sequelize.query("DELETE FROM teachers");
    await sequelize.query("DELETE FROM users");

    console.log('插入正确的中文数据...');

    // 插入教师数据
    const teachers = [
    {
      name: '李艺',
      email: 'liyi@example.com',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'teacher',
      teacherId: 'T001',
      department: '信息学院',
      phone: '13800138001',
      isActive: true
    },
    {
      name: '李彤',
      email: 'litong@example.com',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'teacher',
      teacherId: 'T002',
      department: '计算机学院',
      phone: '13800138002',
      isActive: true
    },
    {
      name: '张教授',
      email: 'zhang@example.com',
      password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'teacher',
      teacherId: 'T003',
      department: '软件学院',
      phone: '13800138003',
      isActive: true
    }
  ];

    for (const teacher of teachers) {
      await sequelize.query(
        `INSERT INTO users (name, email, password, role, teacherId, department, phone, isActive, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [teacher.name, teacher.email, teacher.password, teacher.role, teacher.teacherId, teacher.department, teacher.phone, teacher.isActive]
        }
      );
    }

    // 插入学生数据
    const students = [
      {
        name: '王晓明',
        email: 'wang@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        role: 'student',
        studentId: 'S001',
        major: '计算机科学与技术',
        class: '计科2001',
        phone: '13900139001',
        isActive: true
      },
      {
        name: '李小红',
        email: 'li@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        role: 'student',
        studentId: 'S002',
        major: '软件工程',
        class: '软工2001',
        phone: '13900139002',
        isActive: true
      }
    ];

    for (const student of students) {
      await sequelize.query(
        `INSERT INTO users (name, email, password, role, studentId, major, class, phone, isActive, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [student.name, student.email, student.password, student.role, student.studentId, student.major, student.class, student.phone, student.isActive]
        }
      );
    }

    console.log('中文数据插入完成！');

    // 验证数据
    const [result] = await sequelize.query("SELECT id, name, email, department FROM users ORDER BY id");
    console.log('\n验证插入的数据:');
    result.forEach(user => {
      console.log(`ID: ${user.id}, 姓名: ${user.name}, 邮箱: ${user.email}, 院系: ${user.department || 'N/A'}`);
    });

  } catch (error) {
    console.error('插入数据时出错:', error);
  } finally {
    await sequelize.close();
  }
}

insertCorrectData();