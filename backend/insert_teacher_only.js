import sequelize from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function insertTeacherData() {
  try {
    console.log('开始插入教师数据...');
    
    const teachers = [
      {
        name: '张伟教授',
        email: 'zhangwei_teacher@example.com',
        password: await bcrypt.hash('123456', 10),
        role: 'teacher',
        teacherId: 'T011',
        department: '计算机科学与技术学院',
        phone: '13800138011',
        isActive: true
      },
      {
        name: '李明副教授',
        email: 'liming_teacher@example.com',
        password: await bcrypt.hash('123456', 10),
        role: 'teacher',
        teacherId: 'T012',
        department: '软件工程学院',
        phone: '13800138012',
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
      console.log(`已插入教师: ${teacher.name}`);
    }

    // 验证插入的数据
    console.log('\n验证插入的教师数据:');
    const teachersData = await sequelize.query('SELECT id, name, email, teacherId, department FROM users WHERE role = "teacher" ORDER BY id DESC LIMIT 5', {
      type: sequelize.QueryTypes.SELECT
    });

    teachersData.forEach(teacher => {
      console.log(`ID: ${teacher.id}, 姓名: ${teacher.name}, 邮箱: ${teacher.email}, 工号: ${teacher.teacherId}, 院系: ${teacher.department}`);
    });

    console.log('\n教师数据插入完成！');

  } catch (error) {
    console.error('插入数据时出错:', error);
  } finally {
    await sequelize.close();
  }
}

insertTeacherData();