import express from 'express'
import { Topic, Student } from '../models/index.js'
import { generateTopics } from '../services/aiService.js'

const router = express.Router()

const includeStudent = {
  model: Student,
  as: 'student',
  required: false,
}

router.get('/', async (req, res) => {
  try {
    const { studentId, status, page = 1, limit = 20 } = req.query
    const where = {}

    if (studentId) {
      const student = /^\d+$/.test(String(studentId))
        ? await Student.findByPk(Number(studentId))
        : await Student.findOne({ where: { studentId } })
      where.studentId = student?.id || -1
    }

    if (status) {
      where.status = status
    }

    const offset = (Number(page) - 1) * Number(limit)
    const { count, rows } = await Topic.findAndCountAll({
      where,
      include: [includeStudent],
      limit: Number(limit),
      offset,
      order: [['updated_at', 'DESC']],
    })

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil(count / Number(limit)),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取选题列表失败。', error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const topic = await Topic.findByPk(req.params.id, { include: [includeStudent] })
    if (!topic) {
      return res.status(404).json({ success: false, message: '选题不存在。' })
    }
    res.json({ success: true, data: topic })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取选题详情失败。', error: error.message })
  }
})

router.post('/generate', async (req, res) => {
  try {
    const { direction, keywords = [] } = req.body
    if (!direction) {
      return res.status(400).json({ success: false, message: '研究方向不能为空。' })
    }
    const data = await generateTopics(direction, keywords)
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: '生成选题失败。', error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const topic = await Topic.create({
      studentId: req.body.studentId || null,
      title: req.body.title,
      description: req.body.description || '',
      direction: req.body.direction || '',
      keywords: req.body.keywords || [],
      status: req.body.status || 'draft',
      feedback: req.body.feedback || '',
    })
    res.status(201).json({ success: true, data: topic })
  } catch (error) {
    res.status(500).json({ success: false, message: '创建选题失败。', error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const topic = await Topic.findByPk(req.params.id)
    if (!topic) {
      return res.status(404).json({ success: false, message: '选题不存在。' })
    }

    await topic.update(
      Object.fromEntries(
        Object.entries({
          studentId: req.body.studentId,
          title: req.body.title,
          description: req.body.description,
          direction: req.body.direction,
          keywords: req.body.keywords,
          status: req.body.status,
          feedback: req.body.feedback,
        }).filter(([, value]) => value !== undefined),
      ),
    )

    res.json({ success: true, data: topic })
  } catch (error) {
    res.status(500).json({ success: false, message: '更新选题失败。', error: error.message })
  }
})

router.post('/:id/confirm', async (req, res) => {
  try {
    const topic = await Topic.findByPk(req.params.id)
    if (!topic) {
      return res.status(404).json({ success: false, message: '选题不存在。' })
    }

    await topic.update({
      studentId: req.body.studentId ?? topic.studentId,
      status: 'confirmed',
      confirmedAt: new Date(),
    })

    res.json({ success: true, data: topic })
  } catch (error) {
    res.status(500).json({ success: false, message: '确认选题失败。', error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const topic = await Topic.findByPk(req.params.id)
    if (!topic) {
      return res.status(404).json({ success: false, message: '选题不存在。' })
    }
    await topic.destroy()
    res.json({ success: true, message: '删除成功。' })
  } catch (error) {
    res.status(500).json({ success: false, message: '删除选题失败。', error: error.message })
  }
})

export default router
