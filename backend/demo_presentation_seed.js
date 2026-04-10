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
} from './src/models/index.js'

const DEMO_TEACHER_ID = 'T001'
const DEMO_STUDENT_IDS = ['S001', 'S002', 'S003', 'S004', 'S005', 'S006']
const TODAY = new Date().toISOString().slice(0, 10)
const NOW = new Date()

const DEMO_CONFIG = {
  S001: {
    focus: '毕业设计全过程辅导平台',
    topicStatus: 'approved',
    topicFeedback: '选题贴合系统展示场景，主线清晰，适合作为演示样例。',
    taskBookStatus: 'approved',
    taskBookFeedback: '任务分解完整，工作量安排合理，可以直接按计划推进。',
    proposalStatus: 'approved',
    proposalFeedback: '开题论证充分，技术路线明确，具备较好的展示完整度。',
    midtermStatus: 'submitted',
    midtermFeedback: '阶段成果已经成型，当前材料已提交，等待最终审核。',
    scoreBias: 8,
  },
  S002: {
    focus: '多轮问答评估',
    topicStatus: 'approved',
    topicFeedback: '选题方向明确，建议进一步强化量化评估指标。',
    taskBookStatus: 'rejected',
    taskBookFeedback: '任务书中的实验指标不够细化，需补充分组方案和评价口径。',
    proposalStatus: 'reviewing',
    proposalFeedback: '开题内容已进入审核环节，建议补充对比实验设计。',
    midtermStatus: 'submitted',
    midtermFeedback: '中期材料已提交，建议继续完善问题分析与数据说明。',
    scoreBias: -12,
  },
  S003: {
    focus: '协同开发辅助平台',
    topicStatus: 'pending',
    topicFeedback: '选题尚可，建议补充目标用户与预期使用场景后再确认。',
    taskBookStatus: 'submitted',
    taskBookFeedback: '任务书已提交，建议继续补充阶段里程碑的验收标准。',
    proposalStatus: 'rejected',
    proposalFeedback: '开题报告论证还不够充分，需要重写研究现状和技术路线部分。',
    midtermStatus: 'submitted',
    midtermFeedback: '中期进度基本可控，但仍需尽快补齐方案论证材料。',
    scoreBias: -6,
  },
  S004: {
    focus: '进度预测模型',
    topicStatus: 'approved',
    topicFeedback: '选题应用价值较高，结构完整，适合作为数据分析类演示样例。',
    taskBookStatus: 'approved',
    taskBookFeedback: '任务书逻辑清晰，节点安排合理，准予继续推进。',
    proposalStatus: 'approved',
    proposalFeedback: '开题质量较高，研究方法和结果预期较为成熟。',
    midtermStatus: 'approved',
    midtermFeedback: '中期成果稳定，数据分析与展示效果较好。',
    scoreBias: 10,
  },
  S005: {
    focus: '知识图谱资源推荐',
    topicStatus: 'submitted',
    topicFeedback: '选题已提交，建议继续强化资源组织逻辑和推荐链路描述。',
    taskBookStatus: 'submitted',
    taskBookFeedback: '任务书已提交，建议补充文献来源与阶段产出形式。',
    proposalStatus: 'reviewing',
    proposalFeedback: '开题正在审核，建议进一步补充知识图谱构建过程说明。',
    midtermStatus: 'submitted',
    midtermFeedback: '中期材料内容较完整，建议继续提升可视化展示效果。',
    scoreBias: 0,
  },
  S006: {
    focus: '课程画像选题推荐',
    topicStatus: 'approved',
    topicFeedback: '研究方向清晰，演示价值较好，适合作为推荐场景示例。',
    taskBookStatus: 'submitted',
    taskBookFeedback: '任务书已提交，建议补充推荐规则与评估指标的对应关系。',
    proposalStatus: 'reviewing',
    proposalFeedback: '开题报告进入审核阶段，建议增强创新点与可行性表述。',
    midtermStatus: 'submitted',
    midtermFeedback: '中期推进稳定，建议继续完善推荐效果展示和结果解释。',
    scoreBias: 4,
  },
}

const clampScore = (value) => Math.max(60, Math.min(96, value))

const baseScoreByStatus = (status) => {
  switch (status) {
    case 'approved':
      return 90
    case 'submitted':
      return 82
    case 'reviewing':
      return 80
    case 'pending':
      return 76
    case 'rejected':
      return 68
    default:
      return 74
  }
}

