import express from 'express'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import fs from 'fs/promises'
import { authenticateToken } from './auth.js'
import { parseStudentExcel, parseTeacherExcel } from '../services/fileService.js'
import { Advisory, MidtermReport, Proposal, Student, TaskBook, Teacher, Topic, User } from '../models/index.js'

const router = express.Router()
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } })

const ACTIVE_ADVISORY_STATUS = 'active'
const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'GradBot123!'
const HIGH_RISK = 'high'
const MEDIUM_RISK = 'medium'
const NORMAL_RISK = 'normal'

const ensureAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以访问该接口。' })
    }

    const user = await User.findByPk(req.user.userId)
    if (!user || !user.isActive) {
      return res.status(403).json({ success: false, message: '当前管理员账号不可用。' })
    }

    req.adminUser = user
    next()
  } catch (error) {
    res.status(500).json({ success: false, message: '管理员权限校验失败。', error: error.message })
  }
}

const includeStudentTopics = {
  model: Topic,
  as: 'topics',
  required: false,
}

const sortByTimeDesc = (left, right) => new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0)

const getLatestTopic = (student) => {
  const topics = Array.isArray(student.topics) ? [...student.topics] : []
  return topics.sort(sortByTimeDesc)[0] || null
}

const normalizeDocumentStatus = (status) => status || 'not_started'

const calculateQualityPenalty = (document) => {
  if (!document) {
    return 0
  }
  if (['rejected', 'failed'].includes(document.status)) {
    return 25
  }
  if (['pending', 'submitted', 'reviewing'].includes(document.status)) {
    return 8
  }
  return 0
}

const normalizeProgressStatus = (student, taskBook, proposal, midterm, teacher) => {
  const topicCount = Array.isArray(student.topics) ? student.topics.length : 0
  const documents = [taskBook, proposal, midterm]
  const pendingCount = documents.filter((item) => item && ['pending', 'submitted', 'reviewing'].includes(item.status)).length
  const rejectedCount = documents.filter((item) => item && ['rejected', 'failed'].includes(item.status)).length
  const approvedCount = documents.filter((item) => item && ['approved', 'passed', 'reviewed'].includes(item.status)).length

  const progressScore = Math.max(0, Math.min(100, topicCount * 20 + approvedCount * 25 + (taskBook ? 10 : 0) + (proposal ? 10 : 0) + (midterm ? 10 : 0) - rejectedCount * 12))
  const qualityScore = Math.max(0, Math.min(100, 100 - calculateQualityPenalty(taskBook) - calculateQualityPenalty(proposal) - calculateQualityPenalty(midterm)))

  let riskLevel = NORMAL_RISK
  const riskReasons = []

  if (!teacher) {
    riskLevel = HIGH_RISK
    riskReasons.push('尚未分配指导教师')
  }
  if (topicCount === 0) {
    riskLevel = HIGH_RISK
    riskReasons.push('尚未完成选题')
  }
  if (rejectedCount > 0) {
    riskLevel = HIGH_RISK
    riskReasons.push('存在未通过材料')
  }
  if (progressScore < 60) {
    riskLevel = HIGH_RISK
    riskReasons.push('阶段进度明显滞后')
  } else if (riskLevel !== HIGH_RISK && progressScore < 78) {
    riskLevel = MEDIUM_RISK
    riskReasons.push('阶段进度需要持续跟进')
  }
  if (qualityScore < 70) {
    riskLevel = HIGH_RISK
    riskReasons.push('当前材料质量偏低')
  } else if (riskLevel === NORMAL_RISK && qualityScore < 82) {
    riskLevel = MEDIUM_RISK
    riskReasons.push('当前材料质量有待提升')
  }
  if (riskLevel !== HIGH_RISK && pendingCount >= 2) {
    riskLevel = MEDIUM_RISK
    riskReasons.push('待审核材料较多')
  }

  return {
    progressScore,
    qualityScore,
    riskLevel,
    riskReasons: [...new Set(riskReasons)],
  }
}

