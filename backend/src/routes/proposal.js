import express from 'express'
import multer from 'multer'
import fs from 'fs/promises'
import { Proposal, Student, Topic } from '../models/index.js'
import { analyzeProposal, generateProposalDraft, generateProposalOpinion } from '../services/aiService.js'

const router = express.Router()
const upload = multer({ dest: 'uploads/proposals/', limits: { fileSize: 10 * 1024 * 1024 } })

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

    const { count, rows } = await Proposal.findAndCountAll({
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
    res.status(500).json({ success: false, message: '获取开题报告列表失败。', error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id, { include: [includeTopic] })
    if (!proposal) {
      return res.status(404).json({ success: false, message: '开题报告不存在。' })
    }
    res.json({ success: true, data: proposal })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取开题报告详情失败。', error: error.message })
  }
})

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { topicId } = req.body
    if (!req.file || !topicId) {
      return res.status(400).json({ success: false, message: '文件和 topicId 不能为空。' })
    }

    const topic = await Topic.findByPk(topicId)
    if (!topic) {
      return res.status(404).json({ success: false, message: '选题不存在。' })
    }

    const content = await fs.readFile(req.file.path, 'utf-8').catch(() => `Uploaded file: ${req.file.originalname}`)
    await fs.unlink(req.file.path).catch(() => undefined)
    const analysis = await analyzeProposal(content, topic)

    const [proposal] = await Proposal.findOrCreate({
      where: { topicId: topic.id },
      defaults: {
        topicId: topic.id,
        content,
        researchBackground: content,
        researchObjectives: '',
        methodology: '',
        expectedResults: '',
        aiAnalysis: JSON.stringify(analysis),
        status: 'reviewing',
      },
    })

    await proposal.update({
      content,
      researchBackground: content,
      aiAnalysis: JSON.stringify(analysis),
      status: 'reviewing',
    })

    res.json({ success: true, data: proposal })
  } catch (error) {
    console.error('upload proposal failed:', error)
    res.status(500).json({ success: false, message: '上传开题报告失败。', error: error.message })
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

    const generated = await generateProposalDraft(topic, student)
    const content = [
      generated.researchBackground,
      generated.researchObjectives,
      generated.researchContent,
      generated.researchMethods,
      generated.expectedOutcomes,
    ]
      .filter(Boolean)
      .join('\n\n')

    const analysis = await analyzeProposal(content, topic)

    const [proposal] = await Proposal.findOrCreate({
      where: { topicId: topic.id },
      defaults: {
        topicId: topic.id,
        content,
        researchBackground: generated.researchBackground || '',
        researchObjectives: generated.researchObjectives || '',
        methodology: generated.researchMethods || '',
        expectedResults: generated.expectedOutcomes || '',
        aiAnalysis: JSON.stringify(analysis),
        status: 'draft',
      },
    })

    await proposal.update({
      content,
      researchBackground: generated.researchBackground || proposal.researchBackground,
      researchObjectives: generated.researchObjectives || proposal.researchObjectives,
      methodology: generated.researchMethods || proposal.methodology,
      expectedResults: generated.expectedOutcomes || proposal.expectedResults,
      aiAnalysis: JSON.stringify(analysis),
      status: 'draft',
    })

    res.json({
      success: true,
      data: {
        proposal,
        generated,
      },
    })
  } catch (error) {
    console.error('generate proposal failed:', error)
    res.status(500).json({ success: false, message: '生成开题报告失败。', error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { topicId, content } = req.body
    if (!topicId || !content) {
      return res.status(400).json({ success: false, message: 'topicId 和内容不能为空。' })
    }

    const topic = await Topic.findByPk(topicId)
    if (!topic) {
      return res.status(404).json({ success: false, message: '选题不存在。' })
    }

    const analysis = await analyzeProposal(content, topic)
    const proposal = await Proposal.create({
      topicId,
      content,
      researchBackground: req.body.researchBackground || content,
      researchObjectives: req.body.researchObjectives || '',
      methodology: req.body.methodology || req.body.researchMethods || '',
      expectedResults: req.body.expectedResults || '',
      aiAnalysis: JSON.stringify(analysis),
      status: req.body.status || 'draft',
      feedback: req.body.feedback || '',
    })

    res.status(201).json({ success: true, data: proposal })
  } catch (error) {
    res.status(500).json({ success: false, message: '创建开题报告失败。', error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id)
    if (!proposal) {
      return res.status(404).json({ success: false, message: '开题报告不存在。' })
    }

    const topic = await Topic.findByPk(proposal.topicId)
    const nextContent = req.body.content ?? proposal.content
    const nextAnalysis = req.body.content !== undefined && topic ? await analyzeProposal(nextContent, topic) : null

    await proposal.update(
      Object.fromEntries(
        Object.entries({
          content: req.body.content,
          researchBackground: req.body.researchBackground,
          researchObjectives: req.body.researchObjectives,
          methodology: req.body.methodology ?? req.body.researchMethods,
          expectedResults: req.body.expectedResults,
          status: req.body.status,
          feedback: req.body.feedback,
          aiAnalysis: nextAnalysis ? JSON.stringify(nextAnalysis) : undefined,
        }).filter(([, value]) => value !== undefined),
      ),
    )

    res.json({ success: true, data: proposal })
  } catch (error) {
    res.status(500).json({ success: false, message: '更新开题报告失败。', error: error.message })
  }
})

router.post('/:id/generate-opinion', async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id)
    if (!proposal) {
      return res.status(404).json({ success: false, message: '开题报告不存在。' })
    }

    const analysis = proposal.aiAnalysis ? JSON.parse(proposal.aiAnalysis) : {}
    const opinion = await generateProposalOpinion(
      {
        topicId: proposal.topicId,
        analysis,
      },
      analysis,
    )

    await proposal.update({ feedback: opinion, status: 'approved' })
    res.json({ success: true, data: { opinion, proposal } })
  } catch (error) {
    res.status(500).json({ success: false, message: '生成开题意见失败。', error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.id)
    if (!proposal) {
      return res.status(404).json({ success: false, message: '开题报告不存在。' })
    }
    await proposal.destroy()
    res.json({ success: true, message: '删除成功。' })
  } catch (error) {
    res.status(500).json({ success: false, message: '删除开题报告失败。', error: error.message })
  }
})

export default router
