import React, { useEffect, useState } from 'react'
import { Card, Col, Descriptions, Empty, Progress, Row, Spin, Table, Tag } from 'antd'
import { useParams } from 'react-router-dom'
import { adminAPI } from '../../utils/api'

interface TeacherDetail {
  id: number
  teacherId: string
  name: string
  department: string
  title: string
  email: string
  phone: string
  studentCount: number
}

interface TeacherStudentRow {
  id: number
  studentId: string
  name: string
  department: string
  major: string
  grade: string
  class: string
  topicTitle: string
  topicStatus: string
  taskBookStatus: string
  proposalStatus: string
  midtermStatus: string
  progressScore: number
  qualityScore: number
  riskLevel: 'high' | 'medium' | 'normal'
  riskReasons: string[]
}

interface TeacherStudentResponse {
  teacher: TeacherDetail
  summary: {
    totalStudents: number
    highRiskCount: number
    mediumRiskCount: number
    normalCount: number
  }
  students: TeacherStudentRow[]
}

const statusLabelMap: Record<string, string> = {
  not_started: '未开始',
  draft: '草稿',
  pending: '待审核',
  submitted: '已提交',
  reviewing: '审核中',
  approved: '已通过',
  reviewed: '已完成',
  rejected: '未通过',
  failed: '不合格',
}

const renderRiskTag = (riskLevel: string) => {
  if (riskLevel === 'high') {
    return <Tag color="red">重点关注</Tag>
  }
  if (riskLevel === 'medium') {
    return <Tag color="orange">预警</Tag>
  }
  return <Tag color="green">正常</Tag>
}

const TeacherStudents: React.FC = () => {
  const { teacherId = '' } = useParams()
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<TeacherStudentResponse | null>(null)

  useEffect(() => {
    if (teacherId) {
      void fetchDetail(teacherId)
    }
  }, [teacherId])

  const fetchDetail = async (value: string) => {
    try {
      setLoading(true)
      const data = await adminAPI.getTeacherStudents(value)
      setDetail(data)
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

  if (!detail) {
    return <Empty description="未找到教师信息" />
  }

  return (
    <div className="page-container">
      <Card title="教师名下学生详情" style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
          <Descriptions.Item label="教师姓名">{detail.teacher.name}</Descriptions.Item>
          <Descriptions.Item label="教师编号">{detail.teacher.teacherId}</Descriptions.Item>
          <Descriptions.Item label="学院">{detail.teacher.department || '未填写'}</Descriptions.Item>
          <Descriptions.Item label="职称">{detail.teacher.title || '未填写'}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{detail.teacher.email || '未填写'}</Descriptions.Item>
          <Descriptions.Item label="电话">{detail.teacher.phone || '未填写'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card title="学生总数">{detail.summary.totalStudents}</Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title="重点关注">{detail.summary.highRiskCount}</Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title="预警学生">{detail.summary.mediumRiskCount}</Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title="正常学生">{detail.summary.normalCount}</Card>
        </Col>
      </Row>

      <Card title="学生明细">
        <Table
          rowKey="id"
          dataSource={detail.students}
          scroll={{ x: 1500 }}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: '学生',
              render: (_, record) => (
                <div>
                  <div>{record.name}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>{record.studentId}</div>
                </div>
              ),
            },
            { title: '学院', dataIndex: 'department' },
            { title: '专业', dataIndex: 'major' },
            { title: '年级 / 班级', render: (_, record) => [record.grade, record.class].filter(Boolean).join(' / ') },
            { title: '选题题目', dataIndex: 'topicTitle', render: (value) => value || '尚未选题' },
            { title: '选题', dataIndex: 'topicStatus', render: (value) => statusLabelMap[value] || value },
            { title: '任务书', dataIndex: 'taskBookStatus', render: (value) => statusLabelMap[value] || value },
            { title: '开题', dataIndex: 'proposalStatus', render: (value) => statusLabelMap[value] || value },
            { title: '中期', dataIndex: 'midtermStatus', render: (value) => statusLabelMap[value] || value },
            {
              title: '进度分',
              render: (_, record) => <Progress percent={record.progressScore} size="small" status={record.progressScore < 60 ? 'exception' : 'active'} />,
            },
            {
              title: '质量分',
              render: (_, record) => <Progress percent={record.qualityScore} size="small" status={record.qualityScore < 75 ? 'exception' : 'active'} />,
            },
            {
              title: '风险',
              render: (_, record) => renderRiskTag(record.riskLevel),
            },
            {
              title: '说明',
              render: (_, record) => record.riskReasons.join('；') || '暂无',
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default TeacherStudents
