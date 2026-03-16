import bcrypt from 'bcryptjs'
import {
  sequelize,
  testConnection,
  syncDatabase,
  Advisory,
  MidtermReport,
  Proposal,
  Student,
  TaskBook,
  Teacher,
  Topic,
  User,
} from './src/models/index.js'

const DEFAULT_PASSWORD = 'GradBot123!'

const teachers = [
  {
    teacherId: 'T001',
    name: '李明',
    email: 'teacher@gradbot.local',
    department: '计算机学院',
    title: '副教授',
    phone: '13800000001',
    researchFields: ['教育智能', '自然语言处理'],
    office: '信息楼 A302',
    officeHours: '周三 14:00-17:00',
  },
  {
    teacherId: 'T002',
    name: '王倩',
    email: 'wangqian@gradbot.local',
    department: '数据科学学院',
    title: '讲师',
    phone: '13800000011',
    researchFields: ['数据挖掘', '机器学习'],
    office: '实验楼 B410',
    officeHours: '周二 09:00-11:30',
  },
  {
    teacherId: 'T003',
    name: '陈涛',
    email: 'chentao@gradbot.local',
    department: '教育学院',
    title: '教授',
    phone: '13800000021',
    researchFields: ['学习分析', '教学设计'],
    office: '文科楼 C215',
    officeHours: '周四 15:00-17:30',
  },
]

