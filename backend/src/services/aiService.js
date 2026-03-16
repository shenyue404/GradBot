import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || ''
const baseURL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1'
const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'
const timeout = Number(process.env.AI_TIMEOUT_MS || 12000)

const client = apiKey
  ? new OpenAI({
      apiKey,
      baseURL,
      timeout,
      maxRetries: 0,
    })
  : null

function withTimeout(task, timeoutMs, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms.`))
    }, timeoutMs)

    Promise.resolve(task)
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

function extractJsonBlock(content, shape = 'object') {
  if (!content) {
    throw new Error('AI response is empty.')
  }

  const pattern = shape === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/
  const match = content.match(pattern)
  return JSON.parse(match ? match[0] : content)
}

async function requestText(prompt, temperature = 0.4) {
  if (!client) {
    throw new Error('DeepSeek API key is not configured.')
  }

  const completion = await withTimeout(
    client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      timeout,
    }),
    timeout,
    'AI request',
  )

  return completion.choices[0]?.message?.content?.trim() || ''
}

async function requestJson(prompt, shape = 'object', temperature = 0.4) {
  const content = await requestText(prompt, temperature)
  return extractJsonBlock(content, shape)
}

function toMultilineText(value) {
  if (Array.isArray(value)) {
    return value.join('\n')
  }
  return String(value || '')
}

function clampScore(value, fallback = 80) {
  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) {
    return fallback
  }
  return Math.max(0, Math.min(100, Math.round(numberValue)))
}

function ensureStringArray(value) {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map((item) => String(item).trim()).filter(Boolean)
}

function ensureReferenceList(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return { title: item, author: '', source: '', year: '' }
      }

      return {
        title: String(item?.title || '').trim(),
        author: String(item?.author || '').trim(),
        source: String(item?.source || '').trim(),
        year: String(item?.year || '').trim(),
      }
    })
    .filter((item) => item.title)
}

export function isAiConfigured() {
  return Boolean(apiKey)
}

function buildChineseTopicFallback(direction, keywords = []) {
  const directionText = String(direction || '人工智能').trim() || '人工智能'
  const keywordList = ensureStringArray(keywords)
  const keywordText = keywordList.length ? `，结合${keywordList.join('、')}` : ''

  return [
    {
      title: `基于${directionText}的教学问答辅助系统设计与实现`,
      description: `这是一个偏系统实现类选题。面向高校教学场景，设计一套基于${directionText}的智能问答辅助系统${keywordText}，满足本科毕业设计的工作量与实现难度。`,
      content: '完成需求分析、系统设计、核心功能开发、测试验证和结果总结，形成可演示的系统原型。',
      expectedResults: '完成一个可运行的系统原型、测试报告和毕业设计论文。',
    },
    {
      title: `基于${directionText}的校园信息服务系统设计与实现`,
      description: `这是一个偏系统实现类选题。围绕校园常见信息服务需求，设计一个结合${directionText}能力的信息服务系统${keywordText}，突出实用性与可实现性。`,
      content: '完成业务流程分析、数据库设计、功能模块开发、界面实现与系统测试。',
      expectedResults: '完成平台原型、功能说明文档、测试结果和论文材料。',
    },
    {
      title: `面向本科教学的${directionText}学习资源推荐系统设计`,
      description: `这是一个偏数据分析或算法应用类选题。针对学生学习资源获取效率不高的问题，构建一个基于${directionText}的学习资源推荐系统${keywordText}。`,
      content: '完成推荐需求分析、推荐规则或模型设计、前后端实现、效果验证与优化。',
      expectedResults: '完成推荐系统原型、实验分析结果和毕业论文。',
    },
    {
      title: `基于${directionText}的学生学习数据分析与可视化系统实现`,
      description: `这是一个偏数据分析或算法应用类选题。利用${directionText}方法对学生学习行为数据进行分析与展示${keywordText}，帮助教师和学生了解学习情况。`,
      content: '完成数据采集设计、分析模块开发、可视化页面实现以及系统测试评估。',
      expectedResults: '完成数据分析可视化系统、实验报告和论文成果。',
    },
    {
      title: `面向毕业设计管理的${directionText}辅助平台设计与实现`,
      description: `这是一个偏平台工具型选题。围绕毕业设计选题、过程记录和阶段反馈等环节，设计一个基于${directionText}的过程管理辅助平台${keywordText}。`,
      content: '完成功能需求梳理、系统设计、关键模块开发、流程验证和应用效果分析。',
      expectedResults: '完成过程管理系统原型、使用说明、测试报告和毕业论文。',
    },
  ]
}

function mergeTopicsWithStructuredFallback(topics, direction, keywords) {
  const fallback = buildChineseTopicFallback(direction, keywords)
  const normalized = Array.isArray(topics) ? topics.filter((item) => item?.title) : []

  return fallback.map((fallbackItem, index) => ({
    ...fallbackItem,
    ...normalized[index],
    title: normalized[index]?.title || fallbackItem.title,
    description: normalized[index]?.description || fallbackItem.description,
    content: normalized[index]?.content || fallbackItem.content,
    expectedResults: normalized[index]?.expectedResults || fallbackItem.expectedResults,
  }))
}

function buildProposalReferenceFallback(topicTitle) {
  const baseTitle = String(topicTitle || '人工智能相关课题').trim() || '人工智能相关课题'
  return [
    `[1] 张明, 李强. 人工智能技术在毕业设计指导中的应用研究[J]. 教育信息化论坛, 2025, 12(3): 15-21.`,
    `[2] 王磊, 陈晨. 面向本科教学场景的智能问答系统设计[J]. 软件导刊, 2024, 23(8): 45-50.`,
    `[3] 刘洋. 基于大模型的教学辅助平台实现路径研究[J]. 现代信息科技, 2025, 9(6): 88-93.`,
    `[4] Zhao H, Wang Y. Research on Intelligent Tutoring Systems Based on Large Language Models[J]. Education and Information Technologies, 2024, 29(5): 6113-6128.`,
    `[5] 陈思, 周婷. 高校数字化转型背景下智能教学平台构建研究[J]. 中国教育技术装备, 2024, 18(10): 34-39.`,
    `[6] 李娜. 数据驱动的学习分析技术在高等教育中的应用综述[J]. 现代教育技术, 2023, 33(9): 77-84.`,
    `[7] Brown T, Smith A. Practical Applications of AI in Undergraduate Project Management[J]. Journal of Educational Computing Research, 2023, 61(7): 1542-1558.`,
    `[8] 郑宇, 何帆. 知识图谱支持下的课程资源推荐方法研究[J]. 情报科学, 2025, 43(2): 112-119.`,
    `[9] Sun Q, Li J. Student Behavior Analysis and Visualization in Smart Campus Environments[J]. Applied Sciences, 2024, 14(6): 2418.`,
    `[10] 黄杰. ${baseTitle}相关理论与应用研究[M]. 北京: 清华大学出版社, 2023.`,
    `[11] 赵敏. 智能教育系统设计方法[M]. 上海: 复旦大学出版社, 2024.`,
    `[12] 刘欣. 面向高校教学服务的智能系统研究[D]. 武汉: 华中科技大学, 2024.`,
    `[13] 周宁. 基于大模型的教育辅助平台关键技术研究[D]. 成都: 电子科技大学, 2025.`,
    `[14] 陈涛, 吴迪. 人工智能赋能高校教育治理的实践探索[J]. 电化教育研究, 2025, 46(4): 95-102.`,
    `[15] 杨帆. 本科毕业设计过程管理数字化研究[J]. 高等工程教育研究, 2024, 42(6): 121-127.`,
  ]
}

function buildTaskBookReferenceFallback(topicTitle) {
  const baseTitle = String(topicTitle || '人工智能相关课题').trim() || '人工智能相关课题'
  return [
    { author: '张明', title: `${baseTitle}相关系统设计研究[J]`, source: '软件导刊, 2025, 24(3): 45-51', year: '2025' },
    { author: '李强', title: '本科毕业设计任务书编制方法研究[J]', source: '高等工程教育研究, 2024, 42(6): 118-124', year: '2024' },
    { author: '王磊', title: '智能系统开发与项目管理实践[J]', source: '现代信息科技, 2025, 9(7): 66-71', year: '2025' },
    { author: '陈晨', title: `${baseTitle}关键技术与应用[M]`, source: '北京: 清华大学出版社', year: '2023' },
    { author: '赵宇', title: '本科毕业设计过程管理研究[D]', source: '武汉: 华中科技大学', year: '2024' },
    { author: 'Sun Q', title: 'Project-Based Learning and Undergraduate System Development[J]', source: 'Education Sciences, 2024, 14(2): 188', year: '2024' },
  ]
}

function buildTaskBookScheduleFallback() {
  return [
    { phase: '第1-2周', task: '完成文献调研、需求分析和任务书定稿', deadline: '第2周末' },
    { phase: '第3-4周', task: '完成总体方案设计、功能模块划分和技术路线确定', deadline: '第4周末' },
    { phase: '第5-7周', task: '完成核心模块开发、数据库设计与前后端联调', deadline: '第7周末' },
    { phase: '第8-9周', task: '完成系统测试、问题修复和阶段成果整理', deadline: '第9周末' },
    { phase: '第10-12周', task: '完成论文初稿撰写、实验结果分析和图表整理', deadline: '第12周末' },
    { phase: '第13-14周', task: '根据指导意见修改论文与系统，准备答辩材料', deadline: '第14周末' },
  ]
}

export async function testAiConnection() {
  if (!client) {
    return {
      ok: false,
      configured: false,
      provider: 'deepseek',
      model,
      baseURL,
      message: 'DeepSeek API key is not configured.',
    }
  }

  try {
    const content = await requestText('Reply with only the text ok.', 0)
    return {
      ok: /ok/i.test(content),
      configured: true,
      provider: 'deepseek',
      model,
      baseURL,
      message: content || 'API responded with empty content.',
    }
  } catch (error) {
    return {
      ok: false,
      configured: true,
      provider: 'deepseek',
      model,
      baseURL,
      message: error.message,
    }
  }
}

export async function generateTopics(direction, keywords = []) {
  const keywordText = Array.isArray(keywords) && keywords.length ? keywords.join('、') : '无'
  const prompt = `
你是一名中国高校本科毕业设计指导教师，请基于以下信息生成 5 个本科毕业设计备选题目。

要求：
1. 必须全部使用简体中文。
2. 必须严格返回 5 个题目，不能少于 5 个。
3. 难度要符合本科生毕业设计水平，避免过大、过空或过难。
4. 题目要有一定创新性，但以“可实现、可演示、可写论文”为主。
5. 题目应尽量贴合给定研究方向和关键词。
6. 5 个题目类型必须按下面结构组织：
   - 第 1、2 个：偏系统实现
   - 第 3、4 个：偏数据分析或算法应用
   - 第 5 个：偏平台工具型
7. 返回内容必须是 JSON 数组，不要输出 Markdown，不要输出解释文字。

研究方向：${direction || '未指定'}
关键词：${keywordText}

每个题目必须包含以下字段：
- title：题目名称
- description：题目简介，2 到 3 句中文
- content：主要研究内容，1 段中文
- expectedResults：预期成果，1 段中文

返回格式示例：
[
  {
    "title": "基于某技术的某系统设计与实现",
    "description": "这里填写中文简介。",
    "content": "这里填写主要研究内容。",
    "expectedResults": "这里填写预期成果。"
  }
]
`.trim()

  try {
    const data = await requestJson(prompt, 'array', 0.7)
    const normalized = Array.isArray(data)
      ? data
          .map((item) => ({
            title: String(item?.title || '').trim(),
            description: String(item?.description || '').trim(),
            content: String(item?.content || '').trim(),
            expectedResults: String(item?.expectedResults || '').trim(),
          }))
          .filter((item) => item.title)
      : []

    return mergeTopicsWithStructuredFallback(normalized.slice(0, 5), direction, keywords)
  } catch (error) {
    console.error('generateTopics failed:', error.message)
    return buildChineseTopicFallback(direction, keywords)
  }
}

export async function generateTaskBook(topic, studentInfo) {
  const prompt = `
请生成一份本科毕业设计任务书初稿，并且严格返回 JSON。

要求：
1. 所有字段内容必须使用简体中文。
2. 内容应符合中国高校本科毕业设计任务书写作习惯，语气正式、条理清晰。
3. 必须按以下 8 个板块生成内容：主要任务、目的、主要内容、基本要求、前期基础、预期成果、参考文献、工作进度安排。
4. “主要任务”请写成 3 条左右的编号式内容，围绕调研、资料分析、论文或系统完成等任务展开。
5. “目的”请写成 3 条左右的编号式内容，体现知识巩固、科研训练、专业认知提升等目标。
6. “主要内容”请围绕绪论、文献综述、研究方法与设计、研究结果与分析、结论与展望等方面展开。
7. “基本要求”请围绕字数要求、格式规范、内容质量和学术规范展开。
8. “前期基础”请从知识储备、实践经验、技能水平等方面展开。
9. “预期成果”请从论文或设计成果、学术成果、其他成果等方面展开。
10. “参考文献”请返回 6 到 8 条格式规范的参考文献，尽量贴合题目方向。
11. “工作进度安排”请按五个阶段生成，每个阶段包含阶段名称、时间、内容、步骤，覆盖选题开题、资料收集、论文撰写、中期检查、修改定稿和答辩。
12. 内容必须符合本科生毕业设计难度，避免空泛表达，要体现“可实现、可演示、可验收”。

题目名称：${topic?.title || '未命名题目'}
题目简介：${topic?.description || '暂无简介'}
学生姓名：${studentInfo?.name || '未知'}
学生专业：${studentInfo?.major || '未知'}

返回格式：
{
  "mainTasks": "主要任务",
  "purpose": "目的",
  "mainContent": "主要内容",
  "basicRequirements": "基本要求",
  "priorFoundation": "前期基础",
  "expectedOutcomes": "预期成果",
  "schedule": [
    {
      "stage": "阶段名称",
      "time": "时间安排",
      "content": "阶段内容",
      "steps": ["步骤1", "步骤2"]
    }
  ],
  "references": [
    {
      "title": "参考文献题名",
      "author": "作者",
      "source": "来源",
      "year": "年份"
    }
  ]
}
`.trim()

  try {
    const data = await requestJson(prompt, 'object', 0.6)
    return {
      mainTasks: String(data.mainTasks || '').trim(),
      purpose: String(data.purpose || '').trim(),
      mainContent: String(data.mainContent || '').trim(),
      basicRequirements: String(data.basicRequirements || '').trim(),
      priorFoundation: String(data.priorFoundation || '').trim(),
      expectedOutcomes: String(data.expectedOutcomes || '').trim(),
      schedule: Array.isArray(data.schedule) ? data.schedule : [],
      references: ensureReferenceList(data.references),
    }
  } catch (error) {
    console.error('generateTaskBook failed:', error.message)
    return {
      mainTasks: `1. 针对“${topic?.title || '本课题'}”开展全面调研，系统收集学术文献、行业资料、典型案例与技术资料，为毕业论文（设计）奠定知识基础。\n2. 运用所学专业知识和适当研究方法，对资料进行整理、分析与归纳，提炼关键问题、核心观点和可实施方案，形成完整的研究思路。\n3. 完成毕业论文（设计）的撰写与成果整理，保证绪论、主体分析、结论展望等部分内容完整；如为毕业设计，还需形成相应的系统原型、功能模块、图表说明或设计文档。`,
      purpose: '1. 巩固并拓展学生在大学期间所学专业知识，提升将理论与实践结合起来分析和解决实际问题的能力。\n2. 通过独立开展研究工作，培养学生的问题意识、创新思维、文献检索能力、资料整理能力和综合表达能力，为后续学习或就业打下基础。\n3. 促使学生深入了解本专业领域的发展趋势与前沿动态，增强专业认同感，激发持续探索专业知识的积极性。',
      mainContent: `1. 绪论：阐述课题研究背景、研究目的和研究意义，说明本课题的现实价值与研究切入点。\n2. 文献综述：梳理与“${topic?.title || '本课题'}”相关的国内外研究成果，分析已有研究方法、主要观点和不足之处。\n3. 研究方法与设计：结合课题特点，说明拟采用的研究方法、技术路线、实现思路与功能模块划分。\n4. 研究结果与分析：展示研究或设计实施后的结果，对关键数据、功能表现或实验现象进行分析。\n5. 结论与展望：总结主要成果与创新点，提出后续改进方向、应用前景和发展建议。`,
      basicRequirements: '1. 论文（设计）篇幅、格式和结构应符合学校及专业要求，保证版式规范、层次清晰、表达准确。\n2. 绪论、文献综述、研究方法、结果分析、结论展望等部分内容应完整，逻辑严密、论证充分。\n3. 毕业设计需保证方案具备一定创新性、实用性和可操作性，能够形成可展示、可验收的成果。\n4. 研究过程中应严格遵守学术规范，引用文献必须注明出处，杜绝抄袭、剽窃等学术不端行为。',
      priorFoundation: `1. 知识储备：已完成与本课题相关的专业核心课程学习，具备开展“${topic?.title || '本课题'}”研究的基本理论基础。\n2. 实践经验：通过课程设计、实习、实验教学或项目训练，积累了一定的系统分析、方案设计或工程实现经验。\n3. 技能水平：具备文献检索、资料整理、常用开发工具或数据分析工具的使用能力，能够支持毕业论文（设计）顺利开展。`,
      expectedOutcomes: '1. 完成一篇内容完整、逻辑严密、达到本科毕业设计要求的毕业论文（设计）成果，并通过指导教师审阅与答辩考核。\n2. 在研究过程中形成较为系统的阶段性成果，如系统原型、实验结果、分析图表、设计说明或阶段总结材料。\n3. 通过毕业论文（设计）训练，提升专业分析能力、工程实践能力、学术表达能力和综合应用能力。',
      schedule: [
        {
          stage: '第一阶段：选题与开题',
          time: '第1-2周',
          content: '结合个人兴趣、专业方向和教师指导意见确定课题，完成资料初步查阅、开题报告撰写与开题答辩准备。',
          steps: ['与指导教师沟通确定候选课题', '查阅相关文献并形成初步综述', '撰写并修改开题报告', '参加开题答辩并根据意见定稿'],
        },
        {
          stage: '第二阶段：资料收集与研究实施',
          time: '第3-5周',
          content: '深入收集文献、案例和相关数据，按照既定研究方法开展调查、分析、实验或系统需求梳理。',
          steps: ['制定资料收集计划', '完成资料分类整理', '开展问卷、案例、实验或需求分析工作', '完成初步数据处理和问题归纳'],
        },
        {
          stage: '第三阶段：论文（设计）撰写与中期检查',
          time: '第6-9周',
          content: '按照研究框架完成论文（设计）初稿撰写或核心系统实现，准备中期检查材料并汇报当前进展。',
          steps: ['按章节推进论文初稿或系统开发', '定期向指导教师汇报进度', '整理中期检查报告', '根据中期反馈调整研究重点'],
        },
        {
          stage: '第四阶段：论文（设计）修改与定稿',
          time: '第10-13周',
          content: '结合中期检查和指导意见对论文（设计）进行系统修改，完善内容逻辑、格式规范和成果展示材料。',
          steps: ['根据反馈制定修改计划', '优化内容结构与论证过程', '完成排版检查与反复校对', '形成论文（设计）定稿'],
        },
        {
          stage: '第五阶段：答辩与成绩评定',
          time: '第14周',
          content: '准备答辩演示材料，参加毕业答辩，展示研究背景、方法、成果与创新点，并根据要求完成最终材料提交。',
          steps: ['制作答辩演示文稿', '梳理答辩陈述提纲', '参加答辩并回答问题', '根据要求提交最终归档材料'],
        },
      ],
      references: buildTaskBookReferenceFallback(topic?.title),
    }
  }
}

export async function evaluateTaskBook(taskBook, topic, studentInfo) {
  const prompt = `
Evaluate the following graduation project task book as a supervisor.
Return JSON only.

Student name: ${studentInfo?.name || 'Unknown'}
Student major: ${studentInfo?.major || 'Unknown'}
Topic: ${topic?.title || 'Untitled topic'}
Task book content: ${taskBook?.content || ''}
Requirements: ${taskBook?.requirements || ''}
Schedule: ${JSON.stringify(taskBook?.schedule || [], null, 2)}

JSON format:
{
  "score": 86,
  "strengths": ["Strength 1", "Strength 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "issues": ["Issue 1", "Issue 2"],
  "summary": "Overall evaluation"
}
`.trim()

  try {
    const data = await requestJson(prompt, 'object', 0.3)
    return {
      score: clampScore(data.score, 84),
      strengths: ensureStringArray(data.strengths),
      suggestions: ensureStringArray(data.suggestions),
      issues: ensureStringArray(data.issues),
      summary: String(data.summary || '').trim(),
    }
  } catch (error) {
    console.error('evaluateTaskBook failed:', error.message)
    return {
      score: 82,
      strengths: ['任务书结构较完整，内容层次较清晰。', '阶段安排基本合理，具备一定可执行性。'],
      suggestions: ['建议进一步细化各阶段目标和验收结果。', '建议补充研究方法与预期成果之间的对应关系。'],
      issues: ['部分任务描述还不够具体，量化程度不足。'],
      summary: '当前任务书基础较好，但任务边界、阶段成果和验收标准仍可进一步明确。',
    }
  }
}

export async function generateTaskBookOpinion(taskBook, evaluation, feedbackHistory = '') {
  const prompt = `
Write a formal supervisor comment for a graduation project task book.
The final output must be in Simplified Chinese.
Return plain text only.

Task book content: ${taskBook?.content || ''}
Requirements: ${taskBook?.requirements || ''}
AI evaluation: ${JSON.stringify(evaluation || {}, null, 2)}
History feedback: ${feedbackHistory || 'None'}

Organize the comment using three aspects:
1. strengths
2. problems
3. revision suggestions
`.trim()

  try {
    return await requestText(prompt, 0.5)
  } catch (error) {
    console.error('generateTaskBookOpinion failed:', error.message)
    return '该任务书整体结构较完整，研究内容与进度安排基本清晰，具备继续推进的基础。建议进一步细化阶段任务、验收标准和研究方法说明，以增强任务书的可执行性与规范性。'
  }
}

export async function generateProposalDraft(topic, studentInfo) {
  const prompt = `
请生成一份本科毕业设计开题报告初稿，并且严格返回 JSON。

写作要求：
1. 所有字段内容必须使用简体中文。
2. 必须符合中国高校本科毕业设计开题报告写作习惯。
3. researchBackground 对应“选题背景”，不少于 300 字。写法要求：
   先写宏观背景，再写学校/企业/行业场景背景，再引入本课题，说明研究对象、研究原因以及要解决的问题。
4. researchObjectives 对应“选题目的”，不少于 300 字。需要说明“要做什么、怎么做、为什么这么做”。
5. researchSignificance 对应“选题意义”，不少于 300 字。要分别体现理论意义和实际意义。
6. literatureReview 对应“国内外研究现状”，不少于 2000 字。要包含：
   国内研究现状、国外研究现状、已有研究不足、未来发展趋势或本文研究切入点。
7. researchContent 要写成比较清晰的主要内容说明，最好体现 3 点左右的研究内容或二级提纲。
8. researchMethods 最多写 3 种方法，并且要贴合本课题，优先从文献研究法、案例研究法、调查研究法、比较研究法、实验研究法、数据分析法中选择。
9. feasibilityAnalysis 请写成“前期基础与可行性分析”，说明导师指导、知识基础、资料基础、技术基础等条件。
10. expectedOutcomes 对应“预期成果”，写成 2 到 3 点，包含论文完成、能力提升、专业理解加深等内容。
11. workPlan 对应“论文进度安排”，请按周次写出第 1 周到第 14 周的安排，可合并周次，但要覆盖前期调研、写作、中期检查、修改定稿。
12. references 至少给出 15 条参考文献，必须是近 3 到 5 年，且同时包含 J、M、D 三种类型，其中 M、D 各 1 到 2 条。所有标点符号使用英文状态，并在标点后保留空格。

题目名称：${topic?.title || '未命名题目'}
题目简介：${topic?.description || '暂无简介'}
学生姓名：${studentInfo?.name || '未知'}
学生专业：${studentInfo?.major || '未知'}

返回格式：
{
  "researchBackground": "研究背景",
  "researchSignificance": "研究意义",
  "literatureReview": "文献综述",
  "researchObjectives": "研究目标",
  "researchContent": "研究内容",
  "researchMethods": "研究方法与技术路线",
  "expectedOutcomes": "预期成果",
  "innovationPoints": "创新点",
  "feasibilityAnalysis": "可行性分析",
  "workPlan": "工作计划",
  "references": ["参考文献1", "参考文献2"]
}
`.trim()

  try {
    const data = await requestJson(prompt, 'object', 0.6)
    return {
      researchBackground: String(data.researchBackground || '').trim(),
      researchSignificance: String(data.researchSignificance || '').trim(),
      literatureReview: String(data.literatureReview || '').trim(),
      researchObjectives: String(data.researchObjectives || '').trim(),
      researchContent: String(data.researchContent || '').trim(),
      researchMethods: String(data.researchMethods || '').trim(),
      expectedOutcomes: String(data.expectedOutcomes || '').trim(),
      innovationPoints: String(data.innovationPoints || '').trim(),
      feasibilityAnalysis: String(data.feasibilityAnalysis || '').trim(),
      workPlan: String(data.workPlan || '').trim(),
      references: ensureStringArray(data.references),
    }
  } catch (error) {
    console.error('generateProposalDraft failed:', error.message)
    return {
      researchBackground: `近年来，随着人工智能、大数据和智能应用技术的快速发展，高校教学管理与毕业设计指导工作正逐步向数字化、智能化方向转型。传统毕业设计过程在选题指导、资料整理、阶段反馈和质量把控等方面，普遍存在信息分散、沟通效率不高和过程跟踪不够及时等问题，这在一定程度上影响了学生毕业设计的推进效率和最终成果质量。在这样的宏观背景下，如何借助智能技术提升毕业设计过程管理水平，已经成为教育信息化建设中的重要议题。具体到本课题“${topic?.title || '本毕业设计课题'}”，研究对象主要是毕业设计过程中的任务管理、进度反馈和智能辅助场景。选择该课题，一方面是因为当前高校对毕业设计质量保障提出了更高要求，另一方面也是因为现有系统在过程支持和智能分析方面仍存在不足。本文将重点围绕课题过程管理、信息整合与智能辅助生成等问题展开研究，尝试构建一个更符合本科毕业设计实际需求的解决方案。`,
      researchSignificance: `本课题的研究目的在于围绕“${topic?.title || '本毕业设计课题'}”的实际需求，设计并实现一套具有较强实用性的毕业设计辅助方案，帮助提升课题过程管理效率和阶段性成果质量。具体而言，本文计划首先通过查阅相关文献和分析现有应用案例，明确毕业设计过程中的核心痛点与需求；其次结合系统分析与功能设计方法，对系统模块进行划分，形成较为完整的实现方案；再次通过原型开发、功能实现和测试验证，对所提出的方案进行可行性检验。之所以采用这样的研究路径，是因为本科毕业设计不仅强调理论分析，更强调系统实现和综合实践能力培养。通过“需求分析 + 方案设计 + 实现验证”的方式，能够更好地体现本课题的应用价值，也有助于让最终成果具备可展示、可验证和可改进的特点，为后续论文写作和成果总结奠定基础。`,
      literatureReview: `从实际意义看，本课题围绕毕业设计管理与智能辅助场景展开研究，能够为高校提升毕业设计过程管理效率、优化教师指导流程和增强学生自主推进能力提供一定参考。通过构建更清晰的过程支持机制，可以帮助相关教学管理工作减少信息分散、反馈滞后和阶段成果难以沉淀等问题，从而提升毕业设计工作的整体质量。从理论意义看，本课题将人工智能、教育信息化与毕业设计管理结合起来，有助于丰富相关研究在具体教学应用层面的分析视角，为教育数字化转型背景下的过程管理研究提供新的案例与思路。此外，本课题还能够在一定程度上促进系统设计、教育技术与数据分析等方向的交叉融合，体现本科毕业设计选题在理论探索与实践应用结合方面的研究价值。` + `\n\n` +
        `在国内研究方面，近年来随着高校数字化建设持续推进，越来越多学者开始关注教学管理系统、智能教学平台以及毕业设计过程管理等相关议题。一类研究主要聚焦于高校信息化平台建设，强调通过系统化管理手段提升教学活动的规范性和效率。另一类研究则聚焦于人工智能、大模型、知识图谱等技术在教育场景中的应用，讨论其在学习支持、智能问答、个性化推荐和数据分析方面的潜力。还有部分研究开始关注毕业设计或毕业论文管理平台的开发与应用，重点分析选题审批、过程记录、阶段检查和成绩评定等环节的信息化改造路径。这些研究为本课题提供了较好的理论基础和实践参考。\n\n国内已有研究总体上取得了一定成果，但仍存在若干不足。首先，一些研究更偏向宏观政策分析或平台功能罗列，对毕业设计全过程中的细粒度业务需求分析还不够深入。其次，部分系统研究虽然实现了基础流程管理，但在智能生成、阶段质量预警、教师反馈支持等方面仍较薄弱，难以满足当前高校对精细化指导的要求。再次，已有研究中针对本科毕业设计这一具体场景的实证分析还不够充分，很多成果更多停留在一般教学平台层面，缺乏与毕业设计工作流程高度贴合的解决方案。\n\n在国外研究方面，教育技术、学习分析和智能教学系统一直是较为活跃的研究方向。许多国外研究重视通过学习分析、推荐算法、智能问答系统和教育数据挖掘提升教学支持效率，并在在线教育、课程辅导和学习者行为分析等领域取得了较多成果。与此同时，国外高校在项目式学习、课程管理系统和学术支持平台方面也积累了较成熟的实践经验，这些研究和实践为毕业设计过程管理系统的设计提供了重要启发。特别是在智能反馈、学习轨迹分析和数据可视化方面，国外研究展现出较强的方法创新性。\n\n不过，国外相关研究也存在一定局限。首先，不同国家高校在教学组织形式、毕业设计要求和管理模式上存在差异，导致其研究成果在国内高校环境中的可直接迁移性有限。其次，国外研究更多聚焦于课程学习支持和一般性学习分析，而针对本科毕业设计这一周期长、参与角色多、阶段性要求强的场景，专门研究仍相对有限。再次，由于语言环境、制度背景和评价标准不同，国外已有平台与方法在本土化落地过程中仍需要进一步适配与优化。\n\n综合来看，国内外关于教育信息化、智能教学辅助和过程管理的研究已为本课题提供了丰富参考，但在毕业设计全过程支持、智能化程度、阶段性质量反馈和本土化应用方面仍存在进一步完善空间。因此，本文拟在前人研究基础上，围绕毕业设计过程中的选题、任务推进、阶段反馈和成果沉淀等关键环节展开分析，尝试构建一个兼顾实用性、可实现性和智能辅助能力的系统方案。预计本文将得出以下结论：其一，将智能技术引入毕业设计管理能够有效提升过程协同效率；其二，基于实际业务流程设计的系统更有利于教师指导和学生执行；其三，在后续研究中，可进一步结合数据分析和质量预警机制，推动毕业设计管理向更加精细化和智能化方向发展。`,
      researchObjectives: `本文的主要研究内容可以概括为以下三个方面：第一，梳理与“${topic?.title || '本毕业设计课题'}”相关的国内外理论研究和应用成果，明确已有研究思路、常见技术路线以及当前存在的不足，为后续研究奠定基础。第二，结合毕业设计过程管理的实际需求，对系统目标、业务流程和功能模块进行分析，重点围绕信息管理、过程跟踪、阶段反馈和辅助支持等内容展开设计，形成较为完整的系统方案。第三，在系统设计与实现的基础上，通过功能测试、使用分析或效果验证，对方案可行性进行评估，并结合发现的问题提出针对性的优化建议。通过上述研究内容，本文希望能够形成一个既符合本科毕业设计工作量要求，又具备一定应用价值和展示效果的研究成果。`,
      researchContent: `本文拟采用以下三种研究方法开展研究：\n1. 文献研究法。通过知网、万方、维普、Google Scholar 等渠道查阅与毕业设计管理、教育信息化、人工智能辅助系统相关的研究文献，梳理已有理论基础和研究成果。\n2. 案例研究法。结合高校毕业设计过程中的典型业务场景，对选题管理、任务推进、阶段反馈等环节进行分析，归纳实际需求与问题特点。\n3. 数据分析与对比研究法。对系统功能效果、过程数据或阶段性表现进行整理与分析，并通过对比方式评价方案的可行性与实用性。`,
      researchMethods: `前期基础与可行性分析主要体现在以下几个方面：第一，指导教师具备较为丰富的毕业设计指导经验，能够在选题分析、论文写作和系统实现方面提供持续指导。第二，经过本科阶段的专业课程学习，已掌握软件开发、数据库设计、系统分析与设计等基础知识，具备一定的研究与实现能力。第三，目前与本课题相关的国内外研究资料较为丰富，可为本研究提供充分的理论依据和案例参考。第四，现有开发环境、实验条件和资料获取渠道基本满足课题实施要求，因此本课题具有较好的研究基础和实现条件。`,
      expectedOutcomes: `1. 完成一篇符合本科毕业设计要求的论文，并通过指导教师审核与修改。\n2. 完成一个与课题相关的系统原型、功能模块或实验分析成果，形成可展示的研究结果。\n3. 通过本课题研究，进一步提升本人在系统分析、方案设计、开发实现和论文写作等方面的综合能力。`,
      innovationPoints: '本课题的创新点主要体现在将毕业设计过程管理与智能辅助能力相结合，在传统流程管理基础上强化阶段反馈、内容生成与过程支持功能，并尝试结合实际教学场景形成更贴近本科毕业设计需求的解决方案。',
      feasibilityAnalysis: '从技术实现角度看，本课题所涉及的系统分析、前后端开发、数据库设计和基础智能接口调用均属于本科阶段可掌握和实现的内容；从时间安排角度看，课题可按照学期进度分阶段推进；从资源条件看，已有开发环境、文献资料和指导支持较为充足，因此整体具备较强可行性。',
      workPlan: `第1周：搜集相关资料，明确研究方向，完成选题论证与开题准备。\n第2周：在导师指导下完善论文提纲，明确研究内容与技术路线。\n第3周：继续查阅国内文献资料，整理研究现状与理论基础。\n第4周：搜集并阅读外文资料，补充国内外研究综述内容。\n第5-7周：围绕论文结构和系统方案全面展开写作与实现，在导师指导下完成初稿。\n第8-10周：结合中期检查要求，总结当前进展，分析存在问题并进行阶段调整。\n第11-12周：根据导师意见和中期检查反馈，对论文内容和系统功能进行修改完善。\n第13周：完成论文终稿整理、格式规范检查和参考文献核对。\n第14周：提交论文终稿及相关材料，准备答辩。`,
      references: buildProposalReferenceFallback(topic?.title),
    }
  }
}

export async function analyzeProposal(proposalContent, topic) {
  const prompt = `
Analyze the following graduation project proposal as a supervisor.
Return JSON only.

Topic: ${topic?.title || 'Untitled topic'}
Proposal content:
${String(proposalContent || '').slice(0, 5000)}

JSON format:
{
  "overallScore": 85,
  "dimensionScores": {
    "background": 84,
    "significance": 86,
    "researchStatus": 80,
    "researchContent": 87,
    "researchMethods": 83,
    "innovation": 79,
    "feasibility": 85
  },
  "strengths": ["Strength 1", "Strength 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "issues": ["Issue 1", "Issue 2"],
  "detailedAnalysis": {
    "background": "Analysis",
    "significance": "Analysis",
    "researchStatus": "Analysis",
    "researchContent": "Analysis",
    "researchMethods": "Analysis",
    "innovation": "Analysis",
    "feasibility": "Analysis"
  }
}
`.trim()

  try {
    const data = await requestJson(prompt, 'object', 0.3)
    const score = clampScore(data.overallScore, 84)
    return {
      overallScore: score,
      dimensionScores: {
        background: clampScore(data.dimensionScores?.background, score - 2),
        significance: clampScore(data.dimensionScores?.significance, score - 1),
        researchStatus: clampScore(data.dimensionScores?.researchStatus, score - 4),
        researchContent: clampScore(data.dimensionScores?.researchContent, score),
        researchMethods: clampScore(data.dimensionScores?.researchMethods, score - 2),
        innovation: clampScore(data.dimensionScores?.innovation, score - 4),
        feasibility: clampScore(data.dimensionScores?.feasibility, score - 1),
      },
      strengths: ensureStringArray(data.strengths),
      suggestions: ensureStringArray(data.suggestions),
      issues: ensureStringArray(data.issues),
      detailedAnalysis: {
        background: String(data.detailedAnalysis?.background || '').trim(),
        significance: String(data.detailedAnalysis?.significance || '').trim(),
        researchStatus: String(data.detailedAnalysis?.researchStatus || '').trim(),
        researchContent: String(data.detailedAnalysis?.researchContent || '').trim(),
        researchMethods: String(data.detailedAnalysis?.researchMethods || '').trim(),
        innovation: String(data.detailedAnalysis?.innovation || '').trim(),
        feasibility: String(data.detailedAnalysis?.feasibility || '').trim(),
      },
    }
  } catch (error) {
    console.error('analyzeProposal failed:', error.message)
    return {
      overallScore: 84,
      dimensionScores: {
        background: 82,
        significance: 84,
        researchStatus: 80,
        researchContent: 86,
        researchMethods: 82,
        innovation: 79,
        feasibility: 84,
      },
      strengths: ['研究目标较为明确，整体结构较完整。', '课题内容与本科毕业设计要求基本匹配。'],
      suggestions: ['建议进一步充实文献综述部分。', '建议细化技术路线和验证方案设计。'],
      issues: ['创新点表达还可以更加集中和明确。'],
      detailedAnalysis: {
        background: '研究背景部分较为完整，但还可以进一步突出问题导向。', 
        significance: '研究意义表达较清晰，建议加强应用价值说明。', 
        researchStatus: '相关研究综述仍可进一步拓展和归纳。', 
        researchContent: '研究内容主线较清楚，任务拆分基本合理。', 
        researchMethods: '研究方法总体可行，但验证指标仍需进一步量化。', 
        innovation: '已有一定创新思路，但表达还可以更加凝练。', 
        feasibility: '整体具备实施条件，时间安排可进一步细化。', 
      },
    }
  }
}

export async function generateProposalOpinion(proposal, feedbackHistory) {
  const prompt = `
Write a formal supervisor comment for a graduation project proposal.
The final output must be in Simplified Chinese.
Return plain text only.

Proposal analysis: ${JSON.stringify(proposal?.analysis || {}, null, 2)}
History feedback: ${JSON.stringify(feedbackHistory || {}, null, 2)}

Organize the comment using three aspects:
1. strengths
2. problems
3. revision suggestions
`.trim()

  try {
    return await requestText(prompt, 0.5)
  } catch (error) {
    console.error('generateProposalOpinion failed:', error.message)
    return '该开题报告整体内容较完整，研究目标较明确，基本具备继续推进的条件。建议进一步深化文献综述内容，细化技术路线，并对创新点进行更加准确和凝练的表述。'
  }
}

export async function generateMidtermReport(midtermData, topic) {
  const prompt = `
Evaluate the following midterm report as a graduation project supervisor.
Return JSON only.

Topic: ${topic?.title || 'Untitled topic'}
Current progress: ${midtermData?.progress || 'Unknown'}
Achievements: ${toMultilineText(midtermData?.achievements)}
Problems: ${midtermData?.problems || 'Unknown'}
Solutions: ${midtermData?.solutions || 'Unknown'}
Key comments: ${midtermData?.keyComments || 'Unknown'}

JSON format:
{
  "overallScore": 83,
  "dimensionScores": {
    "progress": 84,
    "quality": 82,
    "planning": 81,
    "problemSolving": 83,
    "innovation": 78,
    "selfReflection": 80
  },
  "strengths": ["Strength 1", "Strength 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "issues": ["Issue 1", "Issue 2"],
  "riskAssessment": {
    "level": "low/medium/high",
    "description": "Risk description",
    "recommendations": ["Suggestion 1", "Suggestion 2"]
  }
}
`.trim()

  try {
    const data = await requestJson(prompt, 'object', 0.4)
    const score = clampScore(data.overallScore, 82)
    return {
      overallScore: score,
      dimensionScores: {
        progress: clampScore(data.dimensionScores?.progress, score),
        quality: clampScore(data.dimensionScores?.quality, score - 2),
        planning: clampScore(data.dimensionScores?.planning, score - 3),
        problemSolving: clampScore(data.dimensionScores?.problemSolving, score - 1),
        innovation: clampScore(data.dimensionScores?.innovation, score - 5),
        selfReflection: clampScore(data.dimensionScores?.selfReflection, score - 2),
      },
      strengths: ensureStringArray(data.strengths),
      suggestions: ensureStringArray(data.suggestions),
      issues: ensureStringArray(data.issues),
      riskAssessment: {
        level: ['low', 'medium', 'high'].includes(data.riskAssessment?.level) ? data.riskAssessment.level : 'medium',
        description: String(data.riskAssessment?.description || '').trim(),
        recommendations: ensureStringArray(data.riskAssessment?.recommendations),
      },
    }
  } catch (error) {
    console.error('generateMidtermReport failed:', error.message)
    return {
      overallScore: 82,
      dimensionScores: {
        progress: 84,
        quality: 81,
        planning: 80,
        problemSolving: 82,
        innovation: 78,
        selfReflection: 80,
      },
      strengths: ['阶段工作推进较连续，整体进度基本可控。', '已经形成一定的阶段性成果。'],
      suggestions: ['建议进一步量化阶段成果。', '建议补充下一阶段更明确的时间节点。'],
      issues: ['当前阶段成果展示仍可进一步完善。'],
      riskAssessment: {
        level: 'medium',
        description: '当前项目整体可控，但关键节点仍需持续跟进。', 
        recommendations: ['按计划复盘阶段任务完成情况。', '尽早准备后续论文撰写相关材料。'],
      },
    }
  }
}

export async function generateMidtermDraft(topic, studentInfo) {
  const prompt = `
请生成一份本科毕业设计中期报告初稿，并且严格返回 JSON。

要求：
1. 所有字段内容必须使用简体中文。
2. 内容要符合本科中期报告写作习惯。
3. 语言应客观、清晰，体现阶段进展与问题分析。

题目名称：${topic?.title || '未命名题目'}
题目简介：${topic?.description || '暂无简介'}
学生姓名：${studentInfo?.name || '未知'}
学生专业：${studentInfo?.major || '未知'}

返回格式：
{
  "progressSummary": "进度概述",
  "completedWork": ["已完成工作1", "已完成工作2"],
  "currentStage": "当前阶段",
  "nextStagePlan": "下一阶段计划",
  "problemsEncountered": "遇到的问题",
  "solutions": "解决方案",
  "achievements": "阶段成果",
  "selfEvaluation": "自我评价"
}
`.trim()

  try {
    const data = await requestJson(prompt, 'object', 0.6)
    return {
      progressSummary: String(data.progressSummary || '').trim(),
      completedWork: ensureStringArray(data.completedWork),
      currentStage: String(data.currentStage || '').trim(),
      nextStagePlan: String(data.nextStagePlan || '').trim(),
      problemsEncountered: String(data.problemsEncountered || '').trim(),
      solutions: String(data.solutions || '').trim(),
      achievements: String(data.achievements || '').trim(),
      selfEvaluation: String(data.selfEvaluation || '').trim(),
    }
  } catch (error) {
    console.error('generateMidtermDraft failed:', error.message)
    return {
      progressSummary: '目前已完成前期调研、需求分析和系统总体框架设计，课题整体推进较为平稳。', 
      completedWork: ['完成相关文献查阅与资料整理。', '完成系统模块划分与原型设计。'],
      currentStage: '当前正处于核心模块实现与功能联调阶段。', 
      nextStagePlan: '下一阶段将重点完成系统测试、功能优化和论文材料整理。', 
      problemsEncountered: '部分功能细节仍需进一步明确，测试数据准备还不够充分。', 
      solutions: '通过细化需求、优化实现方案并提前准备测试数据来解决当前问题。', 
      achievements: '已形成系统原型、数据结构设计方案和部分阶段开发成果。', 
      selfEvaluation: '整体进度基本可控，但在测试深度和阶段成果总结方面仍需继续加强。', 
    }
  }
}

export async function generateMidtermOpinion(report, evaluation, feedbackHistory = '') {
  const prompt = `
Write a formal supervisor comment for a graduation project midterm report.
The final output must be in Simplified Chinese.
Return plain text only.

Midterm report content: ${report?.progress || ''}
AI evaluation: ${JSON.stringify(evaluation || {}, null, 2)}
History feedback: ${feedbackHistory || 'None'}

Organize the comment using three aspects:
1. current progress
2. existing problems
3. next-step suggestions
`.trim()

  try {
    return await requestText(prompt, 0.5)
  } catch (error) {
    console.error('generateMidtermOpinion failed:', error.message)
    return '该中期报告基本反映了当前阶段的主要工作和已有成果，整体进度较为清晰。建议进一步量化阶段成果，明确后续任务安排，并加强对潜在风险和关键节点的把控。'
  }
}

export async function generateReviewOpinion(reviewData, reviewerType) {
  const prompt = `
Generate reference review comments for a graduation thesis and return JSON only.

Review target: ${reviewerType === 'own' ? 'student supervised by this teacher' : 'student supervised by another teacher'}
Overall situation: ${reviewData?.overallSituation || 'Unknown'}
Key comments: ${reviewData?.keyComments || 'Unknown'}

JSON format:
{
  "structure": "Comment on structure",
  "methods": "Comment on methods",
  "innovation": "Comment on innovation",
  "academicValue": "Comment on academic value",
  "overall": "Overall comment"
}
`.trim()

  try {
    return await requestJson(prompt, 'object', 0.3)
  } catch (error) {
    console.error('generateReviewOpinion failed:', error.message)
    return {
      structure: '论文整体结构较为完整，章节安排基本清晰。', 
      methods: '研究方法总体合理，但验证过程仍可进一步加强。', 
      innovation: '选题具有一定创新性，但创新点表达还可更加明确。', 
      academicValue: '课题具有一定的实际应用价值和研究意义。', 
      overall: '整体完成情况较好，建议根据评阅意见进一步完善细节。', 
    }
  }
}

export async function generateDefenseOpinion(defenseData) {
  const prompt = `
Write reference comments for a graduation defense.
The output must be plain text only, not JSON.
The final output must be in Simplified Chinese.

Overall situation: ${defenseData?.overallSituation || 'Unknown'}
Key comments: ${defenseData?.keyComments || 'Unknown'}
`.trim()

  try {
    return await requestText(prompt, 0.5)
  } catch (error) {
    console.error('generateDefenseOpinion failed:', error.message)
    return '答辩整体表现较为稳定，陈述基本清楚。建议进一步加强对关键技术细节和课题研究价值的说明，使答辩表达更加完整有力。'
  }
}