const buildTeacherLookup = (advisories) =>
  advisories.reduce((acc, item) => {
    if (item.teacher) {
      acc[item.studentId] = item.teacher
    }
    return acc
  }, {})

const buildActiveTeacherCounts = (advisories) =>
  advisories.reduce((acc, item) => {
    acc[item.teacherId] = (acc[item.teacherId] || 0) + 1
    return acc
  }, {})

const buildOptionsFromRows = (rows) => ({
  departments: [...new Set(rows.map((row) => row.department).filter(Boolean))].sort(),
  majors: [...new Set(rows.map((row) => row.major).filter(Boolean))].sort(),
  grades: [...new Set(rows.map((row) => row.grade).filter(Boolean))].sort(),
  riskLevels: [HIGH_RISK, MEDIUM_RISK, NORMAL_RISK],
})

const applyStudentProgressFilters = (rows, query) => {
  const { department, major, grade, riskLevel, teacherId } = query
  return rows.filter((row) => {
    if (department && row.department !== department) return false
    if (major && row.major !== major) return false
    if (grade && row.grade !== grade) return false
    if (riskLevel && row.riskLevel !== riskLevel) return false
    if (teacherId && row.teacherId !== teacherId) return false
    return true
  })
}

const buildStudentProgressRows = async () => {
  const [students, advisories, taskBooks, proposals, midterms] = await Promise.all([
    Student.findAll({ include: [includeStudentTopics], order: [['student_id', 'ASC']] }),
    Advisory.findAll({
      where: { status: ACTIVE_ADVISORY_STATUS },
      include: [{ model: Teacher, as: 'teacher', required: false }],
    }),
    TaskBook.findAll(),
    Proposal.findAll(),
    MidtermReport.findAll(),
  ])

  const teacherMap = buildTeacherLookup(advisories)
  const taskBookMap = new Map(taskBooks.map((item) => [item.topicId, item]))
  const proposalMap = new Map(proposals.map((item) => [item.topicId, item]))
  const midtermMap = new Map(midterms.map((item) => [item.topicId, item]))

  return students.map((student) => {
    const latestTopic = getLatestTopic(student)
    const taskBook = latestTopic ? taskBookMap.get(latestTopic.id) : null
    const proposal = latestTopic ? proposalMap.get(latestTopic.id) : null
    const midterm = latestTopic ? midtermMap.get(latestTopic.id) : null
    const teacher = teacherMap[student.id]
    const summary = normalizeProgressStatus(student, taskBook, proposal, midterm, teacher)

    return {
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      department: student.department || '',
      major: student.major || '',
      grade: student.grade || '',
      class: student.class || '',
      teacherId: teacher?.teacherId || '',
      teacherName: teacher?.name || student.advisor || '未分配',
      topicTitle: latestTopic?.title || '',
      topicStatus: normalizeDocumentStatus(latestTopic?.status),
      taskBookStatus: normalizeDocumentStatus(taskBook?.status),
      proposalStatus: normalizeDocumentStatus(proposal?.status),
      midtermStatus: normalizeDocumentStatus(midterm?.status),
      ...summary,
    }
  })
}

const createHashedPassword = async (password = DEFAULT_PASSWORD) => bcrypt.hash(password, 10)

const createTeacherAccount = async (payload) => {
  const email = payload.email || `${payload.teacherId}@gradbot.local`
  const existingEmail = await User.findOne({ where: { email } })
  if (existingEmail) {
    throw new Error(`邮箱 ${email} 已存在`)
  }

  const existingTeacherId = await Teacher.findOne({ where: { teacherId: payload.teacherId } })
  if (existingTeacherId) {
    throw new Error(`工号 ${payload.teacherId} 已存在`)
  }

  const password = await createHashedPassword(payload.password || DEFAULT_PASSWORD)

  const user = await User.create({
    name: payload.name,
    email,
    password,
    role: 'teacher',
    teacherId: payload.teacherId,
    department: payload.department || '',
    phone: payload.phone || '',
    title: payload.title || '',
    researchFields: payload.researchFields || [],
    office: payload.office || '',
    officeHours: payload.officeHours || '',
    isActive: true,
  })

  const teacher = await Teacher.create({
    teacherId: payload.teacherId,
    name: payload.name,
    department: payload.department || '',
    title: payload.title || '',
    phone: payload.phone || '',
    email,
    researchFields: payload.researchFields || [],
    office: payload.office || '',
    officeHours: payload.officeHours || '',
  })

  return { user, teacher }
}

