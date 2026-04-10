import React, { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Collapse, Form, Input, Progress, Row, Space, Spin, Tag, Upload, message } from 'antd'
import type { UploadProps } from 'antd'
import { RobotOutlined, SaveOutlined, SendOutlined, UploadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { studentAPI } from '../../utils/api'

const { TextArea } = Input

interface MidtermReport {
  id?: string
  title: string
  studentName: string
  studentId: string
  supervisor: string
  topic: string
  progressSummary: string
  completedWork: string[]
  currentStage: string
  nextStagePlan: string
  problemsEncountered: string
  solutions: string
  achievements: string
  selfEvaluation: string
  supervisorFeedback?: string
  overallProgress: number
  stageProgress: {
    literature: number
    methodology: number
    experiment: number
    writing: number
  }
  status: string
}

const statusMap: Record<string, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  pending: { color: 'processing', text: '待审核' },
  submitted: { color: 'processing', text: '已提交' },
  approved: { color: 'success', text: '已通过' },
  rejected: { color: 'error', text: '未通过' },
  needs_revision: { color: 'warning', text: '退回修改' },
}

const stageLabelMap: Record<string, string> = {
  literature: '文献调研',
  methodology: '方案设计',
  experiment: '系统实现',
  writing: '论文撰写',
}