const buildSchedule = () => [
  '第1-2周：完成需求分析、资料收集与演示目标梳理。',
  '第3-5周：完成系统方案设计、核心流程实现与页面联调。',
  '第6-8周：补齐测试数据、完善文档材料并准备课堂演示脚本。',
]

const buildTaskBookEvaluation = (status, focus, scoreBias = 0) => ({
  score: clampScore(baseScoreByStatus(status) + scoreBias),
  strengths: ['主题聚焦明确', '任务安排可落地', `能够支撑${focus}相关演示`],
  suggestions:
    status === 'approved'
      ? ['继续保持阶段节奏', '提前准备答辩展示材料']
      : ['补充阶段验收标准', '细化任务之间的依赖关系'],
  issues:
    status === 'rejected'
      ? ['量化指标不足', '工作量说明不够充分']
      : ['后续仍需补充更细粒度的执行检查点'],
})

const buildProposalEvaluation = (status, focus, scoreBias = 0) => {
  const score = clampScore(baseScoreByStatus(status) + scoreBias + 2)
  return {
    overallScore: score,
    dimensionScores: {
      background: clampScore(score - 2),
      significance: clampScore(score - 1),
      researchStatus: clampScore(score - 5),
      researchContent: clampScore(score),
      researchMethods: clampScore(score - 3),
      innovation: clampScore(score - 4),
      feasibility: clampScore(score - 2),
    },
    strengths: ['研究主线清晰', '结构较完整', `${focus}场景与系统目标结合较好`],
    suggestions:
      status === 'approved'
        ? ['继续补强实验细节', '提前准备阶段汇报材料']
        : ['补充对比分析', '增强技术路线与数据支撑'],
    detailedAnalysis: {
      background: '背景交代完整，能够说明问题来源与应用场景。',
      significance: '课题具备一定理论与应用价值，适合课堂演示。',
      researchStatus: '研究现状部分还可以进一步按主题梳理。',
      researchContent: '研究内容分层清晰，能够支撑后续系统实现。',
      researchMethods: '方法路径基本合理，建议再补充评价指标设计。',
      innovation: '具备一定创新表达，但还可进一步突出差异化亮点。',
      feasibility: '整体可行性较好，实施条件和时间安排较为明确。',
    },
  }
}

const buildMidtermEvaluation = (status, focus, scoreBias = 0) => {
  const score = clampScore(baseScoreByStatus(status) + scoreBias + 1)
  const riskLevel = score >= 88 ? 'low' : score >= 78 ? 'medium' : 'high'
  return {
    overallScore: score,
    dimensionScores: {
      progress: clampScore(score),
      quality: clampScore(score - 2),
      planning: clampScore(score - 3),
      problemSolving: clampScore(score - 1),
      innovation: clampScore(score - 4),
      selfReflection: clampScore(score - 2),
    },
    strengths: ['阶段目标较明确', `${focus}相关成果已经具备初步展示效果`, '后续推进路径基本清晰'],
    suggestions:
      status === 'approved'
        ? ['继续沉淀材料并准备最终展示', '补齐论文写作与答辩素材']
        : ['强化阶段结果对照说明', '补充问题闭环与效果验证'],
    riskAssessment: {
      level: riskLevel,
      description:
        riskLevel === 'low'
          ? '当前进度整体平稳，适合直接用于课堂演示。'
          : riskLevel === 'medium'
            ? '当前进度可控，但仍需要继续跟进关键节点。'
            : '当前阶段仍存在一定风险，建议重点跟踪问题整改情况。',
      recommendations:
        riskLevel === 'low'
          ? ['继续优化展示细节', '同步完善论文材料']
          : ['细化下一阶段计划', '补充里程碑验收依据'],
    },
  }
}

const ensureRecord = async (Model, where, payload) => {
  const [record] = await Model.findOrCreate({
    where,
    defaults: payload,
  })

  await record.update(payload)
  return record
}

