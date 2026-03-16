import React, { useState } from 'react'
import { Alert, Button, Card, Col, Form, Input, List, Row, Space, Tag, Typography, message } from 'antd'
import { BulbOutlined, RobotOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { studentAPI } from '../../utils/api'

const { TextArea } = Input
const { Paragraph, Text } = Typography

interface GeneratedTopic {
  id?: string
  title: string
  description: string
  keywords: string[]
  difficulty?: string
  innovation?: string
  feasibility?: string
  expectedResults?: string
}

const interestAreas = [
  '人工智能',
  '机器学习',
  '深度学习',
  '自然语言处理',
  '计算机视觉',
  '数据挖掘',
  '大数据分析',
  '云计算',
  '物联网',
  '区块链',
  '软件工程',
  '网络安全',
  '推荐系统',
  '知识图谱',
  '教育信息化',
]

const TopicSelection: React.FC = () => {
  const [form] = Form.useForm()
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [generatedTopics, setGeneratedTopics] = useState<GeneratedTopic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<GeneratedTopic | null>(null)
  const navigate = useNavigate()
  const studentId = ''

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields()
      setGenerating(true)

      const response = await studentAPI.generateTopics(
        studentId,
        [values.interestArea],
        String(values.keywords)
          .split(/[,\n，；;]/)
          .map((item: string) => item.trim())
          .filter(Boolean),
      )

      if (!response.success || !Array.isArray(response.data)) {
        message.error('智能生成失败，请稍后重试')
        return
      }

      setGeneratedTopics(response.data)
      setSelectedTopic(null)
      message.success('已生成选题建议')
    } catch (error: any) {
      console.error('生成选题失败:', error)
      message.error(error?.response?.data?.message || '智能生成失败。若持续失败，请先查看 AI 连通性检测页。')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveDraft = () => {
    localStorage.setItem('student-topic-draft', JSON.stringify(form.getFieldsValue()))
    message.success('草稿已保存')
  }

  const handleLoadDraft = () => {
    const draft = localStorage.getItem('student-topic-draft')
    if (!draft) {
      message.info('暂无可载入的草稿')
      return
    }

    form.setFieldsValue(JSON.parse(draft))
    message.success('草稿已载入')
  }

  const handleSubmit = async () => {
    if (!selectedTopic) {
      message.warning('请先选择一个选题')
      return
    }

    try {
      setSubmitting(true)
      const response = await studentAPI.submitTopic({
        title: selectedTopic.title,
        description: selectedTopic.description,
        keywords: selectedTopic.keywords,
        studentId,
      })

      if (!response.success) {
        message.error('选题提交失败')
        return
      }

      message.success('选题已提交，请等待教师审核')
      setGeneratedTopics([])
      setSelectedTopic(null)
    } catch (error: any) {
      console.error('提交选题失败:', error)
      message.error(error?.response?.data?.message || '选题提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container">
      <Card title="智能选题" className="mb-24">
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="先填写研究方向和关键词，再让 AI 生成候选选题。"
          description={
            <Space wrap>
              <span>如果页面一直转圈或提示网络问题，可以先查看 AI 连通性检测。</span>
              <Button type="link" onClick={() => navigate('/student/ai-status')} style={{ padding: 0 }}>
                打开检测页
              </Button>
            </Space>
          }
        />

        <Form form={form} layout="vertical">
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item label="研究方向" name="interestArea" rules={[{ required: true, message: '请选择研究方向' }]}>
                <Input list="interest-options" placeholder="例如：人工智能、软件工程、网络安全" />
              </Form.Item>
              <datalist id="interest-options">
                {interestAreas.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="关键词"
                name="keywords"
                rules={[{ required: true, message: '请输入关键词' }]}
                help="建议填写 3 到 5 个关键词，使用逗号、分号或换行分隔。"
              >
                <TextArea rows={2} placeholder="例如：多模态，大模型，教育评测，知识图谱" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="补充说明" name="customDescription" help="可补充你希望题目更偏应用、偏算法，或希望最终输出的成果形式。">
            <TextArea rows={3} placeholder="例如：希望结合学校实际场景，最终完成一个可演示的系统原型。" />
          </Form.Item>

          <Space wrap>
            <Button type="primary" icon={<RobotOutlined />} loading={generating} onClick={() => void handleGenerate()}>
              智能生成选题
            </Button>
            <Button icon={<SaveOutlined />} onClick={handleSaveDraft}>保存草稿</Button>
            <Button onClick={handleLoadDraft}>载入草稿</Button>
          </Space>
        </Form>
      </Card>

      {generatedTopics.length > 0 && (
        <Card title="候选选题" className="mb-24">
          <List
            grid={{ gutter: 16, xs: 1, md: 2, xl: 3 }}
            dataSource={generatedTopics}
            renderItem={(topic) => (
              <List.Item>
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    border: selectedTopic?.title === topic.title ? '2px solid #1677ff' : undefined,
                  }}
                  actions={[
                    <Button
                      key="select"
                      type={selectedTopic?.title === topic.title ? 'primary' : 'default'}
                      onClick={() => setSelectedTopic(topic)}
                    >
                      {selectedTopic?.title === topic.title ? '已选择' : '选择该题目'}
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <Space>
                        <BulbOutlined style={{ color: '#faad14' }} />
                        <span>{topic.title}</span>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <Paragraph style={{ marginBottom: 0 }}>{topic.description}</Paragraph>
                        <div>
                          <Text strong>关键词：</Text>
                          <div style={{ marginTop: 8 }}>
                            <Space wrap>
                              {topic.keywords.map((keyword, index) => (
                                <Tag key={`${keyword}-${index}`}>{keyword}</Tag>
                              ))}
                            </Space>
                          </div>
                        </div>
                        {topic.expectedResults ? (
                          <div>
                            <Text strong>预期成果：</Text>
                            <Paragraph style={{ marginBottom: 0, marginTop: 8 }}>{topic.expectedResults}</Paragraph>
                          </div>
                        ) : null}
                      </Space>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        </Card>
      )}

      {selectedTopic && (
        <Card title="确认提交">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>题目：</Text>
              <div>{selectedTopic.title}</div>
            </div>
            <div>
              <Text strong>简介：</Text>
              <div>{selectedTopic.description}</div>
            </div>
            <div>
              <Text strong>关键词：</Text>
              <div>{selectedTopic.keywords.join('，')}</div>
            </div>
            <Space wrap>
              <Button type="primary" icon={<SendOutlined />} loading={submitting} onClick={() => void handleSubmit()}>
                提交审核
              </Button>
              <Button onClick={() => setSelectedTopic(null)}>重新选择</Button>
            </Space>
          </Space>
        </Card>
      )}
    </div>
  )
}

export default TopicSelection
