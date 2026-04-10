import express from 'express'
import { TaskBook, Student, Topic } from '../models/index.js'
import { evaluateTaskBook, generateTaskBook, generateTaskBookOpinion } from '../services/aiService.js'

const router = express.Router()

const includeTopic = {
  model: Topic,
  as: 'topic',
  required: true,
  include: [{ model: Student, as: 'student', required: false }],
}

const findStudentByIdentifier = async (identifier) => {
  if (!identifier) return null

  if (/^\d+$/.test(String(identifier))) {
    const byPk = await Student.findByPk(Number(identifier))
    if (byPk) return byPk
  }

  return Student.findOne({ where: { studentId: String(identifier) } })
}

const findTopicByIdentifier = async (identifier) => {
  if (!identifier) return null

  if (/^\d+$/.test(String(identifier))) {
    const byPk = await Topic.findByPk(Number(identifier))
    if (byPk) return byPk
  }

  return Topic.findOne({ where: { id: identifier } })
}

router.get('/', async (req, res) => {
  try {
    const { studentId, status, page = 1, limit = 20 } = req.query
    const where = {}
    const topicWhere = {}

    if (studentId) {
      const student = /^\d+$/.test(String(studentId))
        ? await Student.findByPk(Number(studentId))
        : await Student.findOne({ where: { studentId } })
      topicWhere.studentId = student?.id || -1
    }

    if (status) {
      where.status = status
    }

    const { count, rows } = await TaskBook.findAndCountAll({
      where,
      include: [{ ...includeTopic, where: Object.keys(topicWhere).length ? topicWhere : undefined }],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
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
    res.status(500).json({ success: false, message: '获取任务书列表失败。', error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const taskBook = await TaskBook.findByPk(req.params.id, { include: [includeTopic] })
    if (!taskBook) {
      return res.status(404).json({ success: false, message: '任务书不存在。' })
    }
    res.json({ success: true, data: taskBook })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取任务书详情失败。', error: error.message })
  }
})

router.post('/generate', async (req, res) => {
  try {
    const { studentId, topicId } = req.body
    const student = await findStudentByIdentifier(studentId)
    const topic = await findTopicByIdentifier(topicId)

    if (!student || !topic) {
      return res.status(404).json({ success: false, message: '学生或选题不存在。' })
    }

    const generated = await generateTaskBook(topic, student)
    const content = [
      generated.mainTasks ? `主要任务\n${generated.mainTasks}` : '',
      generated.purpose ? `目的\n${generated.purpose}` : '',
      generated.mainContent ? `主要内容\n${generated.mainContent}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')
    const requirements = [
      generated.basicRequirements ? `基本要求\n${generated.basicRequirements}` : '',
      generated.priorFoundation ? `前期基础\n${generated.priorFoundation}` : '',
      generated.expectedOutcomes ? `预期成果\n${generated.expectedOutcomes}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')
    const [taskBook] = await TaskBook.findOrCreate({
      where: { topicId: topic.id },
      defaults: {
        topicId: topic.id,
        content,
        requirements,
        schedule: generated.schedule || [],
        draftContent: JSON.stringify(generated),
        status: 'draft',
      },
    })

    await taskBook.update({
      content: content || taskBook.content,
      requirements: requirements || taskBook.requirements,
      schedule: generated.schedule || taskBook.schedule,
      draftContent: JSON.stringify(generated),
    })

    res.json({ success: true, data: taskBook })
  } catch (error) {
    console.error('generate taskbook failed:', error)
    res.status(500).json({ success: false, message: '生成任务书失败。', error: error.message })
  }
})

router.post('/:id/ai-evaluate', async (req, res) => {
  try {
    const taskBook = await TaskBook.findByPk(req.params.id, { include: [includeTopic] })
    if (!taskBook) {
      return res.status(404).json({ success: false, message: '任务书不存在。' })
    }

    const evaluation = await evaluateTaskBook(taskBook, taskBook.topic, taskBook.topic?.student)
    await taskBook.update({ aiEvaluation: JSON.stringify(evaluation) })
    res.json({ success: true, data: evaluation })
  } catch (error) {
    res.status(500).json({ success: false, message: '任务书 AI 评估失败。', error: error.message })
  }
})

router.post('/:id/generate-opinion', async (req, res) => {
  try {
    const taskBook = await TaskBook.findByPk(req.params.id, { include: [includeTopic] })
    if (!taskBook) {
      return res.status(404).json({ success: false, message: '任务书不存在。' })
    }

    const evaluation =
      taskBook.aiEvaluation ? JSON.parse(taskBook.aiEvaluation) : await evaluateTaskBook(taskBook, taskBook.topic, taskBook.topic?.student)
    const opinion = await generateTaskBookOpinion(taskBook, evaluation, taskBook.feedback || '')

    if (!taskBook.aiEvaluation) {
      await taskBook.update({ aiEvaluation: JSON.stringify(evaluation) })
    }

    res.json({ success: true, data: { opinion, evaluation } })
  } catch (error) {
    res.status(500).json({ success: false, message: '生成任务书评语失败。', error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const taskBook = await TaskBook.create({
      topicId: req.body.topicId,
      content: req.body.content || '',
      requirements: req.body.requirements || '',
      schedule: req.body.schedule || [],
      draftContent: req.body.draftContent || null,
      status: req.body.status || 'draft',
      feedback: req.body.feedback || '',
    })
    res.status(201).json({ success: true, data: taskBook })
  } catch (error) {
    res.status(500).json({ success: false, message: '创建任务书失败。', error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const taskBook = await TaskBook.findByPk(req.params.id)
    if (!taskBook) {
      return res.status(404).json({ success: false, message: '任务书不存在。' })
    }

    await taskBook.update(
      Object.fromEntries(
        Object.entries({
          content: req.body.content,
          requirements: req.body.requirements,
          schedule: req.body.schedule,
          draftContent: req.body.draftContent,
          status: req.body.status,
          feedback: req.body.feedback,
        }).filter(([, value]) => value !== undefined),
      ),
    )

    res.json({ success: true, data: taskBook })
  } catch (error) {
    res.status(500).json({ success: false, message: '更新任务书失败。', error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const taskBook = await TaskBook.findByPk(req.params.id)
    if (!taskBook) {
      return res.status(404).json({ success: false, message: '任务书不存在。' })
    }
    await taskBook.destroy()
    res.json({ success: true, message: '删除成功。' })
  } catch (error) {
    res.status(500).json({ success: false, message: '删除任务书失败。', error: error.message })
  }
})

router.get('/:id/export/word', async (req, res) => {
  res.status(501).json({ success: false, message: '当前版本暂未启用 Word 导出。' })
})

export default router