const buildTaskBookPayload = (student, topic, config) => {
  const schedule = buildSchedule()
  const draftContent = {
    title: topic.title,
    mainTasks: `1. 围绕“${topic.title}”完成需求梳理、方案设计与核心模块实现。\n2. 完成测试数据整理、结果验证与页面演示联调。\n3. 形成可用于课堂展示的任务书、阶段总结和答辩素材。`,
    purpose: `本课题围绕${config.focus}展开，重点解决毕业设计过程中的管理、展示和质量跟踪问题。`,
    mainContent: `1. 梳理业务流程与关键角色任务。\n2. 完成核心功能实现与状态流转。\n3. 通过测试数据验证方案可行性并整理演示材料。`,
    basicRequirements: '要求流程完整、材料规范、数据可回溯，并能稳定支撑演示操作。',
    priorFoundation: `${student.name}已完成相关课程学习，具备系统实现、数据整理和文档撰写基础。`,
    expectedOutcomes: '形成可演示原型、阶段性文档和论文写作素材。',
    schedule,
    references: [
      '[1] 高校毕业设计过程管理研究，2024。',
      `[2] ${config.focus}相关系统设计与实现，2025。`,
      '[3] 教育数字化场景下的智能辅助应用研究，2025。',
    ],
  }

  return {
    topicId: topic.id,
    content: `课题名称：${topic.title}\n\n主要任务：\n${draftContent.mainTasks}\n\n主要内容：\n${draftContent.mainContent}`,
    requirements: `研究目的：${draftContent.purpose}\n\n基本要求：${draftContent.basicRequirements}\n\n前期基础：${draftContent.priorFoundation}\n\n预期成果：${draftContent.expectedOutcomes}`,
    schedule,
    draftContent: JSON.stringify(draftContent),
    status: config.taskBookStatus,
    feedback: config.taskBookFeedback,
    aiEvaluation: JSON.stringify(buildTaskBookEvaluation(config.taskBookStatus, config.focus, config.scoreBias)),
    confirmedAt: config.taskBookStatus === 'approved' ? NOW : null,
  }
}

const buildProposalPayload = (student, topic, config) => {
  const background = `随着高校毕业设计过程管理逐步数字化，围绕“${topic.title}”构建一套兼顾流程支撑、材料沉淀和演示展示的解决方案，已经具有较强的现实意义。当前不少系统在阶段成果串联、状态跟踪和材料展示方面仍有不足，因此有必要结合${config.focus}场景进一步开展研究。`
  const objectives = `本课题计划围绕${config.focus}构建一套可落地、可展示的研究方案，重点完成需求分析、核心模块设计、数据组织与阶段性验证，并在此基础上形成适用于毕业设计过程展示的成果材料。`
  const methodology = `研究过程中将采用文献调研、业务流程分析、原型设计、功能实现与结果验证相结合的方法，确保方案既能满足毕业设计工作量要求，也能支撑课堂或答辩演示。`
  const expectedResults = '预期形成完整开题材料、核心系统原型、阶段验证结果和可直接复用的答辩展示素材。'
  const content = [
    `研究背景\n${background}`,
    `研究目标\n${objectives}`,
    `研究方法\n${methodology}`,
    `预期成果\n${expectedResults}`,
  ].join('\n\n')

  return {
    topicId: topic.id,
    content,
    researchBackground: background,
    researchObjectives: objectives,
    methodology,
    expectedResults,
    aiAnalysis: JSON.stringify(buildProposalEvaluation(config.proposalStatus, config.focus, config.scoreBias)),
    status: config.proposalStatus,
    feedback: config.proposalFeedback,
    submittedAt: NOW,
  }
}

const buildMidtermPayload = (student, topic, config) => {
  const progress = `${student.name}已围绕“${topic.title}”完成需求梳理、主要页面或模块实现、测试数据准备以及阶段性演示材料整理，当前整体推进情况稳定。`
  const problems =
    config.midtermStatus === 'approved'
      ? '当前主要问题集中在展示细节打磨和文档措辞统一，整体风险较低。'
      : '当前仍存在部分说明材料不够细、演示链路需要进一步优化等问题。'
  const solutions = '通过补充验证数据、统一页面文案、完善状态流转说明以及复盘关键节点，持续提升阶段成果的完整度和可展示性。'
  const achievements = `已形成与${config.focus}相关的阶段成果，包括核心流程样例、状态数据、文档材料和课堂演示脚本。`
  const keyComments = '下一阶段将继续优化展示效果，补齐论文正文材料，并完成最终汇报内容整理。'

  return {
    topicId: topic.id,
    progress,
    problems,
    solutions,
    achievements,
    keyComments,
    aiAnalysis: JSON.stringify(buildMidtermEvaluation(config.midtermStatus, config.focus, config.scoreBias)),
    status: config.midtermStatus,
    feedback: config.midtermFeedback,
    submittedAt: NOW,
  }
}

