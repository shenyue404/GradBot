import sequelize from './src/config/database.js';

async function checkAndFixCharset() {
  try {
    // 检查数据库字符集
    const [dbResult] = await sequelize.query(
      "SELECT default_character_set_name FROM information_schema.SCHEMATA WHERE schema_name = 'gradbot'"
    );
    console.log('数据库字符集:', dbResult[0]?.default_character_set_name);

    // 检查表字符集
    const [tables] = await sequelize.query(
      "SELECT table_name, table_collation FROM information_schema.TABLES WHERE table_schema = 'gradbot'"
    );
    console.log('\n表字符集:');
    tables.forEach(table => {
      console.log(`${table.TABLE_NAME}: ${table.TABLE_COLLATION}`);
    });

    // 检查当前连接字符集
    const [vars] = await sequelize.query("SHOW VARIABLES LIKE 'character_set%'");
    console.log('\n连接字符集变量:');
    vars.forEach(v => {
      console.log(`${v.Variable_name}: ${v.Value}`);
    });

    // 修改数据库字符集
    console.log('\n正在修改数据库字符集为utf8mb4...');
    await sequelize.query("ALTER DATABASE gradbot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    
    // 修改所有表的字符集
    for (const table of tables) {
      if (table.TABLE_NAME) {
        console.log(`修改表 ${table.TABLE_NAME} 字符集...`);
        await sequelize.query(`ALTER TABLE \`${table.TABLE_NAME}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      }
    }

    console.log('\n字符集修改完成！');

    // 重新检查
    const [newTables] = await sequelize.query(
      "SELECT table_name, table_collation FROM information_schema.TABLES WHERE table_schema = 'gradbot'"
    );
    console.log('\n修改后的表字符集:');
    newTables.forEach(table => {
      console.log(`${table.table_name}: ${table.table_collation}`);
    });

  } catch (error) {
    console.error('检查字符集时出错:', error);
  } finally {
    await sequelize.close();
  }
}

checkAndFixCharset();