const createStudentAccount = async (payload) => {
  const email = payload.email || `${payload.studentId}@gradbot.local`
  const existingEmail = await User.findOne({ where: { email } })
  if (existingEmail) {
    throw new Error(`邮箱 ${email} 已存在`)
  }

  const existingStudentId = await Student.findOne({ where: { studentId: payload.studentId } })
  if (existingStudentId) {
    throw new Error(`学号 ${payload.studentId} 已存在`)
  }

  const password = await createHashedPassword(payload.password || DEFAULT_PASSWORD)

  const user = await User.create({
    name: payload.name,
    email,
    password,
    role: 'student',
    studentId: payload.studentId,
    department: payload.department || '',
    major: payload.major || '',
    class: payload.class || '',
    phone: payload.phone || '',
    grade: payload.grade || '',
    advisor: payload.advisor || '',
    researchDirection: payload.researchDirection || '',
    isActive: true,
  })

  const student = await Student.create({
    studentId: payload.studentId,
    name: payload.name,
    department: payload.department || '',
    major: payload.major || '',
    class: payload.class || '',
    phone: payload.phone || '',
    email,
    grade: payload.grade || '',
    advisor: payload.advisor || '',
    researchDirection: payload.researchDirection || '',
  })

  return { user, student }
}

router.use(authenticateToken, ensureAdmin)

router.get('/overview', async (req, res) => {
  try {
    const [teacherCount, studentCount, advisoryCount, topicCount, rows] = await Promise.all([
      Teacher.count(),
      Student.count(),
      Advisory.count({ where: { status: ACTIVE_ADVISORY_STATUS } }),
      Topic.count(),
      buildStudentProgressRows(),
    ])

    const alerts = rows
      .filter((row) => row.riskLevel !== NORMAL_RISK)
      .sort((left, right) => ({ high: 3, medium: 2, normal: 1 }[right.riskLevel] - { high: 3, medium: 2, normal: 1 }[left.riskLevel] || left.progressScore - right.progressScore))
      .map((row) => ({
        studentId: row.studentId,
        studentName: row.name,
        major: row.major,
        progressScore: row.progressScore,
        qualityScore: row.qualityScore,
        riskLevel: row.riskLevel,
        riskReasons: row.riskReasons,
      }))
      .slice(0, 10)

    res.json({
      success: true,
      data: {
        teacherCount,
        studentCount,
        advisoryCount,
        topicCount,
        alertCount: rows.filter((row) => row.riskLevel !== NORMAL_RISK).length,
        alerts,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取管理员总览失败。', error: error.message })
  }
})

router.get('/teachers', async (req, res) => {
  try {
    const [teachers, advisories] = await Promise.all([
      Teacher.findAll({ order: [['teacher_id', 'ASC']] }),
      Advisory.findAll({ where: { status: ACTIVE_ADVISORY_STATUS } }),
    ])

    const counts = buildActiveTeacherCounts(advisories)

    res.json({
      success: true,
      data: teachers.map((teacher) => ({
        ...teacher.toJSON(),
        studentCount: counts[teacher.id] || 0,
      })),
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取教师名单失败。', error: error.message })
  }
})

router.post('/teachers', async (req, res) => {
  try {
    const { teacherId, name, email } = req.body
    if (!teacherId || !name || !email) {
      return res.status(400).json({ success: false, message: '工号、姓名和邮箱不能为空。' })
    }

    const result = await createTeacherAccount(req.body)
    res.status(201).json({
      success: true,
      data: result.teacher,
      message: `教师录入成功，默认密码为 ${req.body.password || DEFAULT_PASSWORD}`,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '录入教师失败。', error: error.message })
  }
})

router.post('/teachers/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传 Excel 文件。' })
    }

    const rows = await parseTeacherExcel(req.file.path)
    const result = { success: 0, failed: 0, errors: [], defaultPassword: DEFAULT_PASSWORD }

    for (const row of rows) {
      try {
        await createTeacherAccount({ ...row, password: req.body.password || DEFAULT_PASSWORD })
        result.success += 1
      } catch (error) {
        result.failed += 1
        result.errors.push(`${row.teacherId || row.name}: ${error.message}`)
      }
    }

    await fs.unlink(req.file.path).catch(() => undefined)
    res.json({ success: true, data: result, message: '教师批量导入完成。' })
  } catch (error) {
    res.status(500).json({ success: false, message: '教师批量导入失败。', error: error.message })
  }
})

