import sequelize from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function insertSimpleData() {
  try {
    // 插入教师数据
    console.log('开始插入教师数据...');
    const teacherPassword = await bcrypt.hash('123456', 10);
    
    await sequelize.query(
      `INSERT INTO users (name, email, password, role, teacherId, department, phone, isActive, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      {
        replacements: ['张伟教授', 'zhangwei_new@example.com', teacherPassword, 'teacher', 'T010', '计算机科学与技术学院', '13800138010', true]
      }
    );
    console.log('已插入教师: 张伟教授');

    // 插入学生数据
    console.log('\n开始插入学生数据...');
    const studentPassword = await bcrypt.hash('123456', 10);
    
    await sequelize.query(
      `INSERT INTO users (name, email, password, role, studentId, major, class, phone, isActive, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      {
        replacements: ['赵晓明', 'zhaoxiaoming_new@example.com', studentPassword, 'student', 'S010', '计算机科学与技术', '计科2101', '13900139010', true]
      }
    );
    console.log('已插入学生: 赵晓明');

    // 验证插入的数据
    console.log('\n验证插入的数据:');
    const allUsers = await sequelize.query('SELECT id, name, email, role, teacherId, studentId, department, major FROM users ORDER BY id DESC LIMIT 5', {
      type: sequelize.QueryTypes.SELECT
    });

    allUsers.forEach(user => {
      const identity = user.role === 'teacher' ? `工号: ${user.teacherId}` : `学号: ${user.studentId}`;
      const dept = user.department || user.major;
      console.log(`ID: ${user.id}, 姓名: ${user.name}, 邮箱: ${user.email}, 角色: ${user.role}, ${identity}, 院系/专业: ${dept}`);
    });

    console.log('\n数据插入完成！');

  } catch (error) {
    console.error('插入数据时出错:', error);
  } finally {
    await sequelize.close();
  }
}

insertSimpleData();