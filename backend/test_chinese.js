import sequelize from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function testChineseData() {
  try {
    // 创建一个新用户，使用已知密码
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    await sequelize.query(
      `INSERT INTO users (name, email, password, role, teacherId, department, phone, isActive, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      {
        replacements: ['测试教授', 'test@example.com', hashedPassword, 'teacher', 'T999', '测试学院', '13800138999', true]
      }
    );
    
    console.log('测试用户创建成功！');
    
    // 验证数据
    const users = await sequelize.query('SELECT id, name, email, department FROM users WHERE email = ?', {
      replacements: ['test@example.com'],
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('数据库中的数据:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, 姓名: ${user.name}, 邮箱: ${user.email}, 院系: ${user.department}`);
    });
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await sequelize.close();
  }
}

testChineseData();