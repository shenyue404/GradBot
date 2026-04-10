import sequelize from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function insertStudentData() {
  try {
    console.log('开始插入学生数据...');
    
    const students = [
      {
        name: '赵晓明',
        email: 'zhaoxiaoming_student@example.com',
        password: await bcrypt.hash('123456', 10),
        role: 'student',
        studentId: 'S011',
        major: '计算机科学与技术',
        class: '计科2101',
        phone: '13900139011',
        isActive: true
      },
      {
        name: '钱小红',
        email: 'qianxiaohong_student@example.com',
        password: await bcrypt.hash('123456', 10),
        role: 'student',
        studentId: 'S012',
        major: '软件工程',
        class: '软工2102',
        phone: '13900139012',
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
      console.log(`已插入学生: ${student.name}`);
    }

    // 验证插入的数据
    console.log('\n验证插入的学生数据:');
    const studentsData = await sequelize.query('SELECT id, name, email, studentId, major, class FROM users WHERE role = "student" ORDER BY id DESC LIMIT 5', {
      type: sequelize.QueryTypes.SELECT
    });

    studentsData.forEach(student => {
      console.log(`ID: ${student.id}, 姓名: ${student.name}, 邮箱: ${student.email}, 学号: ${student.studentId}, 专业: ${student.major}, 班级: ${student.class}`);
    });

    console.log('\n学生数据插入完成！');

  } catch (error) {
    console.error('插入数据时出错:', error);
  } finally {
    await sequelize.close();
  }
}

insertStudentData();