router.get('/teachers/:teacherId/students', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ where: { teacherId: req.params.teacherId } })
    if (!teacher) {
      return res.status(404).json({ success: false, message: '教师不存在。' })
    }

    const rows = await buildStudentProgressRows()
    const teacherRows = rows.filter((row) => row.teacherId === teacher.teacherId)

    res.json({
      success: true,
      data: {
        teacher: {
          id: teacher.id,
          teacherId: teacher.teacherId,
          name: teacher.name,
          department: teacher.department || '',
          title: teacher.title || '',
          email: teacher.email || '',
          phone: teacher.phone || '',
          studentCount: teacherRows.length,
        },
        summary: {
          totalStudents: teacherRows.length,
          highRiskCount: teacherRows.filter((row) => row.riskLevel === HIGH_RISK).length,
          mediumRiskCount: teacherRows.filter((row) => row.riskLevel === MEDIUM_RISK).length,
          normalCount: teacherRows.filter((row) => row.riskLevel === NORMAL_RISK).length,
        },
        students: teacherRows.sort((left, right) => ({ high: 3, medium: 2, normal: 1 }[right.riskLevel] - { high: 3, medium: 2, normal: 1 }[left.riskLevel] || left.progressScore - right.progressScore)),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取教师名下学生详情失败。', error: error.message })
  }
})

router.get('/students', async (req, res) => {
  try {
    const [students, advisories] = await Promise.all([
      Student.findAll({ include: [includeStudentTopics], order: [['student_id', 'ASC']] }),
      Advisory.findAll({
        where: { status: ACTIVE_ADVISORY_STATUS },
        include: [{ model: Teacher, as: 'teacher', required: false }],
      }),
    ])

    const teacherMap = advisories.reduce((acc, item) => {
      if (!acc[item.studentId]) {
        acc[item.studentId] = []
      }
      if (item.teacher) {
        acc[item.studentId].push({
          id: item.teacher.id,
          teacherId: item.teacher.teacherId,
          name: item.teacher.name,
          department: item.teacher.department,
        })
      }
      return acc
    }, {})

    res.json({
      success: true,
      data: students.map((student) => ({
        ...student.toJSON(),
        assignedTeachers: teacherMap[student.id] || [],
      })),
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取学生名单失败。', error: error.message })
  }
})

router.post('/students', async (req, res) => {
  try {
    const { studentId, name, email, major } = req.body
    if (!studentId || !name || !email || !major) {
      return res.status(400).json({ success: false, message: '学号、姓名、邮箱和专业不能为空。' })
    }

    const result = await createStudentAccount(req.body)
    res.status(201).json({
      success: true,
      data: result.student,
      message: `学生录入成功，默认密码为 ${req.body.password || DEFAULT_PASSWORD}`,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '录入学生失败。', error: error.message })
  }
})

router.post('/students/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传 Excel 文件。' })
    }

    const rows = await parseStudentExcel(req.file.path)
    const result = { success: 0, failed: 0, errors: [], defaultPassword: DEFAULT_PASSWORD }

    for (const row of rows) {
      try {
        await createStudentAccount({
          studentId: row.studentId,
          name: row.name,
          email: row.email || `${row.studentId}@gradbot.local`,
          department: row.department,
          major: row.major,
          grade: row.grade,
          class: row.className,
          phone: row.phone,
          advisor: row.advisor,
          researchDirection: row.researchDirection,
          password: req.body.password || DEFAULT_PASSWORD,
        })
        result.success += 1
      } catch (error) {
        result.failed += 1
        result.errors.push(`${row.studentId || row.name}: ${error.message}`)
      }
    }

    await fs.unlink(req.file.path).catch(() => undefined)
    res.json({ success: true, data: result, message: '学生批量导入完成。' })
  } catch (error) {
    res.status(500).json({ success: false, message: '学生批量导入失败。', error: error.message })
  }
})