const students = [
  {
    studentId: 'S001',
    name: '张晨',
    email: 'student@gradbot.local',
    department: '计算机学院',
    major: '软件工程',
    class: '软工 2201',
    grade: '2022',
    phone: '13800000002',
    advisor: '李明',
    researchDirection: '毕业设计过程智能辅导',
    teacherId: 'T001',
    topic: {
      title: '基于大模型的毕业设计全过程辅导系统研究与实现',
      direction: '教育智能化',
      keywords: ['毕业设计', '大模型', '智能辅导'],
      description: '构建覆盖选题、任务书、开题和中期检查的全过程辅导平台。',
      status: 'approved',
      feedback: '选题方向明确，技术路线可行。',
      taskBook: {
        content: '完成需求分析、系统设计、核心功能开发和联调测试。',
        requirements: '系统需覆盖学生端、教师端和管理员端主流程。',
        schedule: ['第 1-2 周：需求分析', '第 3-5 周：系统设计', '第 6-9 周：功能开发', '第 10 周：联调与文档整理'],
        status: 'submitted',
        feedback: '任务拆分合理，可继续推进。',
      },
      proposal: {
        content: '围绕毕业设计过程中的高频痛点，设计智能辅导平台。',
        researchBackground: '毕业设计指导资源有限，需要智能辅助工具提升效率。',
        researchObjectives: '搭建一个支持选题、任务书、开题和中期检查的智能平台。',
        methodology: '采用需求分析、系统设计、前后端开发和案例验证相结合的方法。',
        expectedResults: '形成完整系统、测试报告与毕业设计文档。',
        status: 'reviewing',
        feedback: '研究目标清晰，建议继续补充对比分析。',
      },
      midterm: {
        progress: '已完成需求分析、数据库设计和核心接口开发。',
        problems: '教师评审流程和前端适配仍需继续优化。',
        solutions: '统一接口模型，补齐状态流转和详情展示。',
        achievements: '已完成后端路由整理、前端主流程联通和测试数据接入。',
        keyComments: '下一阶段将继续完善管理员端和质量预警能力。',
        status: 'submitted',
        feedback: '中期进展稳定，继续保持。',
      },
    },
  },
  {
    studentId: 'S002',
    name: '刘洋',
    email: 'liuyang@gradbot.local',
    department: '计算机学院',
    major: '人工智能',
    class: '智科 2202',
    grade: '2022',
    phone: '13800000003',
    advisor: '李明',
    researchDirection: '智能问答评估',
    teacherId: 'T001',
    topic: {
      title: '面向毕业设计问答场景的多轮交互评估研究',
      direction: '智能问答',
      keywords: ['问答系统', '多轮对话', '评估'],
      description: '研究多轮问答在毕业设计指导中的适配和质量评估。',
      status: 'approved',
      feedback: '研究问题明确，但需要尽快补齐方案论证。',
      taskBook: {
        content: '完成数据收集、评估指标设计与实验平台开发。',
        requirements: '需明确实验样本、评价方法与时间节点。',
        schedule: ['第 1-2 周：调研', '第 3-4 周：方案设计', '第 5-8 周：实验开发'],
        status: 'rejected',
        feedback: '任务书指标不够细化，实验设计缺少量化标准。',
      },
    },
  },
  {
    studentId: 'S003',
    name: '赵悦',
    email: 'zhaoyue@gradbot.local',
    department: '计算机学院',
    major: '软件工程',
    class: '软工 2203',
    grade: '2022',
    phone: '13800000004',
    advisor: '李明',
    researchDirection: '协同开发工具',
    teacherId: 'T001',
  },
  {
    studentId: 'S004',
    name: '孙可',
    email: 'sunke@gradbot.local',
    department: '数据科学学院',
    major: '数据科学与大数据技术',
    class: '数科 2201',
    grade: '2022',
    phone: '13800000005',
    advisor: '王倩',
    researchDirection: '学业过程分析',
    teacherId: 'T002',
    topic: {
      title: '基于学习行为数据的毕业设计进度预测模型研究',
      direction: '学习分析',
      keywords: ['学习分析', '进度预测', '数据挖掘'],
      description: '利用毕业设计过程数据建立进度预测与预警模型。',
      status: 'approved',
      feedback: '选题价值较高，可作为示范项目。',
      taskBook: {
        content: '完成数据指标设计、预测模型构建与可视化模块开发。',
        requirements: '需形成完整数据处理流程和效果评估方案。',
        schedule: ['第 1-3 周：数据准备', '第 4-6 周：模型训练', '第 7-9 周：可视化开发'],
        status: 'approved',
        feedback: '任务书结构完整。',
      },
      proposal: {
        content: '从行为数据中提取特征，构建毕业设计阶段进度预测模型。',
        researchBackground: '传统进度管理难以及时发现风险，数据驱动方式更适合持续监测。',
        researchObjectives: '形成进度预测模型与预警机制，实现高风险学生识别。',
        methodology: '采用特征工程、分类模型训练和效果验证相结合的方法。',
        expectedResults: '形成预测模型、预警看板和论文分析结果。',
        status: 'approved',
        feedback: '方案成熟，可以进入实现阶段。',
      },
      midterm: {
        progress: '已完成数据清洗、模型初步训练和可视化雏形。',
        problems: '样本分布不均衡，需要继续优化特征处理。',
        solutions: '补充采样策略并扩展特征维度。',
        achievements: '已形成初版风险预测仪表盘。',
        keyComments: '下一步继续优化模型表现并完善论文撰写。',
        status: 'submitted',
        feedback: '进展较好，质量稳定。',
      },
    },
  },
  {
    studentId: 'S005',
    name: '周婷',
    email: 'zhouting@gradbot.local',
    department: '数据科学学院',
    major: '数据科学与大数据技术',
    class: '数科 2301',
    grade: '2023',
    phone: '13800000006',
    advisor: '王倩',
    researchDirection: '知识图谱推荐',
    teacherId: 'T002',
    topic: {
      title: '面向毕业设计资源推荐的知识图谱构建研究',
      direction: '知识图谱',
      keywords: ['知识图谱', '推荐系统', '毕业设计'],
      description: '构建毕业设计资源知识图谱，为学生提供个性化推荐。',
      status: 'submitted',
      feedback: '等待教师确认。',
    },
  },
  {
    studentId: 'S006',
    name: '何凡',
    email: 'hefan@gradbot.local',
    department: '数据科学学院',
    major: '人工智能',
    class: '智科 2301',
    grade: '2023',
    phone: '13800000007',
    advisor: '王倩',
    researchDirection: '课程画像分析',
    teacherId: 'T002',
    topic: {
      title: '基于课程画像的毕业设计选题推荐方法研究',
      direction: '推荐系统',
      keywords: ['课程画像', '选题推荐', '智能分析'],
      description: '结合课程画像为学生匹配更适合的毕业设计选题。',
      status: 'approved',
      feedback: '研究方向明确，可继续推进任务书。',
      taskBook: {
        content: '完成画像建模、推荐规则设计和原型系统开发。',
        requirements: '需补齐评价指标与实验数据来源。',
        schedule: ['第 1-2 周：画像建模', '第 3-5 周：推荐规则', '第 6-8 周：系统原型'],
        status: 'submitted',
        feedback: '建议进一步细化实验评估方案。',
      },
    },
  },
  {
    studentId: 'S007',
    name: '杨帆',
    email: 'yangfan@gradbot.local',
    department: '教育学院',
    major: '教育技术学',
    class: '教技 2201',
    grade: '2022',
    phone: '13800000008',
    advisor: '陈涛',
    researchDirection: '教学反馈可视化',
    teacherId: 'T003',
    topic: {
      title: '毕业设计指导反馈的可视化呈现与交互设计研究',
      direction: '教育技术',
      keywords: ['可视化', '反馈系统', '交互设计'],
      description: '围绕指导反馈的展示方式，设计提升理解效率的交互界面。',
      status: 'approved',
      feedback: '有较强应用场景，建议强化实证部分。',
      taskBook: {
        content: '完成需求访谈、可视化方案设计和交互原型开发。',
        requirements: '明确用户画像和评价问卷设计。',
        schedule: ['第 1-3 周：访谈调研', '第 4-6 周：原型设计', '第 7-9 周：可用性测试'],
        status: 'approved',
        feedback: '结构清晰。',
      },
      proposal: {
        content: '通过可视化方式提升学生对教师反馈的理解和执行效率。',
        researchBackground: '当前反馈内容分散、层次不清，影响学生使用效果。',
        researchObjectives: '设计兼顾直观性和交互性的反馈呈现方案。',
        methodology: '采用用户研究、原型设计和可用性测试方法。',
        expectedResults: '形成一套反馈可视化原型和评估结论。',
        status: 'reviewing',
        feedback: '建议补充更多对照研究。',
      },
    },
  },
  {
    studentId: 'S008',
    name: '吴迪',
    email: 'wudi@gradbot.local',
    department: '教育学院',
    major: '教育技术学',
    class: '教技 2202',
    grade: '2022',
    phone: '13800000009',
    advisor: '陈涛',
    researchDirection: '教学质量评价',
    teacherId: 'T003',
    topic: {
      title: '基于智能分析的毕业设计指导质量评价模型研究',
      direction: '教学评价',
      keywords: ['教学评价', '智能分析', '质量模型'],
      description: '构建指导质量评价指标体系并进行模型验证。',
      status: 'approved',
      feedback: '选题合理，但后续执行要加强。',
      taskBook: {
        content: '完成评价指标梳理、模型设计和验证实验。',
        requirements: '需明确样本来源和评价标准。',
        schedule: ['第 1-2 周：指标梳理', '第 3-5 周：模型设计', '第 6-8 周：验证实验'],
        status: 'approved',
        feedback: '任务书已通过。',
      },
      proposal: {
        content: '构建毕业设计指导质量评价指标体系并验证其有效性。',
        researchBackground: '指导质量评价标准分散，缺少统一量化模型。',
        researchObjectives: '形成可推广的质量评价指标体系和分析方法。',
        methodology: '采用问卷调查、指标建模和统计分析相结合的方法。',
        expectedResults: '形成评价模型、分析报告和系统原型。',
        status: 'approved',
        feedback: '已通过开题。',
      },
      midterm: {
        progress: '前期调研完成，但实验推进较慢。',
        problems: '样本回收不足，关键指标验证不充分。',
        solutions: '扩大样本范围并重新安排实验节奏。',
        achievements: '完成指标体系初稿和部分问卷分析。',
        keyComments: '需要集中时间补齐实验数据和结果分析。',
        status: 'failed',
        feedback: '当前中期质量不达标，需要重点关注。',
      },
    },
  },
]

