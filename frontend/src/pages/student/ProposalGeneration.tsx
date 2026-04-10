import React, { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Collapse, Form, Input, Row, Space, Spin, Tag, Upload, message } from 'antd'
import type { UploadProps } from 'antd'
import { RobotOutlined, SaveOutlined, SendOutlined, UploadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { studentAPI } from '../../utils/api'

const { TextArea } = Input

interface Proposal {
  id?: string
  title: string
  researchBackground: string
  researchSignificance: string
  literatureReview: string
  researchObjectives: string
  researchContent: string
  researchMethods: string
  expectedOutcomes: string
  innovationPoints: string
  feasibilityAnalysis: string
  workPlan: string
  references: string[]
  status: string
  feedback?: string
}

const statusMap: Record<string, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  pending: { color: 'processing', text: '待审核' },
  reviewing: { color: 'processing', text: '审核中' },
  approved: { color: 'success', text: '已通过' },
  rejected: { color: 'error', text: '未通过' },
  needs_revision: { color: 'warning', text: '退回修改' },
}

const ProposalGeneration: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const navigate = useNavigate()
  const studentId = ''

  useEffect(() => {
    void fetchProposal()
  }, [])

  const fillForm = (data: Proposal) => {
    form.setFieldsValue({
      title: data.title,
      researchBackground: data.researchBackground,
      researchSignificance: data.researchSignificance,
      literatureReview: data.literatureReview,
      researchObjectives: data.researchObjectives,
      researchContent: data.researchContent,
      researchMethods: data.researchMethods,
      expectedOutcomes: data.expectedOutcomes,
      innovationPoints: data.innovationPoints,
      feasibilityAnalysis: data.feasibilityAnalysis,
      workPlan: data.workPlan,
      references: data.references?.join('\n') || '',
    })
  }

  const fetchProposal = async () => {
    try {
      setLoading(true)
      const response = await studentAPI.getProposal(studentId)
      if (response.success && response.data) {
        setProposal(response.data)
        fillForm(response.data)
      }
    } catch (error) {
      console.error('获取开题报告失败', error)
      message.error('获取开题报告失败')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      const response = await studentAPI.generateProposal(studentId)
      if (!response.success || !response.data) {
        message.error('开题报告生成失败')
        return
      }

      setProposal(response.data)
      fillForm(response.data)
      message.success('开题报告已生成')
    } catch (error: any) {
      console.error('生成开题报告失败', error)
      message.error(error?.response?.data?.message || '开题报告生成失败。若持续失败，请先查看 AI 连通性检测页面。')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields()
      const response = await studentAPI.saveProposalDraft(studentId, {
        ...values,
        references: values.references ? String(values.references).split('\n').filter((item: string) => item.trim()) : [],
      })
      if (!response.success) {
        message.error('保存草稿失败')
        return
      }

      message.success('开题报告草稿已保存')
      await fetchProposal()
    } catch (error) {
      console.error('保存开题报告失败', error)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const response = await studentAPI.submitProposal(studentId, {
        ...values,
        references: values.references ? String(values.references).split('\n').filter((item: string) => item.trim()) : [],
      })
      if (!response.success) {
        message.error('提交开题报告失败')
        return
      }

      message.success('开题报告已提交，请等待教师审核')
      await fetchProposal()
    } catch (error: any) {
      console.error('提交开题报告失败', error)
      message.error(error?.response?.data?.message || '提交开题报告失败')
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
        const response = await studentAPI.uploadFile(file as File, 'proposal')
        if (!response.success || !response.data) {
          onError?.(new Error('导入开题报告失败'))
          return
        }
        setProposal(response.data)
        fillForm(response.data)
        message.success('开题报告已导入')
        onSuccess?.(response.data)
      } catch (error) {
        console.error('上传开题报告失败', error)
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
      <Card title="开题报告智能生成" className="mb-24">
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="开题报告会基于已审核或已提交的选题，由 AI 生成初稿。"
          description={
            <Space wrap>
              <span>如果生成过程长期无返回，请优先查看 AI 连通性检测。</span>
              <Button type="link" onClick={() => navigate('/student/ai-status')} style={{ padding: 0 }}>
                打开检测页
              </Button>
            </Space>
          }
        />

        {proposal ? (
          <Alert
            style={{ marginBottom: 16 }}
            type="info"
            showIcon
            message="当前开题报告状态"
            description={
              <div>
                <p>
                  状态：
                  <Tag color={statusMap[proposal.status]?.color}>{statusMap[proposal.status]?.text || proposal.status}</Tag>
                </p>
                {proposal.feedback ? <p>教师反馈：{proposal.feedback}</p> : null}
              </div>
            }
          />
        ) : null}

        <Row gutter={16}>
          <Col span={12}>
            <Button type="primary" icon={<RobotOutlined />} loading={generating} onClick={() => void handleGenerate()} block size="large">
              智能生成开题报告
            </Button>
          </Col>
          <Col span={12}>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} block size="large">
                上传已有开题报告
              </Button>
            </Upload>
          </Col>
        </Row>
      </Card>

      <Card title="开题报告内容编辑">
        <Form form={form} layout="vertical">
          <Collapse
            defaultActiveKey={['basic', 'background', 'purpose']}
            items={[
              {
                key: 'basic',
                label: '题目信息',
                children: (
                  <Form.Item label="题目名称" name="title" rules={[{ required: true, message: '请输入题目名称' }]}>
                    <Input placeholder="请输入开题报告题目" />
                  </Form.Item>
                ),
              },
              {
                key: 'background',
                label: '选题背景',
                children: (
                  <Form.Item
                    label="选题背景"
                    name="researchBackground"
                    extra="建议不少于 300 字，按“宏观背景 -> 行业、学校或企业背景 -> 引入本文研究”展开。"
                    rules={[{ required: true, message: '请输入选题背景' }]}
                  >
                    <TextArea rows={8} placeholder="说明在什么背景下开展研究、研究对象是什么、为什么研究该选题，以及本文重点解决哪些问题。" />
                  </Form.Item>
                ),
              },
              {
                key: 'purpose',
                label: '选题目的',
                children: (
                  <Form.Item
                    label="选题目的"
                    name="researchObjectives"
                    extra="建议不少于 300 字，写清楚“要做什么、怎么做、为什么这么做”。"
                    rules={[{ required: true, message: '请输入选题目的' }]}
                  >
                    <TextArea rows={8} placeholder="围绕毕业设计目标、实施路径、研究步骤和预期解决的问题进行说明。" />
                  </Form.Item>
                ),
              },
              {
                key: 'significance',
                label: '选题意义',
                children: (
                  <Form.Item
                    label="选题意义"
                    name="researchSignificance"
                    extra="建议不少于 300 字，分别从理论意义和实际意义两个角度展开。"
                    rules={[{ required: true, message: '请输入选题意义' }]}
                  >
                    <TextArea rows={8} placeholder="说明该研究对理论完善、实践改进、行业应用或教学管理等方面的价值。" />
                  </Form.Item>
                ),
              },
              {
                key: 'literature',
                label: '国内外研究现状',
                children: (
                  <Form.Item
                    label="国内外研究现状"
                    name="literatureReview"
                    extra="建议不少于 2000 字，按国内研究、国外研究、现有不足与发展趋势进行文献综述。"
                    rules={[{ required: true, message: '请输入国内外研究现状' }]}
                  >
                    <TextArea rows={14} placeholder="先梳理国内外代表性研究，再评述现有研究不足，最后说明本文拟采用的研究思路与发展趋势判断。" />
                  </Form.Item>
                ),
              },
              {
                key: 'content-methods',
                label: '主要内容和研究方法',
                children: (
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="主要内容"
                        name="researchContent"
                        extra="可按二级提纲或模块化结构撰写，建议围绕问题分析、方案设计、实现与验证展开。"
                        rules={[{ required: true, message: '请输入主要内容' }]}
                      >
                        <TextArea rows={8} placeholder="分点说明论文或毕业设计将围绕哪些核心内容展开，每部分重点完成什么任务。" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="研究方法"
                        name="researchMethods"
                        extra="结合选题选择不超过 3 种研究方法，并说明各方法的使用场景。"
                        rules={[{ required: true, message: '请输入研究方法' }]}
                      >
                        <TextArea rows={8} placeholder="例如文献研究法、案例研究法、调查研究法、数据分析法等，并写清楚如何使用。" />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        label="创新点"
                        name="innovationPoints"
                        extra="可选填写，用于补充本课题相较已有研究或已有系统的改进点。"
                      >
                        <TextArea rows={5} placeholder="说明本课题在研究视角、实现方案、数据应用或系统功能上的特色与亮点。" />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'foundation-outcomes',
                label: '前期基础和预期成果',
                children: (
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="前期基础"
                        name="feasibilityAnalysis"
                        extra="可从导师指导条件、课程知识基础、已有资料与实验条件等角度说明。"
                        rules={[{ required: true, message: '请输入前期基础' }]}
                      >
                        <TextArea rows={8} placeholder="说明已有理论基础、技术储备、实验环境、资料来源和导师指导条件等。" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="预期成果"
                        name="expectedOutcomes"
                        extra="写明预期完成的论文、系统、模型、实验结果或应用成果。"
                        rules={[{ required: true, message: '请输入预期成果' }]}
                      >
                        <TextArea rows={8} placeholder="例如完成论文终稿、系统原型、实验分析结果、演示材料等，并说明个人能力提升。" />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'plan',
                label: '论文进度安排',
                children: (
                  <Form.Item
                    label="论文进度安排"
                    name="workPlan"
                    extra="建议按周次撰写，至少覆盖第 1 周至第 14 周的阶段安排。"
                    rules={[{ required: true, message: '请输入论文进度安排' }]}
                  >
                    <TextArea rows={10} placeholder="示例：第1周完成选题与资料搜集，第2周完成提纲设计，第5-7周完成初稿，第11-14周修改终稿。" />
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
                    help="以下参考文献仅作格式参考，正式文献仍需学生自行检索、筛选和补充。建议不少于 15 条，并包含 J、M、D 三类文献。"
                  >
                    <TextArea rows={10} placeholder="[1] 作者. 文献题名[J]. 期刊名, 2024.\n[2] 作者. 书名[M]. 出版地: 出版社, 2023." />
                  </Form.Item>
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

export default ProposalGeneration
