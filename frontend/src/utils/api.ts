import axios from 'axios'
import { message } from 'antd'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

type RecordLike = Record<string, any>

interface CurrentUser {
  id?: number
  name?: string
  email?: string
  role?: 'student' | 'teacher' | 'admin'
  studentId?: string
  teacherId?: string
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    const errorMessage = error.response?.data?.message || error.response?.data?.error

    if (status === 401) {
      message.error(errorMessage || '登录已失效，请重新登录。')
    } else if (status === 403) {
      message.error(errorMessage || '当前账号没有权限执行该操作。')
    } else if (status >= 500) {
      message.error(errorMessage || '服务器异常，请稍后再试。')
    } else if (errorMessage) {
      message.error(errorMessage)
    }

    return Promise.reject(error)
  },
)

const getCurrentUser = (): CurrentUser | null => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const unwrapData = <T = any>(response: any): T => {
  if (response && typeof response === 'object' && 'data' in response && response.data !== undefined) {
    return response.data as T
  }
  return response as T
}

const parseJsonString = <T = any>(value: any, fallback: T): T => {
  if (!value) {
    return fallback
  }
  if (typeof value === 'object') {
    return value as T
  }
  try {
    return JSON.parse(String(value)) as T
  } catch {
    return fallback
  }
}