const MidtermReportGeneration: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [report, setReport] = useState<MidtermReport | null>(null)
  const navigate = useNavigate()
  const studentId = ''

  useEffect(() => {
    void fetchReport()
  }, [])

  const fillForm = (data: MidtermReport) => {
    form.setFieldsValue({
      progressSummary: data.progressSummary,
      completedWork: data.completedWork?.join('\n') || '',
      currentStage: data.currentStage,
      nextStagePlan: data.nextStagePlan,
      problemsEncountered: data.problemsEncountered,
      solutions: data.solutions,
      achievements: data.achievements,
      selfEvaluation: data.selfEvaluation,
    })
  }

  const fetchReport = async () => {
    try {
      setLoading(true)
      const response = await studentAPI.getMidtermReport(studentId)
      if (response.success && response.data) {
        setReport(response.data)
        fillForm(response.data)
      }
    } catch (error) {
      console.error('获取中期报告失败:', error)
      message.error('获取中期报告失败')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      const response = await studentAPI.generateMidtermReport(studentId)
      if (!response.success || !response.data) {
        message.error('中期报告生成失败')
        return
      }

      setReport(response.data)
      fillForm(response.data)
      message.success('中期报告已生成')
    } catch (error: any) {
      console.error('生成中期报告失败:', error)
      message.error(error?.response?.data?.message || '中期报告生成失败。若持续失败，请先查看 AI 连通性检测页。')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields()
      const response = await studentAPI.saveMidtermReportDraft(studentId, {
        ...values,
        completedWork: values.completedWork ? String(values.completedWork).split('\n').filter((item: string) => item.trim()) : [],
      })
      if (!response.success) {
        message.error('保存草稿失败')
        return
      }

      message.success('中期报告草稿已保存')
      await fetchReport()
    } catch (error) {
      console.error('保存中期报告失败:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const response = await studentAPI.submitMidtermReport(studentId, {
        ...values,
        completedWork: values.completedWork ? String(values.completedWork).split('\n').filter((item: string) => item.trim()) : [],
      })
      if (!response.success) {
        message.error('提交中期报告失败')
        return
      }

      message.success('中期报告已提交，请等待教师审核')
      await fetchReport()
    } catch (error: any) {
      console.error('提交中期报告失败:', error)
      message.error(error?.response?.data?.message || '提交中期报告失败')
    } finally {
      setSubmitting(false)
    }
  }

  const uploadProps: UploadProps = {
    showUploadList: false,
    beforeUpload: (file) => {
      const isWord = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword'
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
        const response = await studentAPI.uploadFile(file as File, 'midterm')
        if (!response.success || !response.data) {
          onError?.(new Error('导入中期报告失败'))
          return
        }
        setReport(response.data)
        fillForm(response.data)
        message.success('中期报告已导入')
        onSuccess?.(response.data)
      } catch (error) {
        console.error('上传中期报告失败:', error)
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
      <Card title="中期报告智能生成" className="mb-24">
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="中期报告会结合当前课题进展，由 AI 生成一份可继续编辑的初稿。"
          description={
            <Space wrap>
              <span>如果生成无响应或网络报错，请先查看 AI 连通性检测。</span>
              <Button type="link" onClick={() => navigate('/student/ai-status')} style={{ padding: 0 }}>
                打开检测页
              </Button>
            </Space>
          }
        />

        {report ? (
          <Alert
            style={{ marginBottom: 16 }}
            type="info"
            showIcon
            message="当前中期报告状态"
            description={
              <div>
                <p>状态：<Tag color={statusMap[report.status]?.color}>{statusMap[report.status]?.text || report.status}</Tag></p>
                {report.supervisorFeedback ? <p>教师反馈：{report.supervisorFeedback}</p> : null}
              </div>
            }
          />
        ) : null}

        <Row gutter={16}>
          <Col span={12}>
            <Button type="primary" icon={<RobotOutlined />} loading={generating} onClick={() => void handleGenerate()} block size="large">
              智能生成中期报告
            </Button>
          </Col>
          <Col span={12}>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} block size="large">
                上传已有中期报告
              </Button>
            </Upload>
          </Col>
        </Row>
      </Card>

      {report ? (
        <Card title="进度概览" className="mb-24">
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <h4>总体进度</h4>
                <Progress type="dashboard" percent={report.overallProgress} status={report.overallProgress >= 100 ? 'success' : 'active'} />
              </div>
            </Col>
            <Col xs={24} md={16}>
              <h4>阶段进展</h4>
              {Object.entries(report.stageProgress).map(([key, value]) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{stageLabelMap[key] || key}</span>
                    <span>{value}%</span>
                  </div>
                  <Progress percent={value} />
                </div>
              ))}
            </Col>
          </Row>
        </Card>
      ) : null}

      <Card title="中期报告内容编辑">
        <Form form={form} layout="vertical">
          <Collapse
            defaultActiveKey={['progress', 'problem', 'summary']}
            items={[
              {
                key: 'progress',
                label: '进展总结',
                children: (
                  <>
                    <Form.Item label="进度概述" name="progressSummary" rules={[{ required: true, message: '请输入进度概述' }]}>
                      <TextArea rows={4} placeholder="概括目前项目推进情况，说明整体完成到什么程度。" />
                    </Form.Item>
                    <Form.Item label="已完成工作" name="completedWork" rules={[{ required: true, message: '请输入已完成工作' }]} help="每行填写一项已完成工作。">
                      <TextArea rows={6} placeholder={'1. 完成需求分析\n2. 完成数据库设计\n3. 完成核心模块原型开发'} />
                    </Form.Item>
                    <Form.Item label="当前阶段" name="currentStage" rules={[{ required: true, message: '请输入当前阶段' }]}>
                      <TextArea rows={3} placeholder="说明目前处于哪个阶段，以及当前正在推进的重点工作。" />
                    </Form.Item>
                    <Form.Item label="下一阶段计划" name="nextStagePlan" rules={[{ required: true, message: '请输入下一阶段计划' }]}>
                      <TextArea rows={3} placeholder="说明下一阶段目标、时间安排和关键任务。" />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'problem',
                label: '问题与解决方案',
                children: (
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item label="遇到的问题" name="problemsEncountered" rules={[{ required: true, message: '请输入遇到的问题' }]}>
                        <TextArea rows={4} placeholder="描述研究或开发过程中遇到的主要困难。" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="解决方案" name="solutions" rules={[{ required: true, message: '请输入解决方案' }]}>
                        <TextArea rows={4} placeholder="说明针对上述问题已经采取或计划采取的解决办法。" />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'summary',
                label: '阶段成果与自我评价',
                children: (
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item label="阶段成果" name="achievements" rules={[{ required: true, message: '请输入阶段成果' }]}>
                        <TextArea rows={4} placeholder="描述目前已取得的阶段性成果，如实验结果、原型系统、论文材料等。" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="自我评价" name="selfEvaluation" rules={[{ required: true, message: '请输入自我评价' }]}>
                        <TextArea rows={4} placeholder="从进度、质量、问题意识和后续安排等方面进行总结。" />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
            ]}
          />
        </Form>

        <div style={{ marginTop: 24 }}>
          <Space wrap>
            <Button type="primary" icon={<SaveOutlined />} onClick={() => void handleSaveDraft()}>
              保存草稿
            </Button>
            <Button type="primary" icon={<SendOutlined />} loading={submitting} onClick={() => void handleSubmit()} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>
              提交审核
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  )
}

export default MidtermReportGeneration
