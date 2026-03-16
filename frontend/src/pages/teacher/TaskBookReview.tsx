import React, { useEffect, useState } from 'react'
import { Badge, Button, Card, Col, Descriptions, Divider, Form, Input, message, Modal, Row, Space, Table, Tag } from 'antd'
import { CheckOutlined, CloseOutlined, EditOutlined, EyeOutlined, RobotOutlined } from '@ant-design/icons'
import { teacherAPI } from '../../utils/api'

const { TextArea } = Input

interface TaskBookEvaluation {
  score: number
  suggestions: string[]
  issues: string[]
  strengths: string[]
}

interface TaskBook {
  id: string
  studentId: string
  studentName: string
  studentMajor: string
  topicTitle: string
  content: string
  status: 'pending' | 'approved' | 'needs_revision' | 'rejected'
  submitTime: string
  teacherFeedback?: string
  aiEvaluation?: TaskBookEvaluation
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

const TaskBookReview: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null)
  const [generatingOpinion, setGeneratingOpinion] = useState(false)
  const [taskBooks, setTaskBooks] = useState<TaskBook[]>([])
  const [selectedTaskBook, setSelectedTaskBook] = useState<TaskBook | null>(null)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [feedbackForm] = Form.useForm()
  const teacherId = 'T001'

  useEffect(() => {
    void fetchTaskBooks()
  }, [])

  const fetchTaskBooks = async () => {
    try {
      setLoading(true)
      const response = await teacherAPI.getPendingTaskBooks(teacherId)
      if (response.success && response.data) {
        setTaskBooks(response.data)
      } else {
        message.error('获取任务书列表失败')
      }
    } catch (error) {
      console.error('获取任务书列表失败:', error)
      message.error('获取任务书列表失败')
    } finally {
      setLoading(false)
    }
  }

  const updateTaskBook = (taskBookId: string, updater: (item: TaskBook) => TaskBook) => {
    setTaskBooks((current) => current.map((item) => (item.id === taskBookId ? updater(item) : item)))
    setSelectedTaskBook((current) => {
      if (!current || current.id !== taskBookId) return current
      return updater(current)
    })
  }

  const openReviewModal = (taskBook: TaskBook, action: 'approved' | 'needs_revision' | 'rejected' = 'needs_revision') => {
    setSelectedTaskBook(taskBook)
    feedbackForm.setFieldsValue({
      feedback: taskBook.teacherFeedback || '',
      action,
    })
    setReviewModalVisible(true)
  }

  const handleAiEvaluation = async (taskBook: TaskBook) => {
    try {
      setEvaluatingId(taskBook.id)
      const response = await teacherAPI.evaluateTaskBook(taskBook.id)
      if (!response.success || !response.data) {
        message.error('AI 评分失败')
        return
      }

      updateTaskBook(taskBook.id, (item) => ({ ...item, aiEvaluation: response.data }))
      message.success('AI 评分已完成')
    } catch (error) {
      console.error('AI 评分任务书失败:', error)
      message.error('AI 评分失败')
    } finally {
      setEvaluatingId(null)
    }
  }

  const handleGenerateOpinion = async () => {
    if (!selectedTaskBook) return

    try {
      setGeneratingOpinion(true)
      const response = await teacherAPI.generateTaskBookOpinion(selectedTaskBook.id)
      if (!response.success || !response.data?.opinion) {
        message.error('AI 评语生成失败')
        return
      }

      feedbackForm.setFieldValue('feedback', response.data.opinion)
      if (response.data.evaluation) {
        updateTaskBook(selectedTaskBook.id, (item) => ({ ...item, aiEvaluation: response.data.evaluation }))
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
    if (!selectedTaskBook) return

    try {
      const values = await feedbackForm.validateFields()
      const response = await teacherAPI.reviewTaskBook({
        taskBookId: selectedTaskBook.id,
        teacherId,
        status: values.action,
        feedback: values.feedback,
      })

      if (!response.success) {
        message.error('提交审核结果失败')
        return
      }

      message.success('任务书审核已提交')
      setReviewModalVisible(false)
      feedbackForm.resetFields()
      await fetchTaskBooks()
    } catch (error) {
      console.error('提交任务书审核失败:', error)
    }
  }

  const columns = [
    {
      title: '学生信息',
      key: 'student',
      width: 180,
      render: (_: unknown, record: TaskBook) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.studentName}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{record.studentId} / {record.studentMajor}</div>
        </div>
      ),
    },
    {
      title: '任务书主题',
      dataIndex: 'topicTitle',
      key: 'topicTitle',
      width: 240,
    },
    {
      title: 'AI 评分',
      key: 'aiEvaluation',
      width: 180,
      render: (_: unknown, record: TaskBook) =>
        record.aiEvaluation ? (
          <div>
            <Tag color={getScoreColor(record.aiEvaluation.score)}>{record.aiEvaluation.score} 分</Tag>
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
      render: (_: unknown, record: TaskBook) => (
        <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => openReviewModal(record)}>
          查看详情
        </Button>
      ),
    },
  ]

  return (
    <div className="page-container">
      <Card title="任务书审核">
        <Space wrap style={{ marginBottom: 16 }}>
          <Badge status="processing" text={`待审核 ${taskBooks.filter((item) => item.status === 'pending').length}`} />
          <Badge status="success" text={`已通过 ${taskBooks.filter((item) => item.status === 'approved').length}`} />
          <Badge status="warning" text={`退回修改 ${taskBooks.filter((item) => item.status === 'needs_revision').length}`} />
          <Badge status="error" text={`已拒绝 ${taskBooks.filter((item) => item.status === 'rejected').length}`} />
        </Space>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={taskBooks}
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title="任务书详情与审核"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        width={1040}
        footer={null}
      >
        {selectedTaskBook && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="学生姓名">{selectedTaskBook.studentName}</Descriptions.Item>
              <Descriptions.Item label="学号">{selectedTaskBook.studentId}</Descriptions.Item>
              <Descriptions.Item label="专业">{selectedTaskBook.studentMajor}</Descriptions.Item>
              <Descriptions.Item label="选题">{selectedTaskBook.topicTitle}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{new Date(selectedTaskBook.submitTime).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[selectedTaskBook.status]?.color}>{statusMap[selectedTaskBook.status]?.text}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">任务书内容</Divider>
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{selectedTaskBook.content || '暂无内容'}</div>
            </Card>

            {selectedTaskBook.aiEvaluation && (
              <>
                <Divider orientation="left">AI 评分结果</Divider>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Card size="small" title="综合评分">
                      <div style={{ fontSize: 44, fontWeight: 700, textAlign: 'center', color: getScoreColor(selectedTaskBook.aiEvaluation.score) }}>
                        {selectedTaskBook.aiEvaluation.score}
                      </div>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small" title="主要优点">
                      {selectedTaskBook.aiEvaluation.strengths.length > 0 ? selectedTaskBook.aiEvaluation.strengths.map((item, index) => (
                        <div key={`${item}-${index}`} style={{ marginBottom: 8 }}>{item}</div>
                      )) : '暂无'}
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small" title="修改建议">
                      {selectedTaskBook.aiEvaluation.suggestions.length > 0 ? selectedTaskBook.aiEvaluation.suggestions.map((item, index) => (
                        <div key={`${item}-${index}`} style={{ marginBottom: 8 }}>{item}</div>
                      )) : '暂无'}
                    </Card>
                  </Col>
                </Row>

                {selectedTaskBook.aiEvaluation.issues.length > 0 && (
                  <Card size="small" title="风险与问题" style={{ marginBottom: 16 }}>
                    {selectedTaskBook.aiEvaluation.issues.map((item, index) => (
                      <div key={`${item}-${index}`} style={{ marginBottom: 8 }}>{item}</div>
                    ))}
                  </Card>
                )}
              </>
            )}

            <Form form={feedbackForm} layout="vertical">
              <Space style={{ marginBottom: 12 }}>
                <Button icon={<RobotOutlined />} loading={generatingOpinion} onClick={() => void handleGenerateOpinion()}>
                  AI 生成评语
                </Button>
                <Button
                  icon={<RobotOutlined />}
                  loading={evaluatingId === selectedTaskBook.id}
                  onClick={() => void handleAiEvaluation(selectedTaskBook)}
                >
                  重新 AI 评分
                </Button>
              </Space>

              <Form.Item
                label="教师评语"
                name="feedback"
                rules={[{ required: true, message: '请输入教师评语' }]}
              >
                <TextArea rows={5} placeholder="可先点击“AI 生成评语”，再按你的判断进行修改。" />
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

export default TaskBookReview