const ensureArray = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(/[,\n，；;]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

const normalizeStatus = (status?: string) => {
  switch (status) {
    case 'confirmed':
    case 'reviewed':
      return 'approved'
    case 'submitted':
    case 'reviewing':
      return 'pending'
    default:
      return status || 'draft'
  }
}

const getPreferredStudentIdentifier = (candidate?: string) => {
  const user = getCurrentUser()
  return user?.role === 'student' && user.studentId ? user.studentId : candidate
}

const getPreferredTeacherIdentifier = (candidate?: string) => {
  const user = getCurrentUser()
  return user?.role === 'teacher' && user.teacherId ? user.teacherId : candidate
}

const requireTeacherIdentifier = (candidate?: string) => {
  const identifier = getPreferredTeacherIdentifier(candidate)
  if (!identifier) {
    throw new Error('缺少教师标识。')
  }
  return identifier
}

const readStudentRecord = async (studentId?: string) => {
  const identifier = getPreferredStudentIdentifier(studentId)
  if (!identifier) {
    throw new Error('缺少学生标识。')
  }

  const response = await api.get(`/students/${identifier}`)
  return unwrapData<any>(response)
}

const readStudentStatus = async (studentId?: string) => {
  const identifier = getPreferredStudentIdentifier(studentId)
  if (!identifier) {
    throw new Error('缺少学生标识。')
  }

  return api.get(`/students/${identifier}/status`)
}

const getActiveTopic = async (studentId?: string) => {
  const identifier = getPreferredStudentIdentifier(studentId)
  const status = await readStudentStatus(studentId)
  const statusData = unwrapData<any>(status)
  if (statusData?.topic) {
    if (statusData.topic.studentId || statusData.topic.student_id) {
      return statusData.topic
    }

    return {
      ...statusData.topic,
      studentId: identifier,
    }
  }

  const student = await readStudentRecord(studentId)
  const topics = Array.isArray(student?.topics) ? student.topics : []
  return topics[0] || null
}

const requireStudentIdentifier = async (candidate?: string) => {
  const identifier = getPreferredStudentIdentifier(candidate)
  if (identifier) {
    return identifier
  }

  const student = await readStudentRecord(candidate)
  if (student?.studentId) {
    return student.studentId
  }

  throw new Error('缺少学生标识。')
}

const AI_DEBUG_STORAGE_KEY = 'gradbot-ai-debug'

const setAiDebugInfo = (payload: Record<string, unknown>) => {
  try {
    localStorage.setItem(
      AI_DEBUG_STORAGE_KEY,
      JSON.stringify({
        updatedAt: new Date().toISOString(),
        ...payload,
      }),
    )
    window.dispatchEvent(new Event('gradbot-ai-debug-updated'))
  } catch {
    // ignore debug persistence errors
  }
}

const scoreByLength = (text: string, tiers: number[]) => {
  const length = text.trim().length
  if (length >= tiers[2]) return 92
  if (length >= tiers[1]) return 84
  if (length >= tiers[0]) return 76
  return 68
}

const buildProposalEvaluation = (proposal: any) => {
  const text = [proposal.content, proposal.researchBackground, proposal.researchObjectives, proposal.methodology, proposal.expectedResults]
    .filter(Boolean)
    .join(' ')

  const overallScore = scoreByLength(text, [200, 500, 900])

  return {
    overallScore,
    dimensionScores: {
      background: Math.max(overallScore - 4, 60),
      significance: Math.max(overallScore - 2, 62),
      researchStatus: Math.max(overallScore - 6, 58),
      researchContent: overallScore,
      researchMethods: Math.max(overallScore - 3, 60),
      innovation: Math.max(overallScore - 5, 58),
      feasibility: Math.max(overallScore - 1, 62),
    },
    suggestions: ['建议补充文献综述层次', '建议细化技术路线与实验方案'],
    issues: overallScore >= 80 ? ['可继续强化创新点表达'] : ['研究方案描述还不够充分'],
    strengths: ['选题方向明确', '研究目标具备一定可执行性'],
    detailedAnalysis: {
      background: '背景交代基本完整，可继续增强问题驱动性。',
      significance: '研究意义较明确，建议进一步突出应用价值。',
      researchStatus: '文献梳理建议按主题展开，增强对比分析。',
      researchContent: '研究内容主线清晰，可继续细化子任务。',
      researchMethods: '方法路径基本清楚，建议增加可验证指标。',
      innovation: '创新点已有雏形，建议强化差异化表达。',
      feasibility: '整体可行，但时间安排与资源条件仍可更细化。',
    },
  }
}

const buildMidtermEvaluation = (report: any) => {
  const text = [report.progress, report.achievements, report.problems, report.solutions, report.keyComments]
    .filter(Boolean)
    .join(' ')

  const overallScore = scoreByLength(text, [160, 360, 720])

  return {
    overallScore,
    dimensionScores: {
      progress: overallScore,
      quality: Math.max(overallScore - 3, 60),
      planning: Math.max(overallScore - 4, 60),
      problemSolving: Math.max(overallScore - 2, 60),
      innovation: Math.max(overallScore - 5, 58),
      selfReflection: Math.max(overallScore - 1, 62),
    },
    suggestions: ['建议量化阶段成果', '建议补充后续计划的时间节点'],
    issues: overallScore >= 80 ? ['继续保持进度并加强总结沉淀'] : ['当前进展表述仍较粗略，需要补充实证内容'],
    strengths: ['阶段工作连续推进', '已形成一定成果沉淀'],
    detailedAnalysis: {
      progress: '进度说明基本清晰，建议增加与原计划的对照。',
      quality: '当前成果质量尚可，建议补充验证结论。',
      planning: '后续计划基本明确，可进一步细化每周任务。',
      problemSolving: '问题分析较直接，建议补充解决路径成效。',
      innovation: '阶段性创新表达仍有提升空间。',
      selfReflection: '自评较完整，建议增加风险预判。',
    },
    riskAssessment: {
      level: overallScore >= 85 ? 'low' : overallScore >= 75 ? 'medium' : 'high',
      description: overallScore >= 85 ? '整体风险较低，项目推进稳定。' : '当前进展可控，但需持续跟进关键节点。',
      recommendations: ['按计划复盘阶段任务', '尽早准备后续论文撰写材料'],
    },
  }
}

void buildProposalEvaluation
void buildMidtermEvaluation

const mapTopicForTeacher = (topic: any) => ({
  id: String(topic.id),
  title: topic.title || '未命名选题',
  description: topic.description || '',
  keywords: ensureArray(topic.keywords),
  studentId: topic.student?.studentId || '',
  studentName: topic.student?.name || '未分配学生',
  studentMajor: topic.student?.major || '',
  status: normalizeStatus(topic.status),
  submitTime: topic.updatedAt || topic.createdAt || new Date().toISOString(),
  feedback: topic.feedback || '',
  difficulty: '中等',
  innovation: '较好',
  feasibility: '较高',
})

const formatTaskBookReference = (reference: any) => {
  if (typeof reference === 'string') {
    return reference.trim()
  }

  const author = String(reference?.author || '').trim()
  const title = String(reference?.title || '').trim()
  const source = String(reference?.source || '').trim()
  const year = String(reference?.year || '').trim()

  return [author, title, source, year].filter(Boolean).join('. ')
}

const formatTaskBookSchedule = (value: any) => {
  if (!Array.isArray(value)) {
    return ensureArray(value).join('\n')
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim()
      }

      if (item?.stage || item?.time || item?.content || item?.steps) {
        const stage = String(item?.stage || '').trim()
        const time = String(item?.time || '').trim()
        const content = String(item?.content || '').trim()
        const steps = ensureArray(item?.steps)
        const lines = [
          stage,
          time ? `时间：${time}` : '',
          content ? `内容：${content}` : '',
          ...steps.map((step, index) => `${index + 1}. ${step}`),
        ].filter(Boolean)
        return lines.join('\n')
      }

      const phase = String(item?.phase || '').trim()
      const task = String(item?.task || '').trim()
      const deadline = String(item?.deadline || '').trim()
      return [phase, task, deadline].filter(Boolean).join('：')
    })
    .filter(Boolean)
    .join('\n\n')
}

