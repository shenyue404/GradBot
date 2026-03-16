import React, { useEffect, useState } from 'react'
import { Alert, Card, Col, List, Row, Spin, Tag } from 'antd'
import { adminAPI } from '../../utils/api'

interface AlertItem {
  studentId: string
  studentName: string
  major: string
  progressScore: number
  qualityScore: number
  riskLevel: 'high' | 'medium' | 'normal'
  riskReasons: string[]
}

interface OverviewData {
  teacherCount: number
  studentCount: number
  advisoryCount: number
  topicCount: number
  alertCount: number
  alerts: AlertItem[]
}

const getRiskTag = (riskLevel: string) => {
  if (riskLevel === 'high') {
    return <Tag color="red">重点关注</Tag>
  }
  if (riskLevel === 'medium') {
    return <Tag color="orange">预警</Tag>
  }
  return <Tag color="green">正常</Tag>
}

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<OverviewData | null>(null)

  useEffect(() => {
    void fetchOverview()
  }, [])

  const fetchOverview = async () => {
    try {
      setLoading(true)
      const data = await adminAPI.getOverview()
      setOverview(data)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '56px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <h1>管理员总览</h1>
        <p style={{ color: '#666', marginBottom: 0 }}>查看全校师生分配情况、选题覆盖情况和重点预警学生。</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card title="教师人数">{overview?.teacherCount || 0}</Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title="学生人数">{overview?.studentCount || 0}</Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title="有效指导关系">{overview?.advisoryCount || 0}</Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title="预警学生">{overview?.alertCount || 0}</Card>
        </Col>
      </Row>

      <Card title="重点关注学生">
        {overview?.alerts?.length ? (
          <List
            dataSource={overview.alerts}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{item.studentName}</span>
                      <span style={{ color: '#999' }}>({item.studentId})</span>
                      {getRiskTag(item.riskLevel)}
                    </div>
                  }
                  description={
                    <div>
                      <div>专业：{item.major}</div>
                      <div>进度分：{item.progressScore}，质量分：{item.qualityScore}</div>
                      <div>原因：{item.riskReasons.join('；') || '暂无'}</div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Alert type="success" showIcon message="当前没有需要重点关注的学生。" />
        )}
      </Card>
    </div>
  )
}

export default AdminDashboard
