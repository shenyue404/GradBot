import express from 'express'
import { Review, Student, Topic, Teacher } from '../models/index.js'
import { generateReviewOpinion, generateDefenseOpinion } from '../services/aiService.js'

const router = express.Router()

const includeConfig = [
  {
    model: Topic,
    as: 'topic',
    required: true,
    include: [{ model: Student, as: 'student', required: false }],
  },
  {
    model: Teacher,
    as: 'reviewer',
    required: false,
  },
]

router.get('/', async (req, res) => {
  try {
    const { topicId, reviewerId, status, page = 1, limit = 20 } = req.query
    const where = {}
    if (topicId) where.topicId = topicId
    if (reviewerId) where.reviewerId = reviewerId
    if (status) where.status = status

    const { count, rows } = await Review.findAndCountAll({
      where,
      include: includeConfig,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [['created_at', 'DESC']],
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
    res.status(500).json({ success: false, message: '获取评审记录失败。', error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id, { include: includeConfig })
    if (!review) {
      return res.status(404).json({ success: false, message: '评审记录不存在。' })
    }
    res.json({ success: true, data: review })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取评审详情失败。', error: error.message })
  }
})

router.post('/thesis', async (req, res) => {
  try {
    const { topicId, reviewerId, overallSituation, keyComments } = req.body
    const topic = await Topic.findByPk(topicId)
    const reviewer = await Teacher.findByPk(reviewerId)
    if (!topic || !reviewer) {
      return res.status(404).json({ success: false, message: '选题或评审教师不存在。' })
    }

    const aiOpinion = await generateReviewOpinion({ overallSituation, keyComments: keyComments || '' }, 'other')
    const review = await Review.create({
      topicId,
      reviewerId,
      content: overallSituation,
      aiAssistant: JSON.stringify(aiOpinion),
      status: 'submitted',
    })

    res.status(201).json({ success: true, data: review })
  } catch (error) {
    res.status(500).json({ success: false, message: '创建论文评审失败。', error: error.message })
  }
})

router.post('/defense', async (req, res) => {
  try {
    const { topicId, reviewerId, overallSituation, keyComments } = req.body
    const topic = await Topic.findByPk(topicId)
    const reviewer = await Teacher.findByPk(reviewerId)
    if (!topic || !reviewer) {
      return res.status(404).json({ success: false, message: '选题或评审教师不存在。' })
    }

    const aiOpinion = await generateDefenseOpinion({ overallSituation, keyComments: keyComments || '' })
    const review = await Review.create({
      topicId,
      reviewerId,
      content: overallSituation,
      aiAssistant: aiOpinion,
      status: 'submitted',
    })

    res.status(201).json({ success: true, data: review })
  } catch (error) {
    res.status(500).json({ success: false, message: '创建答辩评审失败。', error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id)
    if (!review) {
      return res.status(404).json({ success: false, message: '评审记录不存在。' })
    }

    await review.update(
      Object.fromEntries(
        Object.entries({
          content: req.body.content,
          aiAssistant: req.body.aiAssistant,
          status: req.body.status,
        }).filter(([, value]) => value !== undefined),
      ),
    )

    res.json({ success: true, data: review })
  } catch (error) {
    res.status(500).json({ success: false, message: '更新评审记录失败。', error: error.message })
  }
})

router.post('/:id/regenerate', async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id)
    if (!review) {
      return res.status(404).json({ success: false, message: '评审记录不存在。' })
    }

    const opinion = await generateReviewOpinion({ overallSituation: review.content, keyComments: '' }, 'other')
    await review.update({ aiAssistant: JSON.stringify(opinion) })

    res.json({ success: true, data: review })
  } catch (error) {
    res.status(500).json({ success: false, message: '重新生成评审意见失败。', error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id)
    if (!review) {
      return res.status(404).json({ success: false, message: '评审记录不存在。' })
    }
    await review.destroy()
    res.json({ success: true, message: '删除成功。' })
  } catch (error) {
    res.status(500).json({ success: false, message: '删除评审记录失败。', error: error.message })
  }
})

export default router