async function upsertUser(where, payload) {
  const existing = await User.findOne({ where })
  if (existing) {
    await existing.update(payload)
    return existing
  }
  return User.create(payload)
}

async function upsertTeacher(payload) {
  const [teacher] = await Teacher.findOrCreate({
    where: { teacherId: payload.teacherId },
    defaults: payload,
  })
  await teacher.update(payload)
  return teacher
}

async function upsertStudent(payload) {
  const [student] = await Student.findOrCreate({
    where: { studentId: payload.studentId },
    defaults: payload,
  })
  await student.update(payload)
  return student
}

async function ensureTopicBundle(student, topicPayload) {
  if (!topicPayload) {
    return null
  }

  const [topic] = await Topic.findOrCreate({
    where: { studentId: student.id, title: topicPayload.title },
    defaults: {
      studentId: student.id,
      title: topicPayload.title,
      direction: topicPayload.direction,
      keywords: topicPayload.keywords,
      description: topicPayload.description,
      status: topicPayload.status,
      feedback: topicPayload.feedback,
      confirmedAt: ['approved', 'reviewed'].includes(topicPayload.status) ? new Date() : null,
    },
  })

  await topic.update({
    studentId: student.id,
    title: topicPayload.title,
    direction: topicPayload.direction,
    keywords: topicPayload.keywords,
    description: topicPayload.description,
    status: topicPayload.status,
    feedback: topicPayload.feedback,
    confirmedAt: ['approved', 'reviewed'].includes(topicPayload.status) ? new Date() : null,
  })

  if (topicPayload.taskBook) {
    const [taskBook] = await TaskBook.findOrCreate({
      where: { topicId: topic.id },
      defaults: {
        topicId: topic.id,
        ...topicPayload.taskBook,
        confirmedAt: ['approved', 'reviewed'].includes(topicPayload.taskBook.status) ? new Date() : null,
      },
    })

    await taskBook.update({
      topicId: topic.id,
      ...topicPayload.taskBook,
      confirmedAt: ['approved', 'reviewed'].includes(topicPayload.taskBook.status) ? new Date() : null,
    })
  }

  if (topicPayload.proposal) {
    const [proposal] = await Proposal.findOrCreate({
      where: { topicId: topic.id },
      defaults: {
        topicId: topic.id,
        ...topicPayload.proposal,
        submittedAt: new Date(),
      },
    })

    await proposal.update({
      topicId: topic.id,
      ...topicPayload.proposal,
      submittedAt: new Date(),
    })
  }

  if (topicPayload.midterm) {
    const [midterm] = await MidtermReport.findOrCreate({
      where: { topicId: topic.id },
      defaults: {
        topicId: topic.id,
        ...topicPayload.midterm,
        submittedAt: new Date(),
      },
    })

    await midterm.update({
      topicId: topic.id,
      ...topicPayload.midterm,
      submittedAt: new Date(),
    })
  }

  return topic
}

