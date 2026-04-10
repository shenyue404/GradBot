import sequelize from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function insertSampleData() {
  try {
    // 创建一些教师数据
    const teachers = [
      {
        name: '张伟教授',
        email: 'zhangwei@example.com',
        password: await bcrypt.hash('123456', 10),
        role: 'teacher',
        teacherId: 'T004',
        department: '计算机科学与技术学院',
        phone: '13800138004',
        isActive: true
      },
      {
        name: '李明副教授',
        email: 'liming@example.com',
        password: await bcrypt.hash('123456', 10),
        role: 'teacher',
        teacherId: 'T005',
        department: '软件工程学院',
        phone: '13800138005',
        isActive: true
      },
      {
        name: '王芳讲师',
        email: 'wangfang@example.com',
        password: await bcrypt.hash('123456', 10),
        role: 'teacher',
        teacherId: 'T006',
        department: '信息工程学院',
        phone: '13800138006',
        isActive: true
      }
    ];

    // 创建一些学生数据
    const students = [
      {
        name: '赵晓明',
        email: 'zhaoxiaoming@example.com',
        password: await bcrypt.hash('123456', 10),
        role: 'student',
        studentId: 'S003',
        major: '计算机科学与技术',
        class: '计科2101',
        phone: '13900139003',
        isActive: true
      },
      {
        name: '钱小红',
        email: 'qianxiaohong@example.com',
        password: await bcrypt.hash('123456', 10),
        role: 'student',
        studentId: 'S004',
        major: '软件工程',
        class: '软工2101',
        phone: '13900139004',
        isActive: true
      },
      {
        name: '孙大伟',
        email: 'sundawei@example.com',
        password: await bcrypt.hash('123456', 10),
        role: 'student',
        studentId: 'S005',
        major: '信息安全',
        class: '信安2101',
        phone: '13900139005',
        isActive: true
      }
    ];

    console.log('开始插入教师数据...');
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

    console.log('\n开始插入学生数据...');
    for (const student of students) {
      await sequelize.query(
        `INSERT INTO users (name, email, password, role, studentId, major, class, phone, isActive, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [student.name, student.email, student.password, student.role, student.studentId, student.major, student.class, student.phone, student.isActive]
        }
      );
      console.log(`已插入学生: ${student.name}`);
    }

    // 验证插入的数据
    console.log('\n验证插入的数据:');
    const allUsers = await sequelize.query('SELECT id, name, email, role, teacherId, studentId, department, major FROM users ORDER BY id DESC LIMIT 10', {
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

insertSampleData();