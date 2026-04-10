import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { authenticateToken } from './auth.js'
import { Advisory, Teacher, Topic, TaskBook, Proposal, MidtermReport, Student, User } from '../models/index.js'
import {
  analyzeProposal,
  evaluateTaskBook,
  generateMidtermOpinion,
  generateMidtermReport,
  generateProposalOpinion,
  generateReviewOpinion,
  generateTaskBookOpinion,
} from '../services/aiService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const router = express.Router()

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/avatars'))
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
})

const includeTopicWithStudent = {
  model: Topic,
  as: 'topic',
  required: true,
  include: [{ model: Student, as: 'student', required: false }],
}

const ensureTeacher = async (tokenUser) => {
  const user = await User.findByPk(tokenUser.userId)
  const teacher = await Teacher.findOne({ where: { teacherId: tokenUser.teacherId || user?.teacherId } })
  return { user, teacher }
}

const getManagedStudentIds = async (teacher) => {
  if (!teacher) {
    return []
  }

  const advisoryRows = await Advisory.findAll({
    where: { teacherId: teacher.id, status: 'active' },
    attributes: ['studentId'],
  })

  return advisoryRows.map((item) => item.studentId)
}

const getRowStudentId = (row) => {
  if (!row) {
    return null
  }

  // Topic rows carry the student relation directly, while task books,
  // proposals and midterm reports nest it under row.topic.student.
  return row.topic?.student?.id ?? row.student?.id ?? row.topic?.studentId ?? row.studentId ?? null
}

const filterRowsByManagedStudents = async (rows, teacher) => {
  const managedStudentIds = await getManagedStudentIds(teacher)
  return rows.filter((item) => managedStudentIds.includes(getRowStudentId(item)))
}

const parseJsonField = (value, fallback = null) => {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: '只有教师可以访问该接口。' })
    }

    const { user, teacher } = await ensureTeacher(req.user)
    if (!user && !teacher) {
      return res.status(404).json({ success: false, message: '教师信息不存在。' })
    }

    res.json({
      success: true,
      data: {
        id: teacher?.id || user?.id,
        teacherId: teacher?.teacherId || user?.teacherId || '',
        name: teacher?.name || user?.name || '',
        email: teacher?.email || user?.email || '',
        phone: teacher?.phone || user?.phone || '',
        department: teacher?.department || user?.department || '',
        title: teacher?.title || user?.title || '',
        researchFields: teacher?.researchFields || user?.researchFields || [],
        avatar: teacher?.avatar || user?.avatar || '',
        birthDate: teacher?.birthDate || user?.birthDate || '',
        gender: teacher?.gender || user?.gender || '',
        office: teacher?.office || user?.office || '',
        officeHours: teacher?.officeHours || user?.officeHours || '',
      },
    })
  } catch (error) {
    console.error('get teacher profile failed:', error)
    res.status(500).json({ success: false, message: '获取教师资料失败。', error: error.message })
  }
})

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: '只有教师可以访问该接口。' })
    }

    const { user, teacher } = await ensureTeacher(req.user)
    if (!user && !teacher) {
      return res.status(404).json({ success: false, message: '教师信息不存在。' })
    }

    const payload = {
      email: req.body.email,
      phone: req.body.phone,
      department: req.body.department,
      title: req.body.title,
      researchFields: req.body.researchFields,
      avatar: req.body.avatar,
      birthDate: req.body.birthDate,
      gender: req.body.gender,
      office: req.body.office,
      officeHours: req.body.officeHours,
    }

    if (user) {
      await user.update(Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)))
    }
    if (teacher) {
      await teacher.update(Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)))
    }

    res.json({ success: true, message: '个人信息更新成功。' })
  } catch (error) {
    console.error('update teacher profile failed:', error)
    res.status(500).json({ success: false, message: '更新教师资料失败。', error: error.message })
  }
})