async function cleanExistingSeedData(studentIds, teacherIds, adminEmails) {
  const studentRows = await Student.findAll({ where: { studentId: studentIds } })
  const studentPkList = studentRows.map((item) => item.id)

  if (studentPkList.length > 0) {
    const topics = await Topic.findAll({ where: { studentId: studentPkList } })
    const topicIds = topics.map((item) => item.id)

    if (topicIds.length > 0) {
      await MidtermReport.destroy({ where: { topicId: topicIds } })
      await Proposal.destroy({ where: { topicId: topicIds } })
      await TaskBook.destroy({ where: { topicId: topicIds } })
      await Topic.destroy({ where: { id: topicIds } })
    }

    await Advisory.destroy({ where: { studentId: studentPkList } })
  }

  const teacherRows = await Teacher.findAll({ where: { teacherId: teacherIds } })
  const teacherPkList = teacherRows.map((item) => item.id)
  if (teacherPkList.length > 0) {
    await Advisory.destroy({ where: { teacherId: teacherPkList } })
  }

  await Student.destroy({ where: { studentId: studentIds } })
  await Teacher.destroy({ where: { teacherId: teacherIds } })
  await User.destroy({
    where: {
      email: [
        ...adminEmails,
        ...teachers.map((item) => item.email),
        ...students.map((item) => item.email),
      ],
    },
  })
}

