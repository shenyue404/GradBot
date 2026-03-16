import sequelize from './src/config/database.js';

async function viewChineseData() {
  try {
    console.log('=== 中文用户数据概览 ===\n');
    
    // 查看所有教师数据
    console.log('【教师数据】');
    const teachers = await sequelize.query(
      'SELECT id, name, email, teacherId, department, phone FROM users WHERE role = "teacher" ORDER BY id DESC', 
      { type: sequelize.QueryTypes.SELECT }
    );
    
    teachers.forEach(teacher => {
      console.log(`ID: ${teacher.id} | 姓名: ${teacher.name} | 邮箱: ${teacher.email}`);
      console.log(`    工号: ${teacher.teacherId} | 院系: ${teacher.department} | 电话: ${teacher.phone}`);
      console.log('');
    });

    // 查看所有学生数据
    console.log('【学生数据】');
    const students = await sequelize.query(
      'SELECT id, name, email, studentId, major, class, phone FROM users WHERE role = "student" ORDER BY id DESC', 
      { type: sequelize.QueryTypes.SELECT }
    );
    
    students.forEach(student => {
      console.log(`ID: ${student.id} | 姓名: ${student.name} | 邮箱: ${student.email}`);
      console.log(`    学号: ${student.studentId} | 专业: ${student.major} | 班级: ${student.class} | 电话: ${student.phone}`);
      console.log('');
    });

    console.log(`总计：${teachers.length} 名教师，${students.length} 名学生`);

  } catch (error) {
    console.error('查询数据时出错:', error);
  } finally {
    await sequelize.close();
  }
}

viewChineseData();