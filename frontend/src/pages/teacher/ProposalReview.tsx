import React, { useEffect, useState } from 'react'
import { Badge, Button, Card, Col, Collapse, Descriptions, Divider, Form, Input, message, Modal, Progress, Row, Space, Table, Tag } from 'antd'
import { CheckOutlined, CloseOutlined, EditOutlined, EyeOutlined, RobotOutlined } from '@ant-design/icons'
import { teacherAPI } from '../../utils/api'

const { TextArea } = Input

interface ProposalEvaluation {
  overallScore: number
  dimensionScores: {
    background: number
    significance: number
    researchStatus: number
    researchContent: number
    researchMethods: number
    innovation: number
    feasibility: number
  }
  suggestions: string[]
  strengths: string[]
  detailedAnalysis: {
    background: string
    significance: string
    researchStatus: string
    researchContent: string
    researchMethods: string
    innovation: string
    feasibility: string
  }
}

interface Proposal {
  id: string
  studentId: string
  studentName: string
  studentMajor: string
  topicTitle: string
  content: {
    background: string
    significance: string
    researchStatus: string
    researchContent: string
    researchMethods: string
    expectedResults: string
    innovationPoints: string
    feasibilityAnalysis: string
    workPlan: string
    references: string[]
  }
  status: 'pending' | 'approved' | 'needs_revision' | 'rejected'
  submitTime: string
  teacherFeedback?: string
  aiEvaluation?: ProposalEvaluation
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

const renderSection = (text?: string) => <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{text || '暂无内容'}</div>

const ProposalReview: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null)
  const [generatingOpinion, setGeneratingOpinion] = useState(false)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [feedbackForm] = Form.useForm()
  const teacherId = 'T001'

  useEffect(() => {
    void fetchProposals()
  }, [])

  const fetchProposals = async () => {
    try {
      setLoading(true)
      const response = await teacherAPI.getPendingProposals(teacherId)
      if (response.success && response.data) {
        setProposals(response.data)
      } else {
        message.error('获取开题报告列表失败')
      }
    } catch (error) {
      console.error('获取开题报告列表失败:', error)
      message.error('获取开题报告列表失败')
    } finally {
      setLoading(false)
    }
  }

  const updateProposal = (proposalId: string, updater: (item: Proposal) => Proposal) => {
    setProposals((current) => current.map((item) => (item.id === proposalId ? updater(item) : item)))
    setSelectedProposal((current) => {
      if (!current || current.id !== proposalId) return current
      return updater(current)
    })
  }

  const openReviewModal = (proposal: Proposal, action: 'approved' | 'needs_revision' | 'rejected' = 'needs_revision') => {
    setSelectedProposal(proposal)
    feedbackForm.setFieldsValue({
      feedback: proposal.teacherFeedback || '',
      action,
    })
    setReviewModalVisible(true)
  }

  const handleAiEvaluation = async (proposal: Proposal) => {
    try {
      setEvaluatingId(proposal.id)
      const response = await teacherAPI.evaluateProposal(proposal.id)
      if (!response.success || !response.data) {
        message.error('AI 评分失败')
        return
      }

      updateProposal(proposal.id, (item) => ({ ...item, aiEvaluation: response.data }))
      message.success('AI 评分已完成')
    } catch (error) {
      console.error('AI 评分开题报告失败:', error)
      message.error('AI 评分失败')
    } finally {
      setEvaluatingId(null)
    }
  }

  const handleGenerateOpinion = async () => {
    if (!selectedProposal) return

    try {
      setGeneratingOpinion(true)
      const response = await teacherAPI.generateProposalOpinion(selectedProposal.id)
      if (!response.success || !response.data?.opinion) {
        message.error('AI 评语生成失败')
        return
      }

      feedbackForm.setFieldValue('feedback', response.data.opinion)
      if (response.data.evaluation) {
        updateProposal(selectedProposal.id, (item) => ({ ...item, aiEvaluation: response.data.evaluation }))
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
    if (!selectedProposal) return

    try {
      const values = await feedbackForm.validateFields()
      const response = await teacherAPI.reviewProposal({
        proposalId: selectedProposal.id,
        teacherId,
        status: values.action,
        feedback: values.feedback,
      })

      if (!response.success) {
        message.error('提交审核结果失败')
        return
      }

      message.success('开题报告审核已提交')
      setReviewModalVisible(false)
      feedbackForm.resetFields()
      await fetchProposals()
    } catch (error) {
      console.error('提交开题报告审核失败:', error)
    }
  }

  const columns = [
    {
      title: '学生信息',
      key: 'student',
      width: 180,
      render: (_: unknown, record: Proposal) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.studentName}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.studentId} / {record.studentMajor}</div>
        </div>
      ),
    },
    {
      title: '开题主题',
      dataIndex: 'topicTitle',
      key: 'topicTitle',
      width: 240,
    },
    {
      title: 'AI 评分',
      key: 'aiEvaluation',
      width: 180,
      render: (_: unknown, record: Proposal) =>
        record.aiEvaluation ? (
          <div>
            <Tag color={getScoreColor(record.aiEvaluation.overallScore)}>{record.aiEvaluation.overallScore} 分</Tag>
            <div style={{ fontSize: 12, color: '#52c41a', marginTop: 4 }}>优点 {record.aiEvaluation.strengths.length} 条</div>
            <div style={{ fontSize: 12, color: '#faad14' }}>建议 {record.aiEvaluation.suggestions.length} 条</div>
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
      render: (_: unknown, record: Proposal) => (
        <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => openReviewModal(record)}>
          查看详情
        </Button>
      ),
    },
  ]

  const buildCollapseItems = (proposal: Proposal) => [
    { key: 'background', label: '研究背景', children: renderSection(proposal.content.background) },
    { key: 'significance', label: '研究意义', children: renderSection(proposal.content.significance) },
    { key: 'researchStatus', label: '国内外研究现状', children: renderSection(proposal.content.researchStatus) },
    { key: 'researchContent', label: '研究内容', children: renderSection(proposal.content.researchContent) },
    { key: 'researchMethods', label: '研究方法', children: renderSection(proposal.content.researchMethods) },
    { key: 'expectedResults', label: '预期成果', children: renderSection(proposal.content.expectedResults) },
    { key: 'innovationPoints', label: '创新点', children: renderSection(proposal.content.innovationPoints) },
    { key: 'feasibilityAnalysis', label: '可行性分析', children: renderSection(proposal.content.feasibilityAnalysis) },
    { key: 'workPlan', label: '工作计划', children: renderSection(proposal.content.workPlan) },
    {
      key: 'references',
      label: '参考文献',
      children: proposal.content.references.length > 0
        ? proposal.content.references.map((item, index) => <div key={`${item}-${index}`}>[{index + 1}] {item}</div>)
        : '暂无参考文献',
    },
  ]

  return (
    <div className="page-container">
      <Card title="开题报告审核">
        <Space wrap style={{ marginBottom: 16 }}>
          <Badge status="processing" text={`待审核 ${proposals.filter((item) => item.status === 'pending').length}`} />
          <Badge status="success" text={`已通过 ${proposals.filter((item) => item.status === 'approved').length}`} />
          <Badge status="warning" text={`退回修改 ${proposals.filter((item) => item.status === 'needs_revision').length}`} />
          <Badge status="error" text={`已拒绝 ${proposals.filter((item) => item.status === 'rejected').length}`} />
        </Space>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={proposals}
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title="开题报告详情与审核"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        width={1220}
        footer={null}
      >
        {selectedProposal && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="学生姓名">{selectedProposal.studentName}</Descriptions.Item>
              <Descriptions.Item label="学号">{selectedProposal.studentId}</Descriptions.Item>
              <Descriptions.Item label="专业">{selectedProposal.studentMajor}</Descriptions.Item>
              <Descriptions.Item label="选题">{selectedProposal.topicTitle}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{new Date(selectedProposal.submitTime).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[selectedProposal.status]?.color}>{statusMap[selectedProposal.status]?.text}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">开题报告内容</Divider>
            <Collapse items={buildCollapseItems(selectedProposal)} defaultActiveKey={['background']} />

            {selectedProposal.aiEvaluation && (
              <>
                <Divider orientation="left">AI 评分结果</Divider>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Card size="small" title="综合评分">
                      <div style={{ fontSize: 44, fontWeight: 700, textAlign: 'center', color: getScoreColor(selectedProposal.aiEvaluation.overallScore) }}>
                        {selectedProposal.aiEvaluation.overallScore}
                      </div>
                    </Card>
                    <Card size="small" title="分项得分" style={{ marginTop: 16 }}>
                      {Object.entries(selectedProposal.aiEvaluation.dimensionScores).map(([key, value]) => (
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
                    <Card size="small" title="主要优点">
                      {selectedProposal.aiEvaluation.strengths.length > 0 ? selectedProposal.aiEvaluation.strengths.map((item, index) => (
                        <div key={`${item}-${index}`} style={{ marginBottom: 8 }}>{item}</div>
                      )) : '暂无'}
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small" title="修改建议">
                      {selectedProposal.aiEvaluation.suggestions.length > 0 ? selectedProposal.aiEvaluation.suggestions.map((item, index) => (
                        <div key={`${item}-${index}`} style={{ marginBottom: 8 }}>{item}</div>
                      )) : '暂无'}
                    </Card>
                  </Col>
                </Row>

                <Card size="small" title="详细分析" style={{ marginBottom: 16 }}>
                  <Collapse
                    items={Object.entries(selectedProposal.aiEvaluation.detailedAnalysis).map(([key, value]) => ({
                      key,
                      label: key,
                      children: value || '暂无分析',
                    }))}
                  />
                </Card>
              </>
            )}

            <Form form={feedbackForm} layout="vertical">
              <Space style={{ marginBottom: 12 }}>
                <Button icon={<RobotOutlined />} loading={generatingOpinion} onClick={() => void handleGenerateOpinion()}>
                  AI 生成评语
                </Button>
                <Button
                  icon={<RobotOutlined />}
                  loading={evaluatingId === selectedProposal.id}
                  onClick={() => void handleAiEvaluation(selectedProposal)}
                >
                  重新 AI 评分
                </Button>
              </Space>

              <Form.Item
                label="教师评语"
                name="feedback"
                rules={[{ required: true, message: '请输入教师评语' }]}
              >
                <TextArea rows={5} placeholder="可先点击“AI 生成评语”，再结合你的判断进行修改。" />
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

export default ProposalReview