const parseTaskBookSchedule = (value: any) => {
  if (Array.isArray(value)) {
    return value
  }

  return ensureArray(value).map((item) => {
    const parts = String(item).split('：')
    if (parts.length >= 3) {
      const [phase, task, ...deadlineParts] = parts
      return {
        phase: phase.trim(),
        task: task.trim(),
        deadline: deadlineParts.join('：').trim(),
      }
    }

    return {
      phase: '',
      task: String(item).trim(),
      deadline: '',
    }
  })
}

const mapTaskBookForStudent = (taskBook: any, topicTitle = '') => {
  const draft = parseJsonString<RecordLike>(taskBook.draftContent, {})
  const references = Array.isArray(draft.references) ? draft.references.map(formatTaskBookReference).filter(Boolean) : []
  const schedule = draft.schedule || taskBook.schedule || []

  return {
    id: String(taskBook.id),
    title: draft.title || topicTitle || '毕业设计任务书',
    researchPurpose: draft.mainTasks || taskBook.content || '',
    researchSignificance: draft.purpose || '',
    researchContent: draft.mainContent || '',
    researchMethods: draft.basicRequirements || '',
    priorFoundation: draft.priorFoundation || '',
    expectedOutcomes: draft.expectedOutcomes || '',
    progressSchedule: formatTaskBookSchedule(schedule),
    references,
    status: normalizeStatus(taskBook.status),
    feedback: taskBook.feedback || '',
    createdAt: taskBook.createdAt,
    updatedAt: taskBook.updatedAt,
  }
}

const mapProposalForStudent = (proposal: any, topicTitle = '') => ({
  id: String(proposal.id),
  title: topicTitle || '毕业设计开题报告',
  researchBackground: proposal.researchBackground || proposal.content || '',
  researchSignificance: proposal.feedback || '',
  literatureReview: '',
  researchObjectives: proposal.researchObjectives || '',
  researchContent: proposal.content || '',
  researchMethods: proposal.methodology || '',
  expectedOutcomes: proposal.expectedResults || '',
  innovationPoints: '',
  feasibilityAnalysis: '',
  workPlan: '',
  references: [] as string[],
  status: normalizeStatus(proposal.status),
  feedback: proposal.feedback || '',
  createdAt: proposal.createdAt,
  updatedAt: proposal.updatedAt,
})

const mapMidtermForStudent = (report: any, topicTitle = '', studentName = '', studentCode = '') => ({
  id: String(report.id),
  title: `${topicTitle || '毕业设计'}中期报告`,
  studentName,
  studentId: studentCode,
  supervisor: '',
  topic: topicTitle,
  progressSummary: report.progress || '',
  completedWork: ensureArray(report.achievements),
  currentStage: report.progress || '',
  nextStagePlan: report.keyComments || '',
  problemsEncountered: report.problems || '',
  solutions: report.solutions || '',
  achievements: report.achievements || '',
  selfEvaluation: report.feedback || '',
  supervisorFeedback: report.feedback || '',
  overallProgress: report.progress ? 65 : 0,
  stageProgress: {
    literature: 70,
    methodology: 60,
    experiment: 55,
    writing: 45,
  },
  status: normalizeStatus(report.status),
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
})

const readTextFile = async (file: File) => {
  if (file.type.includes('text')) {
    return file.text()
  }
  return `已上传文件：${file.name}`
}

