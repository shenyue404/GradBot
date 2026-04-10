import mysql from 'mysql2/promise';

async function checkCharset() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gradbot'
  });

  try {
    // 检查数据库字符集
    const [dbResult] = await connection.execute(
      "SELECT default_character_set_name FROM information_schema.SCHEMATA WHERE schema_name = 'gradbot'"
    );
    console.log('数据库字符集:', dbResult[0]?.default_character_set_name);

    // 检查表字符集
    const [tables] = await connection.execute(
      "SELECT table_name, table_collation FROM information_schema.TABLES WHERE table_schema = 'gradbot'"
    );
    console.log('\n表字符集:');
    tables.forEach(table => {
      console.log(`${table.table_name}: ${table.table_collation}`);
    });

    // 检查列字符集
    const [columns] = await connection.execute(
      "SELECT table_name, column_name, character_set_name, collation_name " +
      "FROM information_schema.COLUMNS WHERE table_schema = 'gradbot' AND character_set_name IS NOT NULL"
    );
    console.log('\n列字符集:');
    columns.forEach(col => {
      console.log(`${col.table_name}.${col.column_name}: ${col.character_set_name} / ${col.collation_name}`);
    });

    // 检查当前连接字符集
    const [vars] = await connection.execute("SHOW VARIABLES LIKE 'character_set%'");
    console.log('\n连接字符集变量:');
    vars.forEach(v => {
      console.log(`${v.Variable_name}: ${v.Value}`);
    });

  } catch (error) {
    console.error('检查字符集时出错:', error);
  } finally {
    await connection.end();
  }
}

checkCharset();