router.post('/avatar', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: '只有教师可以上传头像。' })
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择要上传的头像文件。' })
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`
    const { user, teacher } = await ensureTeacher(req.user)
    if (user) {
      await user.update({ avatar: avatarUrl })
    }
    if (teacher) {
      await teacher.update({ avatar: avatarUrl })
    }

    res.json({ success: true, url: avatarUrl, message: '头像上传成功。' })
  } catch (error) {
    console.error('upload teacher avatar failed:', error)
    res.status(500).json({ success: false, message: '教师头像上传失败。', error: error.message })
  }
})

router.get('/:teacherId/pending-topics', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ where: { teacherId: req.params.teacherId } })
    const topics = await Topic.findAll({
      include: [{ model: Student, as: 'student', required: true }],
      order: [['updated_at', 'DESC']],
    })

    res.json({ success: true, data: await filterRowsByManagedStudents(topics, teacher) })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取待审核选题失败。', error: error.message })
  }
})

router.post('/topic/review', async (req, res) => {
  try {
    const { topicId, status, feedback, teacherId } = req.body
    const topic = await Topic.findByPk(topicId)
    if (!topic) {
      return res.status(404).json({ success: false, message: '选题不存在。' })
    }

    const teacher = teacherId ? await Teacher.findOne({ where: { teacherId } }) : null
    const reviewOpinion = await generateReviewOpinion(
      {
        overallSituation: topic.description || topic.title,
        keyComments: feedback || '',
      },
      teacher ? 'own' : 'other',
    )

    await topic.update({
      status,
      feedback: feedback || reviewOpinion.overall || '',
    })

    res.json({ success: true, data: topic })
  } catch (error) {
    res.status(500).json({ success: false, message: '审核选题失败。', error: error.message })
  }
})

router.get('/:teacherId/pending-taskbooks', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ where: { teacherId: req.params.teacherId } })
    const taskBooks = await TaskBook.findAll({ include: [includeTopicWithStudent], order: [['updated_at', 'DESC']] })

    res.json({ success: true, data: await filterRowsByManagedStudents(taskBooks, teacher) })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取任务书列表失败。', error: error.message })
  }
})

router.post('/taskbook/evaluate/:taskBookId', async (req, res) => {
  try {
    const taskBook = await TaskBook.findByPk(req.params.taskBookId, { include: [includeTopicWithStudent] })
    if (!taskBook) {
      return res.status(404).json({ success: false, message: '任务书不存在。' })
    }

    const evaluation = await evaluateTaskBook(taskBook, taskBook.topic, taskBook.topic?.student)
    await taskBook.update({ aiEvaluation: JSON.stringify(evaluation) })

    res.json({ success: true, data: evaluation })
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI 评估任务书失败。', error: error.message })
  }
})

router.post('/taskbook/generate-opinion/:taskBookId', async (req, res) => {
  try {
    const taskBook = await TaskBook.findByPk(req.params.taskBookId, { include: [includeTopicWithStudent] })
    if (!taskBook) {
      return res.status(404).json({ success: false, message: '任务书不存在。' })
    }

    const evaluation = taskBook.aiEvaluation
      ? parseJsonField(taskBook.aiEvaluation, null)
      : await evaluateTaskBook(taskBook, taskBook.topic, taskBook.topic?.student)

    if (!taskBook.aiEvaluation) {
      await taskBook.update({ aiEvaluation: JSON.stringify(evaluation) })
    }

    const opinion = await generateTaskBookOpinion(taskBook, evaluation, taskBook.feedback || '')
    res.json({ success: true, data: { opinion, evaluation } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI 生成任务书评语失败。', error: error.message })
  }
})

router.post('/taskbook/review', async (req, res) => {
  try {
    const { taskBookId, status, feedback } = req.body
    const taskBook = await TaskBook.findByPk(taskBookId, { include: [includeTopicWithStudent] })
    if (!taskBook) {
      return res.status(404).json({ success: false, message: '任务书不存在。' })
    }

    const finalFeedback =
      feedback ||
      (await generateTaskBookOpinion(
        taskBook,
        taskBook.aiEvaluation ? parseJsonField(taskBook.aiEvaluation, {}) : await evaluateTaskBook(taskBook, taskBook.topic, taskBook.topic?.student),
        taskBook.feedback || '',
      ))

    await taskBook.update({ status, feedback: finalFeedback })
    res.json({ success: true, data: taskBook })
  } catch (error) {
    res.status(500).json({ success: false, message: '批改任务书失败。', error: error.message })
  }
})

router.get('/:teacherId/pending-proposals', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ where: { teacherId: req.params.teacherId } })
    const proposals = await Proposal.findAll({ include: [includeTopicWithStudent], order: [['updated_at', 'DESC']] })

    res.json({ success: true, data: await filterRowsByManagedStudents(proposals, teacher) })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取开题报告列表失败。', error: error.message })
  }
})

router.post('/proposal/evaluate/:proposalId', async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.proposalId, { include: [includeTopicWithStudent] })
    if (!proposal) {
      return res.status(404).json({ success: false, message: '开题报告不存在。' })
    }

    const evaluation = await analyzeProposal(proposal.content || proposal.researchBackground || '', proposal.topic)
    await proposal.update({ aiAnalysis: JSON.stringify(evaluation) })

    res.json({ success: true, data: evaluation })
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI 评估开题报告失败。', error: error.message })
  }
})

router.post('/proposal/generate-opinion/:proposalId', async (req, res) => {
  try {
    const proposal = await Proposal.findByPk(req.params.proposalId, { include: [includeTopicWithStudent] })
    if (!proposal) {
      return res.status(404).json({ success: false, message: '开题报告不存在。' })
    }

    const analysis = proposal.aiAnalysis
      ? parseJsonField(proposal.aiAnalysis, {})
      : await analyzeProposal(proposal.content || proposal.researchBackground || '', proposal.topic)

    if (!proposal.aiAnalysis) {
      await proposal.update({ aiAnalysis: JSON.stringify(analysis) })
    }

    const opinion = await generateProposalOpinion({ topicId: proposal.topicId, analysis }, analysis)
    res.json({ success: true, data: { opinion, evaluation: analysis } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI 生成开题评语失败。', error: error.message })
  }
})

router.post('/proposal/review', async (req, res) => {
  try {
    const { proposalId, status, feedback } = req.body
    const proposal = await Proposal.findByPk(proposalId, { include: [includeTopicWithStudent] })
    if (!proposal) {
      return res.status(404).json({ success: false, message: '开题报告不存在。' })
    }

    const analysis = proposal.aiAnalysis
      ? parseJsonField(proposal.aiAnalysis, {})
      : await analyzeProposal(proposal.content || proposal.researchBackground || '', proposal.topic)

    if (!proposal.aiAnalysis) {
      await proposal.update({ aiAnalysis: JSON.stringify(analysis) })
    }

    const opinion = feedback || (await generateProposalOpinion({ topicId: proposal.topicId, analysis }, analysis))

    await proposal.update({ status, feedback: opinion })
    res.json({ success: true, data: proposal })
  } catch (error) {
    res.status(500).json({ success: false, message: '批改开题报告失败。', error: error.message })
  }
})

router.get('/:teacherId/pending-midterm-reports', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ where: { teacherId: req.params.teacherId } })
    const reports = await MidtermReport.findAll({ include: [includeTopicWithStudent], order: [['updated_at', 'DESC']] })

    res.json({ success: true, data: await filterRowsByManagedStudents(reports, teacher) })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取中期报告列表失败。', error: error.message })
  }
})

router.post('/midterm/evaluate/:reportId', async (req, res) => {
  try {
    const report = await MidtermReport.findByPk(req.params.reportId, { include: [includeTopicWithStudent] })
    if (!report) {
      return res.status(404).json({ success: false, message: '中期报告不存在。' })
    }

    const evaluation = await generateMidtermReport(
      {
        progress: report.progress,
        achievements: report.achievements,
        problems: report.problems,
        solutions: report.solutions,
        keyComments: report.keyComments,
      },
      report.topic,
    )

    await report.update({ aiAnalysis: JSON.stringify(evaluation) })
    res.json({ success: true, data: evaluation })
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI 评估中期报告失败。', error: error.message })
  }
})

router.post('/midterm/generate-opinion/:reportId', async (req, res) => {
  try {
    const report = await MidtermReport.findByPk(req.params.reportId, { include: [includeTopicWithStudent] })
    if (!report) {
      return res.status(404).json({ success: false, message: '中期报告不存在。' })
    }

    const evaluation = report.aiAnalysis
      ? parseJsonField(report.aiAnalysis, {})
      : await generateMidtermReport(
          {
            progress: report.progress,
            achievements: report.achievements,
            problems: report.problems,
            solutions: report.solutions,
            keyComments: report.keyComments,
          },
          report.topic,
        )

    if (!report.aiAnalysis) {
      await report.update({ aiAnalysis: JSON.stringify(evaluation) })
    }

    const opinion = await generateMidtermOpinion(report, evaluation, report.feedback || '')
    res.json({ success: true, data: { opinion, evaluation } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI 生成中期评语失败。', error: error.message })
  }
})

router.post('/midterm/review', async (req, res) => {
  try {
    const { reportId, status, feedback } = req.body
    const report = await MidtermReport.findByPk(reportId, { include: [includeTopicWithStudent] })
    if (!report) {
      return res.status(404).json({ success: false, message: '中期报告不存在。' })
    }

    const evaluation = report.aiAnalysis
      ? parseJsonField(report.aiAnalysis, {})
      : await generateMidtermReport(
          {
            progress: report.progress,
            achievements: report.achievements,
            problems: report.problems,
            solutions: report.solutions,
            keyComments: report.keyComments,
          },
          report.topic,
        )

    if (!report.aiAnalysis) {
      await report.update({ aiAnalysis: JSON.stringify(evaluation) })
    }

    const finalFeedback = feedback || (await generateMidtermOpinion(report, evaluation, report.feedback || ''))

    await report.update({ status, feedback: finalFeedback })
    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: '批改中期报告失败。', error: error.message })
  }
})

export default router
