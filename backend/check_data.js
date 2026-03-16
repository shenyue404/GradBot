import sequelize from './src/config/database.js';

async function checkData() {
  try {
    // 检查教师表数据
    const [teachers] = await sequelize.query("SELECT id, name, department, title FROM teachers ORDER BY id DESC LIMIT 5");
    console.log('教师表数据:');
    teachers.forEach(teacher => {
      console.log(`ID: ${teacher.id}, 姓名: ${teacher.name}, 院系: ${teacher.department}, 职称: ${teacher.title}`);
    });

    // 检查用户表数据
    const [users] = await sequelize.query("SELECT id, name, email FROM users ORDER BY id DESC LIMIT 5");
    console.log('\n用户表数据:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, 姓名: ${user.name}, 邮箱: ${user.email}`);
    });

  } catch (error) {
    console.error('检查数据时出错:', error);
  } finally {
    await sequelize.close();
  }
}

checkData();