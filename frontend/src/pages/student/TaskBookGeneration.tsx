import React, { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Collapse, Form, Input, Row, Space, Spin, Tag, Upload, message } from 'antd'
import type { UploadProps } from 'antd'
import { FileTextOutlined, RobotOutlined, SaveOutlined, SendOutlined, UploadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { studentAPI } from '../../utils/api'

const { TextArea } = Input

interface TaskBook {
  id?: string
  title: string
  researchPurpose: string
  researchSignificance: string
  researchContent: string
  researchMethods: string
  priorFoundation?: string
  expectedOutcomes?: string
  progressSchedule: string
  references: string[]
  status: string
  feedback?: string
}

const statusMap: Record<string, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  pending: { color: 'processing', text: '待审核' },
  submitted: { color: 'processing', text: '已提交' },
  approved: { color: 'success', text: '已通过' },
  rejected: { color: 'error', text: '未通过' },
  needs_revision: { color: 'warning', text: '退回修改' },
}

const TaskBookGeneration: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [taskBook, setTaskBook] = useState<TaskBook | null>(null)
  const navigate = useNavigate()
  const studentId = ''

  useEffect(() => {
    void fetchTaskBook()
  }, [])

  const fillForm = (data: TaskBook) => {
    form.setFieldsValue({
      title: data.title,
      researchPurpose: data.researchPurpose,
      researchSignificance: data.researchSignificance,
      researchContent: data.researchContent,
      researchMethods: data.researchMethods,
      priorFoundation: data.priorFoundation,
      expectedOutcomes: data.expectedOutcomes,
      progressSchedule: data.progressSchedule,
      references: data.references?.join('\n') || '',
    })
  }

  const fetchTaskBook = async () => {
    try {
      setLoading(true)
      const response = await studentAPI.getTaskBook(studentId)
      if (response.success && response.data) {
        setTaskBook(response.data)
        fillForm(response.data)
      }
    } catch (error) {
      console.error('获取任务书失败', error)
      message.error('获取任务书失败')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      const response = await studentAPI.generateTaskBook(studentId)
      if (!response.success || !response.data) {
        message.error('任务书生成失败')
        return
      }

      setTaskBook(response.data)
      fillForm(response.data)
      message.success('任务书已生成')
    } catch (error: any) {
      console.error('生成任务书失败', error)
      message.error(error?.response?.data?.message || '任务书生成失败。若持续失败，请先查看 AI 连通性检测页面。')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields()
      const response = await studentAPI.saveTaskBookDraft(studentId, {
        ...values,
        references: values.references ? String(values.references).split('\n').filter((item: string) => item.trim()) : [],
      })
      if (!response.success) {
        message.error('保存草稿失败')
        return
      }

      message.success('任务书草稿已保存')
      await fetchTaskBook()
    } catch (error) {
      console.error('保存任务书失败', error)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const response = await studentAPI.submitTaskBook(studentId, {
        ...values,
        references: values.references ? String(values.references).split('\n').filter((item: string) => item.trim()) : [],
      })
      if (!response.success) {
        message.error('提交任务书失败')
        return
      }

      message.success('任务书已提交，请等待教师审核')
      await fetchTaskBook()
    } catch (error: any) {
      console.error('提交任务书失败', error)
      message.error(error?.response?.data?.message || '提交任务书失败')
    } finally {
      setSubmitting(false)
    }
  }

  const uploadProps: UploadProps = {
    showUploadList: false,
    beforeUpload: (file) => {
      const isWord =
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/msword'
      if (!isWord) {
        message.error('仅支持上传 Word 文档')
        return false
      }
      if (file.size / 1024 / 1024 >= 10) {
        message.error('文件大小不能超过 10MB')
        return false
      }
      return true
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        const response = await studentAPI.uploadFile(file as File, 'taskbook')
        if (!response.success || !response.data) {
          onError?.(new Error('导入任务书失败'))
          return
        }
        setTaskBook(response.data)
        fillForm(response.data)
        message.success('任务书已导入')
        onSuccess?.(response.data)
      } catch (error) {
        console.error('上传任务书失败', error)
        onError?.(error as Error)
      }
    },
  }

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '56px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="page-container">
      <Card title="任务书智能生成" className="mb-24">
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="任务书会基于当前已选定的毕业设计题目，按学校任务书模板生成初稿。"
          description={
            <Space wrap>
              <span>如果生成过程长期无返回或提示网络连接问题，请先查看 AI 连通性检测。</span>
              <Button type="link" onClick={() => navigate('/student/ai-status')} style={{ padding: 0 }}>
                打开检测页
              </Button>
            </Space>
          }
        />

        {taskBook ? (
          <Alert
            style={{ marginBottom: 16 }}
            type="info"
            showIcon
            message="当前任务书状态"
            description={
              <div>
                <p>
                  状态：
                  <Tag color={statusMap[taskBook.status]?.color}>{statusMap[taskBook.status]?.text || taskBook.status}</Tag>
                </p>
                {taskBook.feedback ? <p>教师反馈：{taskBook.feedback}</p> : null}
              </div>
            }
          />
        ) : null}

        <Row gutter={16}>
          <Col span={12}>
            <Button type="primary" icon={<RobotOutlined />} loading={generating} onClick={() => void handleGenerate()} block size="large">
              智能生成任务书
            </Button>
          </Col>
          <Col span={12}>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} block size="large">
                上传已有任务书
              </Button>
            </Upload>
          </Col>
        </Row>
      </Card>

      <Card title="任务书内容编辑" className="mb-24">
        <Form form={form} layout="vertical">
          <Collapse
            defaultActiveKey={['basic', 'purpose', 'content']}
            items={[
              {
                key: 'basic',
                label: '题目信息',
                children: (
                  <Form.Item label="题目名称" name="title" rules={[{ required: true, message: '请输入题目名称' }]}>
                    <Input placeholder="请输入毕业设计题目名称" />
                  </Form.Item>
                ),
              },
              {
                key: 'purpose',
                label: '主要任务',
                children: (
                  <Form.Item
                    label="主要任务"
                    name="researchPurpose"
                    extra="建议按编号方式填写，围绕调查研究、资料分析、论文或系统完成等任务展开。"
                    rules={[{ required: true, message: '请输入主要任务' }]}
                  >
                    <TextArea rows={8} placeholder="示例：1. 开展文献调研与资料收集。2. 完成研究分析与方案设计。3. 形成论文或系统成果并完成总结。" />
                  </Form.Item>
                ),
              },
              {
                key: 'significance',
                label: '目的',
                children: (
                  <Form.Item
                    label="目的"
                    name="researchSignificance"
                    extra="建议按编号方式填写，突出知识巩固、科研训练和专业认知提升等目标。"
                    rules={[{ required: true, message: '请输入目的' }]}
                  >
                    <TextArea rows={8} placeholder="示例：1. 巩固专业知识。2. 培养科研素养与创新能力。3. 提升对专业前沿的认识。" />
                  </Form.Item>
                ),
              },
              {
                key: 'content',
                label: '主要内容',
                children: (
                  <Form.Item
                    label="主要内容"
                    name="researchContent"
                    extra="建议覆盖绪论、文献综述、研究方法与设计、研究结果与分析、结论与展望。"
                    rules={[{ required: true, message: '请输入主要内容' }]}
                  >
                    <TextArea rows={10} placeholder="按章节或模块说明毕业论文（设计）的主要内容，可按 1-5 点展开。" />
                  </Form.Item>
                ),
              },
              {
                key: 'methods',
                label: '基本要求',
                children: (
                  <Form.Item
                    label="基本要求"
                    name="researchMethods"
                    extra="建议写明字数要求、格式规范、内容质量和学术规范等基本要求。"
                    rules={[{ required: true, message: '请输入基本要求' }]}
                  >
                    <TextArea rows={8} placeholder="说明论文（设计）在篇幅、结构、排版、内容质量和学术规范方面应满足的要求。" />
                  </Form.Item>
                ),
              },
              {
                key: 'foundation',
                label: '前期基础与预期成果',
                children: (
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="前期基础"
                        name="priorFoundation"
                        extra="可从知识储备、实践经验、技能水平等方面说明。"
                        rules={[{ required: true, message: '请输入前期基础' }]}
                      >
                        <TextArea rows={8} placeholder="说明已具备的课程基础、实践经历、工具使用能力和相关准备条件。" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="预期成果"
                        name="expectedOutcomes"
                        extra="可从论文（设计）成果、学术成果和其他成果三个角度展开。"
                        rules={[{ required: true, message: '请输入预期成果' }]}
                      >
                        <TextArea rows={8} placeholder="说明最终拟完成的论文、系统、作品、实验结果或其他可展示成果。" />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'schedule',
                label: '工作进度安排',
                children: (
                  <Form.Item
                    label="工作进度安排"
                    name="progressSchedule"
                    extra="建议按阶段逐行填写，每行可包含阶段名称、时间、主要内容和步骤。"
                    rules={[{ required: true, message: '请输入工作进度安排' }]}
                  >
                    <TextArea rows={10} placeholder="示例：第一阶段：选题与开题：第1-2周：完成选题论证、资料查阅、开题报告撰写与答辩准备。" />
                  </Form.Item>
                ),
              },
              {
                key: 'references',
                label: '参考文献',
                children: (
                  <Form.Item
                    label="参考文献"
                    name="references"
                    help="使用论文、开题报告中的参考文献，并确保格式规范。以下内容仅作格式参考，每行填写一条。"
                  >
                    <TextArea rows={8} placeholder="[1] 作者. 文献题名[J]. 期刊名, 2024.\n[2] 作者. 书名[M]. 出版地: 出版社, 2023." />
                  </Form.Item>
                ),
              },
            ]}
          />
        </Form>
      </Card>

      <Card>
        <Space wrap>
          <Button type="primary" icon={<SaveOutlined />} onClick={() => void handleSaveDraft()}>
            保存草稿
          </Button>
          <Button type="primary" icon={<SendOutlined />} loading={submitting} onClick={() => void handleSubmit()} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>
            提交审核
          </Button>
          <Button icon={<FileTextOutlined />} onClick={() => void fetchTaskBook()}>
            刷新内容
          </Button>
        </Space>
      </Card>
    </div>
  )
}

export default TaskBookGeneration