const ensureDemoTeacherAssignments = async (teacher, targetStudents) => {
  for (const student of targetStudents) {
    const existingRows = await Advisory.findAll({
      where: { studentId: student.id },
    })

    for (const row of existingRows) {
      if (row.teacherId === teacher.id) {
        await row.update({
          status: 'active',
          startDate: row.startDate || TODAY,
          endDate: null,
        })
      } else if (row.status === 'active') {
        await row.update({
          status: 'inactive',
          endDate: TODAY,
        })
      }
    }

    const [advisory] = await Advisory.findOrCreate({
      where: {
        teacherId: teacher.id,
        studentId: student.id,
      },
      defaults: {
        teacherId: teacher.id,
        studentId: student.id,
        startDate: TODAY,
        status: 'active',
      },
    })

    await advisory.update({
      status: 'active',
      startDate: advisory.startDate || TODAY,
      endDate: null,
    })

    await student.update({
      advisor: teacher.name,
    })
  }
}

const ensureTopicForStudent = async (student, config) => {
  let topic = await Topic.findOne({
    where: { studentId: student.id },
    order: [['updated_at', 'DESC']],
  })

  if (!topic) {
    topic = await Topic.create({
      studentId: student.id,
      title: `${config.focus}场景下的毕业设计辅助研究`,
      direction: '教育信息化',
      keywords: ['毕业设计', '演示样例', config.focus],
      description: `围绕${config.focus}构建一套支持展示、跟踪与材料沉淀的毕业设计辅助方案。`,
      status: config.topicStatus,
      feedback: config.topicFeedback,
      confirmedAt: config.topicStatus === 'approved' ? NOW : null,
    })
  }

  await topic.update({
    direction: topic.direction || '教育信息化',
    keywords: Array.isArray(topic.keywords) && topic.keywords.length > 0 ? topic.keywords : ['毕业设计', '演示样例', config.focus],
    description: topic.description || `围绕${config.focus}构建一套支持展示、跟踪与材料沉淀的毕业设计辅助方案。`,
    status: config.topicStatus,
    feedback: config.topicFeedback,
    confirmedAt: config.topicStatus === 'approved' ? NOW : null,
  })

  return topic
}

async function run() {
  const connected = await testConnection()
  if (!connected) {
    throw new Error('Database connection failed.')
  }

  const synced = await syncDatabase(false)
  if (!synced) {
    throw new Error('Database sync failed.')
  }

  const teacher = await Teacher.findOne({
    where: { teacherId: DEMO_TEACHER_ID },
  })

  if (!teacher) {
    throw new Error(`Teacher ${DEMO_TEACHER_ID} not found. Run "npm run seed" first.`)
  }

  const targetStudents = await Student.findAll({
    where: { studentId: DEMO_STUDENT_IDS },
    order: [['student_id', 'ASC']],
  })

  if (targetStudents.length !== DEMO_STUDENT_IDS.length) {
    throw new Error('Demo students are incomplete. Run "npm run seed" first.')
  }

  await ensureDemoTeacherAssignments(teacher, targetStudents)

  for (const student of targetStudents) {
    const config = DEMO_CONFIG[student.studentId]
    const topic = await ensureTopicForStudent(student, config)

    await ensureRecord(TaskBook, { topicId: topic.id }, buildTaskBookPayload(student, topic, config))
    await ensureRecord(Proposal, { topicId: topic.id }, buildProposalPayload(student, topic, config))
    await ensureRecord(MidtermReport, { topicId: topic.id }, buildMidtermPayload(student, topic, config))
  }

  console.log('Demo presentation data prepared.')
  console.log('Accounts:')
  console.log('- admin@gradbot.local / GradBot123!')
  console.log('- teacher@gradbot.local / GradBot123!')
  console.log('- student@gradbot.local / GradBot123!')
  console.log(`Teacher ${DEMO_TEACHER_ID} now manages: ${DEMO_STUDENT_IDS.join(', ')}`)
}

run()
  .catch((error) => {
    console.error('Demo presentation seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await sequelize.close()
  })
