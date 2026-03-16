import express from 'express'
import sequelize from '../config/database.js'

const router = express.Router()

router.post('/execute', async (req, res) => {
  try {
    const { query } = req.body

    if (!query) {
      return res.status(400).json({ success: false, error: '请提供 SQL 查询。' })
    }

    const trimmedQuery = query.trim().toLowerCase()
    if (
      !trimmedQuery.startsWith('select') &&
      !trimmedQuery.startsWith('show') &&
      !trimmedQuery.startsWith('insert') &&
      !trimmedQuery.startsWith('update') &&
      !trimmedQuery.startsWith('delete')
    ) {
      return res.status(400).json({ success: false, error: '只允许执行 SELECT、SHOW、INSERT、UPDATE 或 DELETE 查询。' })
    }

    const [results] = await sequelize.query(query)
    res.json({ success: true, data: results })
  } catch (error) {
    console.error('SQL execute failed:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/fix-database', async (req, res) => {
  try {
    await sequelize.query(`
      ALTER TABLE topics MODIFY COLUMN student_id INT NULL DEFAULT NULL COMMENT 'student id';
    `)

    try {
      await sequelize.query(`
        ALTER TABLE topics DROP FOREIGN KEY fk_topics_student_id;
      `)
    } catch {
      console.log('Foreign key may not exist, continue.')
    }

    await sequelize.query(`
      ALTER TABLE topics
      ADD CONSTRAINT fk_topics_student_id
      FOREIGN KEY (student_id) REFERENCES students(id)
      ON DELETE SET NULL;
    `)

    res.json({ success: true, message: '数据库表结构修复成功。' })
  } catch (error) {
    console.error('database fix failed:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