export const studentAPI = {
  getStatus: async (studentId: string): Promise<any> => readStudentStatus(studentId),

  getProfile: async (): Promise<any> => {
    const response = await api.get('/students/profile')
    return unwrapData(response)
  },

  updateProfile: async (profileData: RecordLike): Promise<any> => {
    const response = await api.put('/students/profile', profileData)
    return unwrapData(response)
  },

  uploadAvatar: async (formData: FormData): Promise<any> => {
    const file = formData.get('avatar')
    if (!(file instanceof File)) {
      throw new Error('缺少头像文件。')
    }

    const reader = new FileReader()
    const avatar = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('头像读取失败。'))
      reader.readAsDataURL(file)
    })

    await api.put('/students/profile', { avatar })
    return { success: true, url: avatar }
  },

  generateTopics: async (studentId: string, interests: string[], keywords: string[]): Promise<any> => {
    const identifier = await requireStudentIdentifier(studentId)
    const request = {
      action: 'generateTopics',
      studentId: identifier,
      topicId: null,
      interests,
      keywords,
    }
    setAiDebugInfo({ request })

    try {
      const response: any = await api.post('/students/topics/generate', {
        studentId: identifier,
        interests,
        keywords,
      })
      setAiDebugInfo({
        request,
        response: {
          status: 200,
          success: response?.success,
          message: response?.message || null,
          dataCount: Array.isArray(response?.data) ? response.data.length : null,
        },
      })
      return response
    } catch (error: any) {
      setAiDebugInfo({
        request,
        error: {
          status: error?.response?.status || null,
          message: error?.response?.data?.message || error?.message || 'unknown error',
        },
      })
      throw error
    }
  },

  submitTopic: async (topicData: RecordLike): Promise<any> =>
    api.post('/students/topic/submit', {
      ...topicData,
      studentId: getPreferredStudentIdentifier(topicData.studentId),
    }),

  getTaskBook: async (studentId: string): Promise<any> => {
    const topic = await getActiveTopic(studentId)
    const identifier = await requireStudentIdentifier(studentId)
    if (!topic?.id) {
      return { success: true, data: null }
    }

    const response = await api.get('/taskbooks', { params: { studentId: identifier } })
    const taskBook = unwrapData<any[]>(response)?.[0]
    return { success: true, data: taskBook ? mapTaskBookForStudent(taskBook, topic.title) : null }
  },

  generateTaskBook: async (studentId: string, _topicId?: string): Promise<any> => {
    const topic = await getActiveTopic(studentId)
    const identifier = await requireStudentIdentifier(studentId)
    if (!topic?.id) {
      throw new Error('请先完成选题申报。')
    }

    const request = {
      action: 'generateTaskBook',
      studentId: identifier,
      topicId: topic.id,
    }
    setAiDebugInfo({ request })

    try {
      const response: any = await api.post('/taskbooks/generate', {
        studentId: identifier,
        topicId: topic.id,
      })

      setAiDebugInfo({
        request,
        response: {
          status: 200,
          success: response?.success,
          message: response?.message || null,
          dataId: unwrapData<any>(response)?.id || null,
        },
      })

      return { success: true, data: mapTaskBookForStudent(unwrapData(response), topic.title) }
    } catch (error: any) {
      setAiDebugInfo({
        request,
        error: {
          status: error?.response?.status || null,
          message: error?.response?.data?.message || error?.message || 'unknown error',
        },
      })
      throw error
    }
  },

  saveTaskBookDraft: async (studentId: string, draftData: RecordLike): Promise<any> => {
    const current = await studentAPI.getTaskBook(studentId)
    const topic = await getActiveTopic(studentId)
    if (!topic?.id) {
      throw new Error('请先完成选题申报。')
    }

    const references = ensureArray(draftData.references)
    const schedule = parseTaskBookSchedule(draftData.progressSchedule)
    const payload = {
      topicId: topic.id,
      content: [
        draftData.researchPurpose ? `主要任务\n${draftData.researchPurpose}` : '',
        draftData.researchSignificance ? `目的\n${draftData.researchSignificance}` : '',
        draftData.researchContent ? `主要内容\n${draftData.researchContent}` : '',
      ]
        .filter(Boolean)
        .join('\n\n'),
      requirements: [
        draftData.researchMethods ? `基本要求\n${draftData.researchMethods}` : '',
        draftData.priorFoundation ? `前期基础\n${draftData.priorFoundation}` : '',
        draftData.expectedOutcomes ? `预期成果\n${draftData.expectedOutcomes}` : '',
      ]
        .filter(Boolean)
        .join('\n\n'),
      schedule,
      draftContent: JSON.stringify({
        title: draftData.title || topic.title || '毕业设计任务书',
        mainTasks: draftData.researchPurpose || '',
        purpose: draftData.researchSignificance || '',
        mainContent: draftData.researchContent || '',
        basicRequirements: draftData.researchMethods || '',
        priorFoundation: draftData.priorFoundation || '',
        expectedOutcomes: draftData.expectedOutcomes || '',
        schedule,
        references,
      }),
      status: 'draft',
    }

    if (current.data?.id) {
      await api.put(`/taskbooks/${current.data.id}`, payload)
    } else {
      await api.post('/taskbooks', payload)
    }

    return { success: true }
  },

  submitTaskBook: async (studentId: string, taskBookData: RecordLike): Promise<any> => {
    const current = await studentAPI.getTaskBook(studentId)
    await studentAPI.saveTaskBookDraft(studentId, taskBookData)
    const refreshed = current.data?.id ? current : await studentAPI.getTaskBook(studentId)

    if (refreshed.data?.id) {
      await api.put(`/taskbooks/${refreshed.data.id}`, { status: 'submitted' })
    }

    return { success: true }
  },

  getProposal: async (studentId: string): Promise<any> => {
    const topic = await getActiveTopic(studentId)
    const identifier = await requireStudentIdentifier(studentId)
    if (!topic?.id) {
      return { success: true, data: null }
    }

    const response = await api.get('/proposals', { params: { studentId: identifier } })
    const proposal = unwrapData<any[]>(response)?.[0]
    return { success: true, data: proposal ? mapProposalForStudent(proposal, topic.title) : null }
  },

  generateProposal: async (studentId: string, _topicId?: string): Promise<any> => {
    const topic = await getActiveTopic(studentId)
    const identifier = await requireStudentIdentifier(studentId)
    if (!topic?.id) {
      throw new Error('请先完成选题申报。')
    }

    const response = await api.post('/proposals/generate', {
      studentId: identifier,
      topicId: topic.id,
    })

    const payload = unwrapData<any>(response)
    const proposal = payload?.proposal || payload
    const generated = payload?.generated || {}

    return {
      success: true,
      data: {
        ...mapProposalForStudent(proposal, topic.title),
        ...generated,
        title: topic.title || '毕业设计开题报告',
        references: ensureArray(generated.references),
      },
    }
  },

  saveProposalDraft: async (studentId: string, draftData: RecordLike): Promise<any> => {
    const current = await studentAPI.getProposal(studentId)
    const topic = await getActiveTopic(studentId)
    if (!topic?.id) {
      throw new Error('请先完成选题申报。')
    }

    const references = ensureArray(draftData.references).join('\n')
    const content = [
      draftData.researchBackground ? `选题背景\n${draftData.researchBackground}` : '',
      draftData.researchObjectives ? `选题目的\n${draftData.researchObjectives}` : '',
      draftData.researchSignificance ? `选题意义\n${draftData.researchSignificance}` : '',
      draftData.literatureReview ? `国内外研究现状\n${draftData.literatureReview}` : '',
      draftData.researchContent ? `主要内容\n${draftData.researchContent}` : '',
      draftData.researchMethods ? `研究方法\n${draftData.researchMethods}` : '',
      draftData.innovationPoints ? `创新点\n${draftData.innovationPoints}` : '',
      draftData.feasibilityAnalysis ? `前期基础\n${draftData.feasibilityAnalysis}` : '',
      draftData.expectedOutcomes ? `预期成果\n${draftData.expectedOutcomes}` : '',
      draftData.workPlan ? `论文进度安排\n${draftData.workPlan}` : '',
      references ? `参考文献\n${references}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    if (current.data?.id) {
      await api.put(`/proposals/${current.data.id}`, { content, status: 'draft' })
    } else {
      await api.post('/proposals', { topicId: topic.id, content })
    }

    return { success: true }
  },

  submitProposal: async (studentId: string, proposalData: RecordLike): Promise<any> => {
    await studentAPI.saveProposalDraft(studentId, proposalData)
    const current = await studentAPI.getProposal(studentId)
    if (current.data?.id) {
      await api.put(`/proposals/${current.data.id}`, { status: 'reviewing' })
    }
    return { success: true }
  },

  getMidtermReport: async (studentId: string): Promise<any> => {
    const topic = await getActiveTopic(studentId)
    const identifier = await requireStudentIdentifier(studentId)
    if (!topic?.id) {
      return { success: true, data: null }
    }

    const response = await api.get('/midterms', { params: { studentId: identifier } })
    const report = unwrapData<any[]>(response)?.[0]
    const student = await readStudentRecord(studentId)

    return {
      success: true,
      data: report ? mapMidtermForStudent(report, topic.title, student.name || '', student.studentId || '') : null,
    }
  },

  generateMidtermReport: async (studentId: string, _topicId?: string): Promise<any> => {
    const topic = await getActiveTopic(studentId)
    const identifier = await requireStudentIdentifier(studentId)
    const student = await readStudentRecord(studentId)
    if (!topic?.id) {
      throw new Error('请先完成选题申报。')
    }

    const request = {
      action: 'generateMidtermReport',
      studentId: identifier,
      topicId: topic.id,
    }
    setAiDebugInfo({ request })

    try {
      const response: any = await api.post('/midterms/generate', {
        studentId: identifier,
        topicId: topic.id,
      })

      const payload = unwrapData<any>(response)
      const report = payload?.report || payload
      const generated = payload?.generated || {}

      setAiDebugInfo({
        request,
        response: {
          status: 200,
          success: response?.success,
          message: response?.message || null,
          dataId: report?.id || null,
        },
      })

      return {
        success: true,
        data: {
          ...mapMidtermForStudent(report, topic.title, student.name || '', student.studentId || ''),
          progressSummary: generated.progressSummary || report?.progress || '',
          completedWork: ensureArray(generated.completedWork || report?.achievements),
          currentStage: generated.currentStage || report?.progress || '',
          nextStagePlan: generated.nextStagePlan || report?.keyComments || '',
          problemsEncountered: generated.problemsEncountered || report?.problems || '',
          solutions: generated.solutions || report?.solutions || '',
          achievements: generated.achievements || report?.achievements || '',
          selfEvaluation: generated.selfEvaluation || report?.feedback || '',
        },
      }
    } catch (error: any) {
      setAiDebugInfo({
        request,
        error: {
          status: error?.response?.status || null,
          message: error?.response?.data?.message || error?.message || 'unknown error',
        },
      })
      throw error
    }
  },

  saveMidtermReportDraft: async (studentId: string, draftData: RecordLike): Promise<any> => {
    const topic = await getActiveTopic(studentId)
    if (!topic?.id) {
      throw new Error('请先完成选题申报。')
    }

    await api.post('/midterms', {
      topicId: topic.id,
      progress: draftData.progressSummary || draftData.currentStage || '',
      achievements: ensureArray(draftData.completedWork).join('\n'),
      keyComments: draftData.nextStagePlan || '',
    })

    return { success: true }
  },

  submitMidtermReport: async (studentId: string, reportData: RecordLike): Promise<any> => {
    await studentAPI.saveMidtermReportDraft(studentId, reportData)
    return { success: true }
  },

  uploadFile: async (file: File, type: 'taskbook' | 'proposal' | 'midterm'): Promise<any> => {
    const studentId = await requireStudentIdentifier(undefined)
    const topic = await getActiveTopic(studentId)
    if (!topic?.id) {
      throw new Error('请先完成选题申报。')
    }

    if (type === 'proposal') {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('studentId', String(studentId))
      formData.append('topicId', String(topic.id))
      const response = await api.post('/proposals/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return { success: true, data: mapProposalForStudent(unwrapData(response), topic.title) }
    }

    const text = await readTextFile(file)

    if (type === 'taskbook') {
      await studentAPI.saveTaskBookDraft(studentId || '', {
        researchPurpose: text,
        researchContent: text,
        researchMethods: '待补充',
        researchSignificance: '待补充',
        progressSchedule: '',
      })
      return studentAPI.getTaskBook(studentId || '')
    }

    await studentAPI.saveMidtermReportDraft(studentId || '', {
      progressSummary: text,
      completedWork: '',
      nextStagePlan: '',
    })
    return studentAPI.getMidtermReport(studentId || '')
  },
}

export const teacherAPI = {
  getPendingTopics: async (teacherId?: string): Promise<any> => {
    const response = await api.get(`/teacher/${requireTeacherIdentifier(teacherId)}/pending-topics`)
    const topics = unwrapData<any[]>(response) || []
    return { success: true, data: topics.map(mapTopicForTeacher) }
  },

  reviewTopic: async ({ topicId, status, feedback }: RecordLike): Promise<any> => {
    const response = await api.post('/teacher/topic/review', {
      topicId,
      status,
      feedback,
      teacherId: getPreferredTeacherIdentifier(undefined),
    })
    return { success: true, data: unwrapData(response) }
  },

  getPendingTaskBooks: async (teacherId?: string): Promise<any> => {
    const response = await api.get(`/teacher/${requireTeacherIdentifier(teacherId)}/pending-taskbooks`)
    const taskBooks = (unwrapData<any[]>(response) || []).map((item) => ({
      id: String(item.id),
      studentId: item.topic?.student?.studentId || '',
      studentName: item.topic?.student?.name || '未命名学生',
      studentMajor: item.topic?.student?.major || '',
      topicTitle: item.topic?.title || '未命名选题',
      content: item.content || '',
      fileUrl: '',
      fileName: '',
      status: normalizeStatus(item.status) === 'pending' ? 'pending' : normalizeStatus(item.status),
      submitTime: item.updatedAt || item.createdAt || new Date().toISOString(),
      feedback: item.feedback || '',
      teacherFeedback: item.feedback || '',
      aiEvaluation: parseJsonString(item.aiEvaluation, undefined),
    }))
    return { success: true, data: taskBooks }
  },

  evaluateTaskBook: async (taskBookId: string): Promise<any> => {
    const response = await api.post(`/teacher/taskbook/evaluate/${taskBookId}`)
    return { success: true, data: unwrapData(response) }
  },

  reviewTaskBook: async ({ taskBookId, status, feedback }: RecordLike): Promise<any> => {
    const response = await api.post('/teacher/taskbook/review', { taskBookId, status, feedback })
    return { success: true, data: unwrapData(response) }
  },

  generateTaskBookOpinion: async (taskBookId: string): Promise<any> => {
    const response = await api.post(`/teacher/taskbook/generate-opinion/${taskBookId}`)
    return { success: true, data: unwrapData(response) }
  },

  getPendingProposals: async (teacherId?: string): Promise<any> => {
    const response = await api.get(`/teacher/${requireTeacherIdentifier(teacherId)}/pending-proposals`)
    const proposals = (unwrapData<any[]>(response) || []).map((item) => ({
      id: String(item.id),
      studentId: item.topic?.student?.studentId || '',
      studentName: item.topic?.student?.name || '未命名学生',
      studentMajor: item.topic?.student?.major || '',
      topicTitle: item.topic?.title || '未命名选题',
      content: {
        background: item.researchBackground || item.content || '',
        significance: item.feedback || '',
        researchStatus: '',
        researchContent: item.content || '',
        researchMethods: item.methodology || '',
        expectedResults: item.expectedResults || '',
        innovationPoints: '',
        feasibilityAnalysis: '',
        workPlan: '',
        references: [] as string[],
      },
      fileUrl: '',
      fileName: '',
      status: normalizeStatus(item.status),
      submitTime: item.updatedAt || item.createdAt || new Date().toISOString(),
      feedback: item.feedback || '',
      teacherFeedback: item.feedback || '',
      aiEvaluation: parseJsonString(item.aiAnalysis, undefined),
    }))
    return { success: true, data: proposals }
  },

  evaluateProposal: async (proposalId: string): Promise<any> => {
    const response = await api.post(`/teacher/proposal/evaluate/${proposalId}`)
    return { success: true, data: unwrapData(response) }
  },

  reviewProposal: async ({ proposalId, status, feedback }: RecordLike): Promise<any> => {
    const response = await api.post('/teacher/proposal/review', { proposalId, status, feedback })
    return { success: true, data: unwrapData(response) }
  },

  generateProposalOpinion: async (proposalId: string): Promise<any> => {
    const response = await api.post(`/teacher/proposal/generate-opinion/${proposalId}`)
    return { success: true, data: unwrapData(response) }
  },

  getPendingMidtermReports: async (teacherId?: string): Promise<any> => {
    const response = await api.get(`/teacher/${requireTeacherIdentifier(teacherId)}/pending-midterm-reports`)
    const reports = (unwrapData<any[]>(response) || []).map((item) => ({
      id: String(item.id),
      studentId: item.topic?.student?.studentId || '',
      studentName: item.topic?.student?.name || '未命名学生',
      studentMajor: item.topic?.student?.major || '',
      topicTitle: item.topic?.title || '未命名选题',
      content: {
        progressSummary: item.progress || '',
        completedWork: item.achievements || '',
        currentStage: item.progress || '',
        nextStagePlan: item.keyComments || '',
        problemsAndSolutions: [item.problems, item.solutions].filter(Boolean).join('\n'),
        achievements: item.achievements || '',
        selfEvaluation: item.feedback || '',
        progressPercentage: item.progress ? 65 : 0,
        keyMilestones: [
          { title: '需求分析', description: '完成需求梳理与任务拆解', completed: true },
          { title: '系统实现', description: '推进核心模块开发', completed: Boolean(item.progress) },
        ],
      },
      fileUrl: '',
      fileName: '',
      status: normalizeStatus(item.status),
      submitTime: item.updatedAt || item.createdAt || new Date().toISOString(),
      feedback: item.feedback || '',
      teacherFeedback: item.feedback || '',
      aiEvaluation: parseJsonString(item.aiAnalysis, undefined),
    }))
    return { success: true, data: reports }
  },

  evaluateMidtermReport: async (reportId: string): Promise<any> => {
    const response = await api.post(`/teacher/midterm/evaluate/${reportId}`)
    return { success: true, data: unwrapData(response) }
  },

  reviewMidtermReport: async ({ reportId, status, feedback }: RecordLike): Promise<any> => {
    const response = await api.post('/teacher/midterm/review', { reportId, status, feedback })
    return { success: true, data: unwrapData(response) }
  },

  generateMidtermOpinion: async (reportId: string): Promise<any> => {
    const response = await api.post(`/teacher/midterm/generate-opinion/${reportId}`)
    return { success: true, data: unwrapData(response) }
  },

  getProfile: async (): Promise<any> => {
    const response = await api.get('/teacher/profile')
    return unwrapData(response)
  },

  updateProfile: async (profileData: RecordLike): Promise<any> => {
    const response = await api.put('/teacher/profile', profileData)
    return unwrapData(response)
  },

  uploadAvatar: async (formData: FormData): Promise<any> => {
    const file = formData.get('avatar')
    const uploadData = new FormData()
    if (file instanceof File) {
      uploadData.append('file', file)
    }

    return api.post('/teacher/avatar', uploadData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const adminAPI = {
  getOverview: async (): Promise<any> => {
    const response = await api.get('/admin/overview')
    return unwrapData(response)
  },

  getTeachers: async (): Promise<any> => {
    const response = await api.get('/admin/teachers')
    return unwrapData(response)
  },

  getStudents: async (): Promise<any> => {
    const response = await api.get('/admin/students')
    return unwrapData(response)
  },

  getAdvisories: async (): Promise<any> => {
    const response = await api.get('/admin/advisories')
    return unwrapData(response)
  },

  assignStudent: async (payload: { teacherId: string; studentId: string; startDate?: string }): Promise<any> => {
    const response = await api.post('/admin/advisories', payload)
    return unwrapData(response)
  },

  updateAdvisory: async (id: number, payload: RecordLike): Promise<any> => {
    const response = await api.put(`/admin/advisories/${id}`, payload)
    return unwrapData(response)
  },

  getStudentProgress: async (filters: RecordLike = {}): Promise<any> => {
    const response: any = await api.get('/admin/student-progress', { params: filters })
    return {
      data: unwrapData(response),
      meta: response?.meta || {},
    }
  },

  getTeacherStudents: async (teacherId: string): Promise<any> => {
    const response = await api.get(`/admin/teachers/${teacherId}/students`)
    return unwrapData(response)
  },

  createTeacher: async (payload: RecordLike): Promise<any> => {
    const response = await api.post('/admin/teachers', payload)
    return response
  },

  importTeachers: async (formData: FormData): Promise<any> => {
    return api.post('/admin/teachers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  createStudent: async (payload: RecordLike): Promise<any> => {
    const response = await api.post('/admin/students', payload)
    return response
  },

  importStudents: async (formData: FormData): Promise<any> => {
    return api.post('/admin/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const authAPI = {
  login: (email: string, password: string): Promise<any> => api.post('/auth/login', { email, password }),
  register: (data: RecordLike): Promise<any> => api.post('/auth/register', data),
  getCurrentUser: (): Promise<any> => api.get('/auth/me'),
}

export const aiAPI = {
  getHealth: async (): Promise<any> => api.get('/health/ai'),
}

export default api
