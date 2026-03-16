import React, { useEffect, useState } from 'react'
import { Badge, Button, Card, Col, Collapse, Descriptions, Divider, Form, Input, message, Modal, Progress, Row, Space, Table, Tag, Timeline } from 'antd'
import { CheckCircleOutlined, CheckOutlined, CloseOutlined, EditOutlined, EyeOutlined, RobotOutlined } from '@ant-design/icons'
import { teacherAPI } from '../../utils/api'

const { TextArea } = Input

interface MidtermEvaluation {
  overallScore: number
  dimensionScores: {
    progress: number
    quality: number
    planning: number
    problemSolving: number
    innovation: number
    selfReflection: number
  }
  suggestions: string[]
  strengths: string[]
  riskAssessment: {
    level: 'low' | 'medium' | 'high'
    description: string
    recommendations: string[]
  }
}

interface MidtermReport {
  id: string
  studentId: string
  studentName: string
  studentMajor: string
  topicTitle: string
  content: {
    progressSummary: string
    completedWork: string
    currentStage: string
    nextStagePlan: string
    problemsAndSolutions: string
    achievements: string
    selfEvaluation: string
    progressPercentage: number
    keyMilestones: {
      title: string
      description: string
      completed: boolean
      completionDate?: string
    }[]
  }
  status: 'pending' | 'approved' | 'needs_revision' | 'rejected'
  submitTime: string
  teacherFeedback?: string
  aiEvaluation?: MidtermEvaluation
}

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'processing', text: '待审核' },
  approved: { color: 'success', text: '已通过' },
  needs_revision: { color: 'warning', text: '退回修改' },
  rejected: { color: 'error', text: '已拒绝' },
}

const getScoreColor = (score: number) => {
  if (score >= 90) return '#52c41a'
  if (score >= 80) return '#1677ff'
  if (score >= 70) return '#faad14'
  return '#f5222d'
}

const riskColorMap: Record<'low' | 'medium' | 'high', string> = {
  low: 'green',
  medium: 'orange',
  high: 'red',
}

const renderSection = (text?: string) => <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{text || '暂无内容'}</div>

