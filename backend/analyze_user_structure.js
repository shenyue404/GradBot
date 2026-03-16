import { User, Student, Teacher } from './src/models/index.js';
import { Op } from 'sequelize';

async function analyzeUserStructure() {
  try {
    console.log('=== 分析用户数据结构 ===\n');
    
    // 1. 统计各角色用户数量
    const roleStats = await User.findAll({
      attributes: ['role', [User.sequelize.fn('COUNT', '*'), 'count']],
      group: ['role']
    });
    
    console.log('用户角色分布:');
    roleStats.forEach(stat => {
      console.log(`${stat.role}: ${stat.dataValues.count} 人`);
    });

    // 2. 获取所有学生用户
    const studentUsers = await User.findAll({
      where: { role: 'student' }
    });
    
    console.log(`\n学生用户总数: ${studentUsers.length}`);
    
    // 3. 检查哪些学生用户在学生表中有对应记录
    let studentsWithRecord = 0;
    let studentsWithoutRecord = 0;
    
    for (const user of studentUsers) {
      const studentRecord = await Student.findOne({
        where: { studentId: user.studentId }
      });
      
      if (studentRecord) {
        studentsWithRecord++;
      } else {
        studentsWithoutRecord++;
        console.log(`用户表中有但学生表中无记录: ID=${user.id}, 姓名=${user.name}, 学号=${user.studentId}, 邮箱=${user.email}`);
      }
    }
    
    console.log(`\n学生用户统计:`);
    console.log(`- 在用户表和学生表都有记录: ${studentsWithRecord} 人`);
    console.log(`- 只在用户表有记录: ${studentsWithoutRecord} 人`);

    // 4. 获取所有老师用户
    const teacherUsers = await User.findAll({
      where: { role: 'teacher' }
    });
    
    console.log(`\n老师用户总数: ${teacherUsers.length}`);
    
    // 5. 检查哪些老师用户在老师表中有对应记录
    let teachersWithRecord = 0;
    let teachersWithoutRecord = 0;
    
    for (const user of teacherUsers) {
      const teacherRecord = await Teacher.findOne({
        where: { teacherId: user.teacherId }
      });
      
      if (teacherRecord) {
        teachersWithRecord++;
      } else {
        teachersWithoutRecord++;
        console.log(`用户表中有但老师表中无记录: ID=${user.id}, 姓名=${user.name}, 工号=${user.teacherId}, 邮箱=${user.email}`);
      }
    }
    
    console.log(`\n老师用户统计:`);
    console.log(`- 在用户表和老师表都有记录: ${teachersWithRecord} 人`);
    console.log(`- 只在用户表有记录: ${teachersWithoutRecord} 人`);

    // 6. 检查是否有异常角色
    const otherRoleUsers = await User.findAll({
      where: { 
        role: { [Op.notIn]: ['student', 'teacher'] }
      }
    });
    
    if (otherRoleUsers.length > 0) {
      console.log(`\n异常角色用户: ${otherRoleUsers.length} 人`);
      otherRoleUsers.forEach(user => {
        console.log(`ID=${user.id}, 姓名=${user.name}, 角色=${user.role}, 邮箱=${user.email}`);
      });
    }

    console.log('\n=== 分析完成 ===');
    
  } catch (error) {
    console.error('分析失败:', error);
  } finally {
    process.exit(0);
  }
}

analyzeUserStructure();