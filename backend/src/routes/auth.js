import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User, Student, Teacher } from '../models/index.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'gradbot-secret'

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  studentId: user.studentId,
  teacherId: user.teacherId,
  department: user.department,
  major: user.major,
  class: user.class,
  phone: user.phone,
  avatar: user.avatar,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
})

const signToken = (user) =>
  jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      teacherId: user.teacherId,
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  )

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, studentId, teacherId, department, major, class: className, phone } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: '姓名、邮箱、密码和身份都是必填项。' })
    }

    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ success: false, message: '当前仅支持学生和教师账号注册。' })
    }

    if (role === 'student' && !studentId) {
      return res.status(400).json({ success: false, message: '学生注册必须填写学号。' })
    }

    if (role === 'teacher' && !teacherId) {
      return res.status(400).json({ success: false, message: '教师注册必须填写工号。' })
    }

    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ success: false, message: '该邮箱已注册。' })
    }

    if (studentId && (await User.findOne({ where: { studentId } }))) {
      return res.status(400).json({ success: false, message: '该学号已存在。' })
    }

    if (teacherId && (await User.findOne({ where: { teacherId } }))) {
      return res.status(400).json({ success: false, message: '该工号已存在。' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      studentId,
      teacherId,
      department,
      major,
      class: className,
      phone,
      isActive: true,
    })

    if (role === 'student') {
      await Student.findOrCreate({
        where: { studentId },
        defaults: {
          studentId,
          name,
          major: major || '未填写',
          class: className || '',
          phone: phone || '',
          email,
        },
      })
    }

    if (role === 'teacher') {
      await Teacher.findOrCreate({
        where: { teacherId },
        defaults: {
          teacherId,
          name,
          department: department || '未填写',
          phone: phone || '',
          email,
        },
      })
    }

    res.status(201).json({
      success: true,
      message: '注册成功。',
      token: signToken(user),
      user: sanitizeUser(user),
    })
  } catch (error) {
    console.error('register failed:', error)
    res.status(500).json({ success: false, message: '注册失败。', error: error.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: '请输入邮箱和密码。' })
    }

    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误。' })
    }

    if (!['student', 'teacher', 'admin'].includes(user.role)) {
      return res.status(403).json({ success: false, message: '当前账号类型暂不支持登录。' })
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: '当前账号已被停用。' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误。' })
    }

    await user.update({ lastLoginAt: new Date() })

    res.json({
      success: true,
      message: '登录成功。',
      token: signToken(user),
      user: sanitizeUser(user),
    })
  } catch (error) {
    console.error('login failed:', error)
    res.status(500).json({ success: false, message: '登录失败。', error: error.message })
  }
})

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在。' })
    }

    res.json({ success: true, user: sanitizeUser(user) })
  } catch (error) {
    console.error('get current user failed:', error)
    res.status(500).json({ success: false, message: '获取用户信息失败。', error: error.message })
  }
})

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ success: false, message: '缺少访问令牌。' })
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(403).json({ success: false, message: '访问令牌无效或已过期。' })
  }
}

export { authenticateToken }
export default router