const MidtermReportReview: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null)
  const [generatingOpinion, setGeneratingOpinion] = useState(false)
  const [reports, setReports] = useState<MidtermReport[]>([])
  const [selectedReport, setSelectedReport] = useState<MidtermReport | null>(null)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [feedbackForm] = Form.useForm()
  const teacherId = 'T001'

  useEffect(() => {
    void fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await teacherAPI.getPendingMidtermReports(teacherId)
      if (response.success && response.data) {
        setReports(response.data)
      } else {
        message.error('获取中期报告列表失败')
      }
    } catch (error) {
      console.error('获取中期报告列表失败:', error)
      message.error('获取中期报告列表失败')
    } finally {
      setLoading(false)
    }
  }

  const updateReport = (reportId: string, updater: (item: MidtermReport) => MidtermReport) => {
    setReports((current) => current.map((item) => (item.id === reportId ? updater(item) : item)))
    setSelectedReport((current) => {
      if (!current || current.id !== reportId) return current
      return updater(current)
    })
  }

  const openReviewModal = (report: MidtermReport, action: 'approved' | 'needs_revision' | 'rejected' = 'needs_revision') => {
    setSelectedReport(report)
    feedbackForm.setFieldsValue({
      feedback: report.teacherFeedback || '',
      action,
    })
    setReviewModalVisible(true)
  }

  const handleAiEvaluation = async (report: MidtermReport) => {
    try {
      setEvaluatingId(report.id)
      const response = await teacherAPI.evaluateMidtermReport(report.id)
      if (!response.success || !response.data) {
        message.error('AI 评分失败')
        return
      }

      updateReport(report.id, (item) => ({ ...item, aiEvaluation: response.data }))
      message.success('AI 评分已完成')
    } catch (error) {
      console.error('AI 评分中期报告失败:', error)
      message.error('AI 评分失败')
    } finally {
      setEvaluatingId(null)
    }
  }

  const handleGenerateOpinion = async () => {
    if (!selectedReport) return

    try {
      setGeneratingOpinion(true)
      const response = await teacherAPI.generateMidtermOpinion(selectedReport.id)
      if (!response.success || !response.data?.opinion) {
        message.error('AI 评语生成失败')
        return
      }

      feedbackForm.setFieldValue('feedback', response.data.opinion)
      if (response.data.evaluation) {
        updateReport(selectedReport.id, (item) => ({ ...item, aiEvaluation: response.data.evaluation }))
      }
      message.success('AI 评语已生成，可继续修改')
    } catch (error) {
      console.error('AI 生成评语失败:', error)
      message.error('AI 评语生成失败')
    } finally {
      setGeneratingOpinion(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!selectedReport) return

    try {
      const values = await feedbackForm.validateFields()
      const response = await teacherAPI.reviewMidtermReport({
        reportId: selectedReport.id,
        teacherId,
        status: values.action,
        feedback: values.feedback,
      })

      if (!response.success) {
        message.error('提交审核结果失败')
        return
      }

      message.success('中期报告审核已提交')
      setReviewModalVisible(false)
      feedbackForm.resetFields()
      await fetchReports()
    } catch (error) {
      console.error('提交中期报告审核失败:', error)
    }
  }

  const columns = [
    {
      title: '学生信息',
      key: 'student',
      width: 180,
      render: (_: unknown, record: MidtermReport) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.studentName}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.studentId} / {record.studentMajor}</div>
        </div>
      ),
    },
    {
      title: '中期主题',
      key: 'topic',
      width: 260,
      render: (_: unknown, record: MidtermReport) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.topicTitle}</div>
          <div style={{ fontSize: 12, color: '#666' }}>当前进度 {record.content.progressPercentage || 0}%</div>
        </div>
      ),
    },
    {
      title: 'AI 评分',
      key: 'aiEvaluation',
      width: 200,
      render: (_: unknown, record: MidtermReport) =>
        record.aiEvaluation ? (
          <div>
            <Tag color={getScoreColor(record.aiEvaluation.overallScore)}>{record.aiEvaluation.overallScore} 分</Tag>
            <Tag color={riskColorMap[record.aiEvaluation.riskAssessment.level]}>
              {record.aiEvaluation.riskAssessment.level === 'low' ? '低风险' : record.aiEvaluation.riskAssessment.level === 'medium' ? '中风险' : '高风险'}
            </Tag>
            <div style={{ fontSize: 12, color: '#52c41a', marginTop: 4 }}>优点 {record.aiEvaluation.strengths.length} 条</div>
          </div>
        ) : (
          <Button
            size="small"
            icon={<RobotOutlined />}
            loading={evaluatingId === record.id}
            onClick={() => void handleAiEvaluation(record)}
          >
            AI 评分
          </Button>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => <Tag color={statusMap[status]?.color}>{statusMap[status]?.text || status}</Tag>,
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      key: 'submitTime',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, record: MidtermReport) => (
        <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => openReviewModal(record)}>
          查看详情
        </Button>
      ),
    },
  ]

  const buildCollapseItems = (report: MidtermReport) => [
    { key: 'progressSummary', label: '进展总结', children: renderSection(report.content.progressSummary) },
    { key: 'completedWork', label: '已完成工作', children: renderSection(report.content.completedWork) },
    { key: 'currentStage', label: '当前阶段', children: renderSection(report.content.currentStage) },
    { key: 'nextStagePlan', label: '下一阶段计划', children: renderSection(report.content.nextStagePlan) },
    { key: 'problemsAndSolutions', label: '问题与解决方案', children: renderSection(report.content.problemsAndSolutions) },
    { key: 'achievements', label: '阶段成果', children: renderSection(report.content.achievements) },
    { key: 'selfEvaluation', label: '自我评价', children: renderSection(report.content.selfEvaluation) },
    {
      key: 'milestones',
      label: '关键里程碑',
      children: (
        <Timeline>
          {report.content.keyMilestones.map((item, index) => (
            <Timeline.Item key={`${item.title}-${index}`} dot={item.completed ? <CheckCircleOutlined /> : undefined} color={item.completed ? 'green' : 'gray'}>
              <div style={{ fontWeight: 600 }}>{item.title}</div>
              <div style={{ color: '#666' }}>{item.description}</div>
              {item.completionDate ? <div style={{ fontSize: 12, color: '#666' }}>{item.completionDate}</div> : null}
            </Timeline.Item>
          ))}
        </Timeline>
      ),
    },
  ]

  return (
    <div className="page-container">
      <Card title="中期报告审核">
        <Space wrap style={{ marginBottom: 16 }}>
          <Badge status="processing" text={`待审核 ${reports.filter((item) => item.status === 'pending').length}`} />
          <Badge status="success" text={`已通过 ${reports.filter((item) => item.status === 'approved').length}`} />
          <Badge status="warning" text={`退回修改 ${reports.filter((item) => item.status === 'needs_revision').length}`} />
          <Badge status="error" text={`已拒绝 ${reports.filter((item) => item.status === 'rejected').length}`} />
        </Space>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={reports}
          loading={loading}
          scroll={{ x: 1040 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title="中期报告详情与审核"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        width={1220}
        footer={null}
      >
        {selectedReport && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="学生姓名">{selectedReport.studentName}</Descriptions.Item>
              <Descriptions.Item label="学号">{selectedReport.studentId}</Descriptions.Item>
              <Descriptions.Item label="专业">{selectedReport.studentMajor}</Descriptions.Item>
              <Descriptions.Item label="选题">{selectedReport.topicTitle}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{new Date(selectedReport.submitTime).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[selectedReport.status]?.color}>{statusMap[selectedReport.status]?.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="当前进度">
                <Progress percent={selectedReport.content.progressPercentage || 0} size="small" />
              </Descriptions.Item>
              <Descriptions.Item label="已完成里程碑">
                {selectedReport.content.keyMilestones.filter((item) => item.completed).length} / {selectedReport.content.keyMilestones.length}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">中期报告内容</Divider>
            <Collapse items={buildCollapseItems(selectedReport)} defaultActiveKey={['progressSummary']} />

            {selectedReport.aiEvaluation && (
              <>
                <Divider orientation="left">AI 评分结果</Divider>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Card size="small" title="综合评分">
                      <div style={{ fontSize: 44, fontWeight: 700, textAlign: 'center', color: getScoreColor(selectedReport.aiEvaluation.overallScore) }}>
                        {selectedReport.aiEvaluation.overallScore}
                      </div>
                    </Card>
                    <Card size="small" title="分项得分" style={{ marginTop: 16 }}>
                      {Object.entries(selectedReport.aiEvaluation.dimensionScores).map(([key, value]) => (
                        <div key={key} style={{ marginBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{key}</span>
                            <span style={{ color: getScoreColor(value) }}>{value} 分</span>
                          </div>
                          <Progress percent={value} showInfo={false} strokeColor={getScoreColor(value)} />
                        </div>
                      ))}
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small" title="风险评估">
                      <div style={{ marginBottom: 12 }}>
                        <Tag color={riskColorMap[selectedReport.aiEvaluation.riskAssessment.level]}>
                          {selectedReport.aiEvaluation.riskAssessment.level === 'low' ? '低风险' : selectedReport.aiEvaluation.riskAssessment.level === 'medium' ? '中风险' : '高风险'}
                        </Tag>
                      </div>
                      <div style={{ marginBottom: 12 }}>{selectedReport.aiEvaluation.riskAssessment.description || '暂无说明'}</div>
                      {selectedReport.aiEvaluation.riskAssessment.recommendations.map((item, index) => (
                        <div key={`${item}-${index}`} style={{ marginBottom: 8 }}>{item}</div>
                      ))}
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small" title="优点与建议">
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>优点</div>
                      {selectedReport.aiEvaluation.strengths.length > 0 ? selectedReport.aiEvaluation.strengths.map((item, index) => (
                        <div key={`${item}-${index}`} style={{ marginBottom: 8 }}>{item}</div>
                      )) : <div style={{ marginBottom: 12 }}>暂无</div>}
                      <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 12 }}>建议</div>
                      {selectedReport.aiEvaluation.suggestions.length > 0 ? selectedReport.aiEvaluation.suggestions.map((item, index) => (
                        <div key={`${item}-${index}`} style={{ marginBottom: 8 }}>{item}</div>
                      )) : '暂无'}
                    </Card>
                  </Col>
                </Row>
              </>
            )}

            <Form form={feedbackForm} layout="vertical">
              <Space style={{ marginBottom: 12 }}>
                <Button icon={<RobotOutlined />} loading={generatingOpinion} onClick={() => void handleGenerateOpinion()}>
                  AI 生成评语
                </Button>
                <Button
                  icon={<RobotOutlined />}
                  loading={evaluatingId === selectedReport.id}
                  onClick={() => void handleAiEvaluation(selectedReport)}
                >
                  重新 AI 评分
                </Button>
              </Space>

              <Form.Item
                label="教师评语"
                name="feedback"
                rules={[{ required: true, message: '请输入教师评语' }]}
              >
                <TextArea rows={5} placeholder="可先点击“AI 生成评语”，再结合项目实际情况修改。" />
              </Form.Item>

              <Form.Item name="action" initialValue="needs_revision" hidden>
                <Input />
              </Form.Item>

              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setReviewModalVisible(false)}>取消</Button>
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => {
                    feedbackForm.setFieldValue('action', 'rejected')
                    void handleSubmitReview()
                  }}
                >
                  拒绝
                </Button>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    feedbackForm.setFieldValue('action', 'needs_revision')
                    void handleSubmitReview()
                  }}
                >
                  退回修改
                </Button>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => {
                    feedbackForm.setFieldValue('action', 'approved')
                    void handleSubmitReview()
                  }}
                >
                  通过
                </Button>
              </Space>
            </Form>
          </>
        )}
      </Modal>
    </div>
  )
}

export default MidtermReportReview
