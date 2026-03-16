import sequelize from './src/config/database.js';

async function checkTableStructure() {
  try {
    const [columns] = await sequelize.query('DESCRIBE users');
    console.log('users表结构:');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type}`);
    });
  } catch (error) {
    console.error('检查表结构时出错:', error);
  } finally {
    await sequelize.close();
  }
}

checkTableStructure();