async function seed() {
  const connected = await testConnection()
  if (!connected) {
    throw new Error('Database connection failed.')
  }

  const synced = await syncDatabase(false)
  if (!synced) {
    throw new Error('Database sync failed.')
  }

  const password = await bcrypt.hash(DEFAULT_PASSWORD, 10)

  await cleanExistingSeedData(
    students.map((item) => item.studentId),
    teachers.map((item) => item.teacherId),
    ['admin@gradbot.local'],
  )

  const adminUser = await upsertUser(
    { email: 'admin@gradbot.local' },
    {
      name: '系统管理员',
      email: 'admin@gradbot.local',
      password,
      role: 'admin',
      department: '教务处',
      phone: '13800000000',
      isActive: true,
    },
  )

  const teacherEntityMap = new Map()

  for (const teacherItem of teachers) {
    await upsertUser(
      { email: teacherItem.email },
      {
        name: teacherItem.name,
        email: teacherItem.email,
        password,
        role: 'teacher',
        teacherId: teacherItem.teacherId,
        department: teacherItem.department,
        phone: teacherItem.phone,
        title: teacherItem.title,
        researchFields: teacherItem.researchFields,
        office: teacherItem.office,
        officeHours: teacherItem.officeHours,
        isActive: true,
      },
    )

    const teacher = await upsertTeacher(teacherItem)
    teacherEntityMap.set(teacherItem.teacherId, teacher)
  }

  for (const studentItem of students) {
    await upsertUser(
      { email: studentItem.email },
      {
        name: studentItem.name,
        email: studentItem.email,
        password,
        role: 'student',
        studentId: studentItem.studentId,
        department: studentItem.department,
        major: studentItem.major,
        class: studentItem.class,
        phone: studentItem.phone,
        grade: studentItem.grade,
        advisor: studentItem.advisor,
        researchDirection: studentItem.researchDirection,
        isActive: true,
      },
    )

    const student = await upsertStudent({
      studentId: studentItem.studentId,
      name: studentItem.name,
      department: studentItem.department,
      major: studentItem.major,
      class: studentItem.class,
      phone: studentItem.phone,
      email: studentItem.email,
      grade: studentItem.grade,
      advisor: studentItem.advisor,
      researchDirection: studentItem.researchDirection,
    })

    const teacher = teacherEntityMap.get(studentItem.teacherId)
    await Advisory.create({
      teacherId: teacher.id,
      studentId: student.id,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: null,
      status: 'active',
    })

    await ensureTopicBundle(student, studentItem.topic)
  }

  console.log('Seed completed.')
  console.log('Admin:', adminUser.email, DEFAULT_PASSWORD)
  console.log('Teachers:')
  teachers.forEach((item) => console.log(`- ${item.email} ${DEFAULT_PASSWORD}`))
  console.log('Students:')
  students.forEach((item) => console.log(`- ${item.email} ${DEFAULT_PASSWORD}`))
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await sequelize.close()
  })
