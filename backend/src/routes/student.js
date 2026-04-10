import express from 'express';
import multer from 'multer';
import { Op } from 'sequelize';
import { Student, Topic, TaskBook, Proposal, MidtermReport, User } from '../models/index.js';
import { parseStudentExcel } from '../services/fileService.js';
import { generateTopics as generateTopicSuggestions } from '../services/aiService.js';
import fs from 'fs/promises';
import { authenticateToken } from './auth.js';

const router = express.Router();

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 },
});

const buildStudentProfile = (student, user) => ({
  id: student?.id || user?.id,
  studentId: student?.studentId || user?.studentId || '',
  name: student?.name || user?.name || '',
  email: student?.email || user?.email || '',
  phone: student?.phone || user?.phone || '',
  major: student?.major || user?.major || '',
  grade: student?.grade || user?.grade || '',
  class: student?.class || user?.class || '',
  advisor: student?.advisor || user?.advisor || '',
  researchDirection: student?.researchDirection || user?.researchDirection || '',
  avatar: student?.avatar || user?.avatar || '',
  birthDate: student?.birthDate || user?.birthDate || '',
  gender: student?.gender || user?.gender || '',
});

const findStudentByParam = async (identifier) => {
  if (/^\d+$/.test(identifier)) {
    const byPk = await Student.findByPk(Number(identifier), {
      include: [{ model: Topic, as: 'topics', required: false }],
      order: [[{ model: Topic, as: 'topics' }, 'updated_at', 'DESC']],
    });
    if (byPk) return byPk;
  }

  return Student.findOne({
    where: { studentId: identifier },
    include: [{ model: Topic, as: 'topics', required: false }],
  });
};

router.get('/majors/list', async (req, res) => {
  try {
    const students = await Student.findAll({ attributes: ['major'], group: ['major'] });
    res.json({ success: true, data: students.map((item) => item.major).filter(Boolean) });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取专业列表失败。', error: error.message });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: '只有学生可以访问该接口。' });
    }

    const user = await User.findByPk(req.user.userId);
    const student = await Student.findOne({ where: { studentId: req.user.studentId } });

    if (!user && !student) {
      return res.status(404).json({ success: false, message: '学生信息不存在。' });
    }

    res.json({ success: true, data: buildStudentProfile(student, user) });
  } catch (error) {
    console.error('get student profile failed:', error);
    res.status(500).json({ success: false, message: '获取学生资料失败。', error: error.message });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: '只有学生可以访问该接口。' });
    }

    const user = await User.findByPk(req.user.userId);
    const student = await Student.findOne({ where: { studentId: req.user.studentId } });

    if (!user && !student) {
      return res.status(404).json({ success: false, message: '学生信息不存在。' });
    }

    const payload = {
      email: req.body.email,
      phone: req.body.phone,
      grade: req.body.grade,
      class: req.body.class,
      advisor: req.body.advisor,
      researchDirection: req.body.researchDirection,
      avatar: req.body.avatar,
      birthDate: req.body.birthDate,
      gender: req.body.gender,
    };

    if (user) {
      await user.update(Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)));
    }

    if (student) {
      await student.update(Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)));
    }

    res.json({
      success: true,
      data: buildStudentProfile(student || null, user || null),
      message: '个人信息更新成功。',
    });
  } catch (error) {
    console.error('update student profile failed:', error);
    res.status(500).json({ success: false, message: '更新学生资料失败。', error: error.message });
  }
});

router.post('/avatar', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: '只有学生可以上传头像。' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择要上传的头像文件。' });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByPk(req.user.userId);
    const student = await Student.findOne({ where: { studentId: req.user.studentId } });

    if (user) await user.update({ avatar: avatarUrl });
    if (student) await student.update({ avatar: avatarUrl });

    res.json({ success: true, url: avatarUrl, message: '头像上传成功。' });
  } catch (error) {
    console.error('upload student avatar failed:', error);
    res.status(500).json({ success: false, message: '头像上传失败。', error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search, major, page = 1, limit = 20 } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { studentId: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
      ];
    }

    if (major) {
      where.major = major;
    }

    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await Student.findAndCountAll({
      where,
      include: [{ model: Topic, as: 'topics', required: false }],
      limit: Number(limit),
      offset,
      order: [['updated_at', 'DESC']],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取学生列表失败。', error: error.message });
  }
});

