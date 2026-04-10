import React, { useEffect, useState } from 'react'
import { Badge, Button, Card, Descriptions, Divider, Form, Input, message, Modal, Space, Table, Tag } from 'antd'
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons'
import { teacherAPI } from '../../utils/api'

const { TextArea } = Input

interface Topic {
  id: string
  title: string
  description: string
  keywords: string[]
  studentId: string
  studentName: string
  studentMajor: string
  status: 'pending' | 'approved' | 'rejected'
  submitTime: string
  feedback?: string
  difficulty: string
  innovation: string
  feasibility: string
}

const TopicReview: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [feedbackForm] = Form.useForm()

  useEffect(() => {
    void fetchTopics()
  }, [])

  const fetchTopics = async () => {
    try {
      setLoading(true)
      const response = await teacherAPI.getPendingTopics()
      if (response.success && response.data) {
        setTopics(response.data)
      } else {
        message.error('获取选题列表失败')
      }
    } catch (error) {
      console.error('获取选题列表失败:', error)
      message.error('获取选题列表失败')
    } finally {
      setLoading(false)
    }
  }

  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      pending: { color: 'processing', text: '待审核' },
      approved: { color: 'success', text: '已通过' },
      rejected: { color: 'error', text: '已拒绝' },
    }
    const current = map[status] || { color: 'default', text: status }
    return <Tag color={current.color}>{current.text}</Tag>
  }

  const getDifficultyTag = (difficulty: string) => {
    const map: Record<string, { color: string; text: string }> = {
      简单: { color: 'green', text: '简单' },
      中等: { color: 'orange', text: '中等' },
      困难: { color: 'red', text: '困难' },
    }
    const current = map[difficulty] || { color: 'default', text: difficulty }
    return <Tag color={current.color}>{current.text}</Tag>
  }

  const openReviewModal = (topic: Topic, action: 'approved' | 'rejected' = 'approved') => {
    setSelectedTopic(topic)
    feedbackForm.setFieldsValue({ feedback: topic.feedback || '', action })
    setReviewModalVisible(true)
  }

  const handleReview = async (status: 'approved' | 'rejected', feedback?: string) => {
    if (!selectedTopic) {
      return
    }

    try {
      const response = await teacherAPI.reviewTopic({
        topicId: selectedTopic.id,
        status,
        feedback: feedback || '',
      })

      if (response.success) {
        message.success(status === 'approved' ? '已通过该选题' : '已拒绝该选题')
        setReviewModalVisible(false)
        feedbackForm.resetFields()
        await fetchTopics()
      } else {
        message.error('提交审核结果失败')
      }
    } catch (error) {
      console.error('审核选题失败:', error)
      message.error('审核选题失败')
    }
  }

  const handleSubmitReview = async () => {
    try {
      const values = await feedbackForm.validateFields()
      await handleReview(feedbackForm.getFieldValue('action'), values.feedback)
    } catch (error) {
      console.error('提交选题审核失败:', error)
    }
  }

  const columns = [
    {
      title: '学生信息',
      key: 'student',
      width: 160,
      render: (_: unknown, record: Topic) => (
        <div>
          <div>
            <strong>{record.studentName}</strong>
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record.studentId} | {record.studentMajor}
          </div>
        </div>
      ),
    },
    {
      title: '选题信息',
      key: 'topic',
      width: 320,
      render: (_: unknown, record: Topic) => (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{record.title}</div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{record.description}</div>
          <Space size="small" wrap>
            {record.keywords.map((keyword, index) => (
              <Tag key={`${keyword}-${index}`}>{keyword}</Tag>
            ))}
          </Space>
        </div>
      ),
    },
    {
      title: '评估标签',
      key: 'evaluation',
      width: 160,
      render: (_: unknown, record: Topic) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: '#666', fontSize: 12 }}>难度：</span>
            {getDifficultyTag(record.difficulty)}
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: '#666', fontSize: 12 }}>创新性：</span>
            <Tag color="green">{record.innovation}</Tag>
          </div>
          <div>
            <span style={{ color: '#666', fontSize: 12 }}>可行性：</span>
            <Tag color="orange">{record.feasibility}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
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
      fixed: 'right' as const,
      width: 220,
      render: (_: unknown, record: Topic) => (
        <Space size="small">
          <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => openReviewModal(record)}>
            查看详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button size="small" icon={<CheckOutlined />} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff' }} onClick={() => openReviewModal(record, 'approved')}>
                通过
              </Button>
              <Button danger size="small" icon={<CloseOutlined />} onClick={() => openReviewModal(record, 'rejected')}>
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <Card title="选题审核" className="mb-24">
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Badge status="processing" text={`待审核：${topics.filter((item) => item.status === 'pending').length} 项`} />
            <Badge status="success" text={`已通过：${topics.filter((item) => item.status === 'approved').length} 项`} />
            <Badge status="error" text={`已拒绝：${topics.filter((item) => item.status === 'rejected').length} 项`} />
          </Space>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={topics}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal title="选题详情与审核" open={reviewModalVisible} onCancel={() => setReviewModalVisible(false)} width={840} footer={null}>
        {selectedTopic && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="学生姓名">{selectedTopic.studentName}</Descriptions.Item>
              <Descriptions.Item label="学号">{selectedTopic.studentId}</Descriptions.Item>
              <Descriptions.Item label="专业">{selectedTopic.studentMajor}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{new Date(selectedTopic.submitTime).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selectedTopic.status)}</Descriptions.Item>
              <Descriptions.Item label="难度">{getDifficultyTag(selectedTopic.difficulty)}</Descriptions.Item>
              <Descriptions.Item label="创新性">
                <Tag color="green">{selectedTopic.innovation}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="可行性">
                <Tag color="orange">{selectedTopic.feasibility}</Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">选题内容</Divider>
            <div style={{ marginBottom: 16 }}>
              <h4>题目名称</h4>
              <p>{selectedTopic.title}</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <h4>题目描述</h4>
              <p>{selectedTopic.description}</p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <h4>关键词</h4>
              <Space wrap>
                {selectedTopic.keywords.map((keyword, index) => (
                  <Tag key={`${keyword}-${index}`}>{keyword}</Tag>
                ))}
              </Space>
            </div>

            {selectedTopic.feedback && (
              <>
                <Divider orientation="left">历史反馈</Divider>
                <p>{selectedTopic.feedback}</p>
              </>
            )}

            <Form form={feedbackForm} layout="vertical" initialValues={{ action: 'approved' }}>
              <Form.Item label="审核意见" name="feedback" rules={[{ required: true, message: '请输入审核意见' }]}>
                <TextArea rows={4} placeholder="请给出明确的审核结论，并补充修改建议或拒绝原因。" />
              </Form.Item>

              <Form.Item name="action" style={{ display: 'none' }}>
                <Input />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => setReviewModalVisible(false)}>取消</Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => {
                      feedbackForm.setFieldsValue({ action: 'rejected' })
                      void handleSubmitReview()
                    }}
                  >
                    拒绝
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    onClick={() => {
                      feedbackForm.setFieldsValue({ action: 'approved' })
                      void handleSubmitReview()
                    }}
                  >
                    通过
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  )
}

export default TopicReview