router.get('/advisories', async (req, res) => {
  try {
    const rows = await Advisory.findAll({
      include: [
        { model: Teacher, as: 'teacher', required: true },
        { model: Student, as: 'student', required: true },
      ],
      order: [['created_at', 'DESC']],
    })

    res.json({ success: true, data: rows })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取指导关系失败。', error: error.message })
  }
})

router.post('/advisories', async (req, res) => {
  try {
    const { teacherId, studentId, startDate } = req.body
    const teacher = await Teacher.findOne({ where: { teacherId } })
    const student = await Student.findOne({ where: { studentId } })

    if (!teacher || !student) {
      return res.status(404).json({ success: false, message: '教师或学生不存在。' })
    }

    const [advisory] = await Advisory.findOrCreate({
      where: { teacherId: teacher.id, studentId: student.id },
      defaults: {
        teacherId: teacher.id,
        studentId: student.id,
        startDate: startDate || new Date().toISOString().slice(0, 10),
        status: ACTIVE_ADVISORY_STATUS,
      },
    })

    await advisory.update({
      status: ACTIVE_ADVISORY_STATUS,
      endDate: null,
      startDate: startDate || advisory.startDate || new Date().toISOString().slice(0, 10),
    })

    await student.update({ advisor: teacher.name })
    res.json({ success: true, data: advisory, message: '指导关系已建立。' })
  } catch (error) {
    res.status(500).json({ success: false, message: '建立指导关系失败。', error: error.message })
  }
})

router.put('/advisories/:id', async (req, res) => {
  try {
    const advisory = await Advisory.findByPk(req.params.id)
    if (!advisory) {
      return res.status(404).json({ success: false, message: '指导关系不存在。' })
    }

    const updates = {}
    if (req.body.teacherId) {
      const teacher = await Teacher.findOne({ where: { teacherId: req.body.teacherId } })
      if (!teacher) {
        return res.status(404).json({ success: false, message: '目标教师不存在。' })
      }
      updates.teacherId = teacher.id
    }
    if (req.body.studentId) {
      const student = await Student.findOne({ where: { studentId: req.body.studentId } })
      if (!student) {
        return res.status(404).json({ success: false, message: '目标学生不存在。' })
      }
      updates.studentId = student.id
    }
    if (req.body.status !== undefined) updates.status = req.body.status
    if (req.body.startDate !== undefined) updates.startDate = req.body.startDate
    if (req.body.endDate !== undefined) updates.endDate = req.body.endDate

    await advisory.update(updates)
    res.json({ success: true, data: advisory, message: '指导关系已更新。' })
  } catch (error) {
    res.status(500).json({ success: false, message: '调整指导关系失败。', error: error.message })
  }
})

router.get('/student-progress', async (req, res) => {
  try {
    const rows = await buildStudentProgressRows()
    const filteredRows = applyStudentProgressFilters(rows, req.query)

    res.json({
      success: true,
      data: filteredRows,
      meta: {
        filters: buildOptionsFromRows(rows),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取学生进度失败。', error: error.message })
  }
})

export default router
