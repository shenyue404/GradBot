import express from 'express'
import { MidtermReport, Student, Topic } from '../models/index.js'
import { generateMidtermDraft, generateMidtermReport } from '../services/aiService.js'

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

    if (status) {
      where.status = status
    }

    if (studentId) {
      const student = /^\d+$/.test(String(studentId))
        ? await Student.findByPk(Number(studentId))
        : await Student.findOne({ where: { studentId } })
      topicWhere.studentId = student?.id || -1
    }

    const { count, rows } = await MidtermReport.findAndCountAll({
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
    res.status(500).json({ success: false, message: '获取中期报告列表失败。', error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const report = await MidtermReport.findByPk(req.params.id, { include: [includeTopic] })
    if (!report) {
      return res.status(404).json({ success: false, message: '中期报告不存在。' })
    }
    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取中期报告详情失败。', error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { topicId, progress, achievements, keyComments, problems, solutions } = req.body
    if (!topicId) {
      return res.status(400).json({ success: false, message: 'topicId 不能为空。' })
    }

    const topic = await Topic.findByPk(topicId)
    if (!topic) {
      return res.status(404).json({ success: false, message: '选题不存在。' })
    }

    const [report] = await MidtermReport.findOrCreate({
      where: { topicId },
      defaults: {
        topicId,
        progress: progress || '',
        achievements: achievements || '',
        keyComments: keyComments || '',
        problems: problems || '',
        solutions: solutions || '',
        status: req.body.status || 'submitted',
        submittedAt: new Date(),
      },
    })

    await report.update({
      progress: progress ?? report.progress,
      achievements: achievements ?? report.achievements,
      keyComments: keyComments ?? report.keyComments,
      problems: problems ?? report.problems,
      solutions: solutions ?? report.solutions,
      status: req.body.status || 'submitted',
      submittedAt: new Date(),
    })

    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: '提交中期报告失败。', error: error.message })
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

    const generated = await generateMidtermDraft(topic, student)
    const [report] = await MidtermReport.findOrCreate({
      where: { topicId: topic.id },
      defaults: {
        topicId: topic.id,
        progress: generated.progressSummary || generated.currentStage || '',
        achievements: Array.isArray(generated.completedWork) ? generated.completedWork.join('\n') : '',
        keyComments: generated.nextStagePlan || '',
        problems: generated.problemsEncountered || '',
        solutions: generated.solutions || '',
        status: 'draft',
      },
    })

    await report.update({
      progress: generated.progressSummary || generated.currentStage || report.progress,
      achievements: Array.isArray(generated.completedWork) ? generated.completedWork.join('\n') : report.achievements,
      keyComments: generated.nextStagePlan || report.keyComments,
      problems: generated.problemsEncountered || report.problems,
      solutions: generated.solutions || report.solutions,
      feedback: generated.selfEvaluation || report.feedback,
      status: 'draft',
    })

    res.json({
      success: true,
      data: {
        report,
        generated,
      },
    })
  } catch (error) {
    console.error('generate midterm draft failed:', error)
    res.status(500).json({ success: false, message: '生成中期报告失败。', error: error.message })
  }
})

router.post('/:id/generate-report', async (req, res) => {
  try {
    const report = await MidtermReport.findByPk(req.params.id, { include: [{ model: Topic, as: 'topic', required: true }] })
    if (!report) {
      return res.status(404).json({ success: false, message: '中期报告不存在。' })
    }

    const analysis = await generateMidtermReport(
      {
        progress: report.progress,
        achievements: report.achievements,
        keyComments: report.keyComments,
      },
      report.topic,
    )

    await report.update({
      aiAnalysis: JSON.stringify(analysis),
      status: 'reviewed',
    })

    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: '生成中期分析失败。', error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const report = await MidtermReport.findByPk(req.params.id)
    if (!report) {
      return res.status(404).json({ success: false, message: '中期报告不存在。' })
    }

    await report.update(
      Object.fromEntries(
        Object.entries({
          progress: req.body.progress,
          achievements: req.body.achievements,
          keyComments: req.body.keyComments,
          problems: req.body.problems,
          solutions: req.body.solutions,
          status: req.body.status,
          feedback: req.body.feedback,
        }).filter(([, value]) => value !== undefined),
      ),
    )

    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: '更新中期报告失败。', error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const report = await MidtermReport.findByPk(req.params.id)
    if (!report) {
      return res.status(404).json({ success: false, message: '中期报告不存在。' })
    }
    await report.destroy()
    res.json({ success: true, message: '删除成功。' })
  } catch (error) {
    res.status(500).json({ success: false, message: '删除中期报告失败。', error: error.message })
  }
})

export default router
