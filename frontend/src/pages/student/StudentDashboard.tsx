import React, { useEffect, useState } from 'react'
import { Alert, Card, Col, Empty, Row, Spin, Tag, Timeline } from 'antd'
import {
  AuditOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileOutlined,
  FileTextOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { studentAPI } from '../../utils/api'

interface StatusBlock {
  status: string
  title?: string
  feedback?: string
  updatedAt?: string
}

interface StatusInfo {
  topic: StatusBlock
  taskBook: StatusBlock
  proposal: StatusBlock
  midterm: StatusBlock
}

const defaultStatus: StatusInfo = {
  topic: { status: 'pending' },
  taskBook: { status: 'pending' },
  proposal: { status: 'pending' },
  midterm: { status: 'pending' },
}

const StudentDashboard: React.FC = () => {
  const [statusInfo, setStatusInfo] = useState<StatusInfo>(defaultStatus)
  const [loading, setLoading] = useState(true)
  const studentId = ''

  useEffect(() => {
    void fetchStatusInfo()
  }, [])

  const fetchStatusInfo = async () => {
    try {
      setLoading(true)
      const response = await studentAPI.getStatus(studentId)
      const data = response.data

      if (data) {
        setStatusInfo({
          topic: {
            status: data.topic?.status || 'pending',
            title: data.topic?.title || '',
            feedback: data.topic?.feedback,
            updatedAt: data.topic?.updatedAt,
          },
          taskBook: {
            status: data.taskBook?.status || 'pending',
            feedback: data.taskBook?.feedback,
            updatedAt: data.taskBook?.updatedAt,
          },
          proposal: {
            status: data.proposal?.status || 'pending',
            feedback: data.proposal?.feedback,
            updatedAt: data.proposal?.updatedAt,
          },
          midterm: {
            status: data.midterm?.status || 'pending',
            feedback: data.midterm?.feedback,
            updatedAt: data.midterm?.updatedAt,
          },
        })
      }
    } catch (error) {
      console.error('获取状态概览失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'passed':
        return 'success'
      case 'rejected':
      case 'failed':
        return 'error'
      case 'reviewing':
      case 'submitted':
        return 'processing'
      case 'draft':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
      case 'passed':
        return '已通过'
      case 'rejected':
      case 'failed':
        return '未通过'
      case 'reviewing':
        return '审核中'
      case 'submitted':
        return '已提交'
      case 'draft':
        return '草稿'
      default:
        return '待处理'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'passed':
        return <CheckCircleOutlined />
      case 'rejected':
      case 'failed':
        return <CloseCircleOutlined />
      case 'reviewing':
      case 'submitted':
        return <SyncOutlined spin />
      default:
        return <ClockCircleOutlined />
    }
  }

  const cards = [
    { key: 'topic' as const, title: '选题申报', description: '查看选题提交与审核状态', icon: <FileTextOutlined /> },
    { key: 'taskBook' as const, title: '任务书', description: '查看任务书编写与审核进度', icon: <BookOutlined /> },
    { key: 'proposal' as const, title: '开题报告', description: '查看开题报告提交与审核状态', icon: <FileOutlined /> },
    { key: 'midterm' as const, title: '中期报告', description: '查看中期报告提交与审核进度', icon: <AuditOutlined /> },
  ]

  const timelineItems = [
    { label: '选题申报', data: statusInfo.topic, detail: statusInfo.topic.title },
    { label: '任务书', data: statusInfo.taskBook },
    { label: '开题报告', data: statusInfo.proposal },
    { label: '中期报告', data: statusInfo.midterm },
  ].filter((item) => item.data.updatedAt)

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '56px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1>学生工作台</h1>
        <p style={{ marginBottom: 0, color: '#666' }}>在这里查看毕业设计流程进度、审核结果与教师反馈。</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {cards.map((card) => {
          const current = statusInfo[card.key]

          return (
            <Col xs={24} sm={12} lg={6} key={card.key}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
                  <h3>{card.title}</h3>
                  <p style={{ minHeight: 40, color: '#666', fontSize: 13 }}>{card.description}</p>
                  <Tag color={getStatusColor(current.status)} icon={getStatusIcon(current.status)}>
                    {getStatusText(current.status)}
                  </Tag>
                  {current.feedback ? (
                    <div style={{ marginTop: 10, color: '#666', fontSize: 12, textAlign: 'left' }}>{current.feedback}</div>
                  ) : null}
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>

      <Card title="进度时间线" style={{ marginBottom: 24 }}>
        {timelineItems.length > 0 ? (
          <Timeline>
            {timelineItems.map((item) => (
              <Timeline.Item
                key={`${item.label}-${item.data.updatedAt}`}
                color={getStatusColor(item.data.status)}
                dot={getStatusIcon(item.data.status)}
              >
                <div>{item.label}</div>
                {item.detail ? <div style={{ color: '#666', fontSize: 12 }}>{item.detail}</div> : null}
                <div style={{ color: '#999', fontSize: 12 }}>{new Date(item.data.updatedAt as string).toLocaleString()}</div>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Empty description="暂无进度记录" />
        )}
      </Card>

      {statusInfo.topic.feedback ? (
        <Card title="选题审核意见" type="inner" style={{ marginBottom: 16 }}>
          <Alert message={statusInfo.topic.feedback} type={statusInfo.topic.status === 'approved' ? 'success' : 'warning'} showIcon />
        </Card>
      ) : null}

      {statusInfo.taskBook.feedback ? (
        <Card title="任务书审核意见" type="inner" style={{ marginBottom: 16 }}>
          <Alert message={statusInfo.taskBook.feedback} type={statusInfo.taskBook.status === 'approved' ? 'success' : 'warning'} showIcon />
        </Card>
      ) : null}

      {statusInfo.proposal.feedback ? (
        <Card title="开题报告审核意见" type="inner" style={{ marginBottom: 16 }}>
          <Alert message={statusInfo.proposal.feedback} type={statusInfo.proposal.status === 'approved' ? 'success' : 'warning'} showIcon />
        </Card>
      ) : null}

      {statusInfo.midterm.feedback ? (
        <Card title="中期报告审核意见" type="inner">
          <Alert message={statusInfo.midterm.feedback} type={statusInfo.midterm.status === 'approved' ? 'success' : 'warning'} showIcon />
        </Card>
      ) : null}
    </div>
  )
}

export default StudentDashboard