router.get('/:id/status', async (req, res) => {
  try {
    const student = await findStudentByParam(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: '学生不存在。' });
    }

    const latestTopic = [...(student.topics || [])].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

    const [taskBook, proposal, midterm] = latestTopic
      ? await Promise.all([
          TaskBook.findOne({ where: { topicId: latestTopic.id }, order: [['updated_at', 'DESC']] }),
          Proposal.findOne({ where: { topicId: latestTopic.id }, order: [['updated_at', 'DESC']] }),
          MidtermReport.findOne({ where: { topicId: latestTopic.id }, order: [['updated_at', 'DESC']] }),
        ])
      : [null, null, null];

    res.json({
      success: true,
      data: {
        student: {
          id: student.id,
          studentId: student.studentId,
          name: student.name,
          major: student.major,
          email: student.email,
        },
        topic: latestTopic
          ? {
              id: latestTopic.id,
              studentId: student.studentId,
              title: latestTopic.title,
              description: latestTopic.description,
              status: latestTopic.status,
              feedback: latestTopic.feedback || '',
              updatedAt: latestTopic.updatedAt,
            }
          : null,
        taskBook: taskBook
          ? {
              id: taskBook.id,
              status: taskBook.status,
              feedback: taskBook.feedback || '',
              updatedAt: taskBook.updatedAt,
            }
          : null,
        proposal: proposal
          ? {
              id: proposal.id,
              status: proposal.status,
              feedback: proposal.feedback || '',
              updatedAt: proposal.updatedAt,
            }
          : null,
        midterm: midterm
          ? {
              id: midterm.id,
              status: midterm.status,
              feedback: midterm.feedback || '',
              updatedAt: midterm.updatedAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('get student status failed:', error);
    res.status(500).json({ success: false, message: '获取学生状态失败。', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const student = await findStudentByParam(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: '学生不存在。' });
    }

    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取学生详情失败。', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { studentId, name, major, class: className, email, phone } = req.body;
    if (!studentId || !name || !major) {
      return res.status(400).json({ success: false, message: '学号、姓名、专业不能为空。' });
    }

    if (await Student.findOne({ where: { studentId } })) {
      return res.status(400).json({ success: false, message: '学号已存在。' });
    }

    const student = await Student.create({
      studentId,
      name,
      major,
      class: className || '',
      email: email || '',
      phone: phone || '',
    });

    res.status(201).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建学生失败。', error: error.message });
  }
});

router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传 Excel 文件。' });
    }

    const studentsData = await parseStudentExcel(req.file.path);
    const result = { success: 0, failed: 0, errors: [] };

    for (const item of studentsData) {
      try {
        const exists = await Student.findOne({ where: { studentId: item.studentId } });
        if (exists) {
          result.failed += 1;
          result.errors.push(`学号 ${item.studentId} 已存在`);
          continue;
        }

        await Student.create({
          studentId: item.studentId,
          name: item.name,
          major: item.major,
          class: item.className || '',
          email: item.email || '',
          phone: item.phone || '',
        });
        result.success += 1;
      } catch (error) {
        result.failed += 1;
        result.errors.push(`学号 ${item.studentId}: ${error.message}`);
      }
    }

    await fs.unlink(req.file.path).catch(() => undefined);
    res.json({ success: true, message: '批量导入完成。', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: '批量导入失败。', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: '学生不存在。' });
    }

    await student.update(
      Object.fromEntries(
        Object.entries({
          name: req.body.name,
          major: req.body.major,
          class: req.body.class,
          email: req.body.email,
          phone: req.body.phone,
          grade: req.body.grade,
          advisor: req.body.advisor,
          researchDirection: req.body.researchDirection,
        }).filter(([, value]) => value !== undefined)
      )
    );

    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新学生失败。', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: '学生不存在。' });
    }
    await student.destroy();
    res.json({ success: true, message: '删除成功。' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除学生失败。', error: error.message });
  }
});

router.post('/topics/generate', async (req, res) => {
  try {
    const { studentId, interests = [], keywords = [] } = req.body;

    const student = await Student.findOne({ where: { studentId } });
    if (!student) {
      return res.status(404).json({ success: false, message: '学生不存在。' });
    }

    const direction = interests[0] || student.researchDirection || student.major;
    const generated = await generateTopicSuggestions(direction, keywords);
    const normalized = generated.slice(0, 5).map((item, index) => ({
      id: `${Date.now()}-${index}`,
      title: item.title,
      description: item.description || item.content || '',
      keywords,
      difficulty: ['简单', '中等', '困难'][index % 3],
      innovation: '良好',
      feasibility: '较高',
      expectedResults: item.expectedResults || '',
    }));

    res.json({ success: true, data: normalized, message: '选题建议生成成功。' });
  } catch (error) {
    console.error('generate topics failed:', error);
    res.status(500).json({ success: false, message: '生成选题建议失败。', error: error.message });
  }
});

router.post('/topic/submit', async (req, res) => {
  try {
    const { title, description, keywords = [], studentId } = req.body;
    if (!title || !studentId) {
      return res.status(400).json({ success: false, message: '选题标题和学生学号不能为空。' });
    }

    const student = await Student.findOne({ where: { studentId } });
    if (!student) {
      return res.status(404).json({ success: false, message: '学生不存在。' });
    }

    const topic = await Topic.create({
      studentId: student.id,
      title,
      description: description || '',
      direction: student.researchDirection || student.major,
      keywords,
      status: 'pending',
      feedback: '',
    });

    res.status(201).json({ success: true, data: topic, message: '选题提交成功，请等待教师审核。' });
  } catch (error) {
    console.error('submit topic failed:', error);
    res.status(500).json({ success: false, message: '提交选题失败。', error: error.message });
  }
});

export default router;
