import React, { useEffect, useState } from 'react'
import { Button, Card, Progress, Select, Space, Table, Tag } from 'antd'
import { adminAPI } from '../../utils/api'

interface ProgressRow {
  id: number
  studentId: string
  name: string
  department: string
  major: string
  grade: string
  class?: string
  teacherId?: string
  teacherName: string
  topicStatus: string
  taskBookStatus: string
  proposalStatus: string
  midtermStatus: string
  progressScore: number
  qualityScore: number
  riskLevel: 'high' | 'medium' | 'normal'
  riskReasons: string[]
}

interface FilterOptions {
  departments: string[]
  majors: string[]
  grades: string[]
  riskLevels: string[]
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

const riskLabelMap: Record<string, string> = {
  high: '重点关注',
  medium: '预警',
  normal: '正常',
}

const StudentProgress: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<ProgressRow[]>([])
  const [options, setOptions] = useState<FilterOptions>({
    departments: [],
    majors: [],
    grades: [],
    riskLevels: ['high', 'medium', 'normal'],
  })
  const [filters, setFilters] = useState({
    department: undefined as string | undefined,
    major: undefined as string | undefined,
    grade: undefined as string | undefined,
    riskLevel: 'high' as string | undefined,
  })

  useEffect(() => {
    void fetchRows(filters)
  }, [])

  const fetchRows = async (nextFilters = filters) => {
    try {
      setLoading(true)
      const response = await adminAPI.getStudentProgress(nextFilters)
      setRows(response.data)
      setOptions((previous) => ({
        departments: response.meta?.filters?.departments || previous.departments,
        majors: response.meta?.filters?.majors || previous.majors,
        grades: response.meta?.filters?.grades || previous.grades,
        riskLevels: response.meta?.filters?.riskLevels || previous.riskLevels,
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof typeof filters, value?: string) => {
    const nextFilters = { ...filters, [key]: value || undefined }
    setFilters(nextFilters)
    void fetchRows(nextFilters)
  }

  const resetFilters = () => {
    const nextFilters = {
      department: undefined,
      major: undefined,
      grade: undefined,
      riskLevel: undefined,
    }
    setFilters(nextFilters)
    void fetchRows(nextFilters)
  }

  const renderRisk = (record: ProgressRow) => {
    if (record.riskLevel === 'high') {
      return <Tag color="red">{riskLabelMap[record.riskLevel]}</Tag>
    }
    if (record.riskLevel === 'medium') {
      return <Tag color="orange">{riskLabelMap[record.riskLevel]}</Tag>
    }
    return <Tag color="green">{riskLabelMap[record.riskLevel]}</Tag>
  }

  return (
    <div className="page-container">
      <Card title="学生进度与质量预警">
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="按学院筛选"
            style={{ width: 180 }}
            value={filters.department}
            onChange={(value) => handleFilterChange('department', value)}
            options={options.departments.map((item) => ({ label: item, value: item }))}
          />
          <Select
            allowClear
            placeholder="按专业筛选"
            style={{ width: 220 }}
            value={filters.major}
            onChange={(value) => handleFilterChange('major', value)}
            options={options.majors.map((item) => ({ label: item, value: item }))}
          />
          <Select
            allowClear
            placeholder="按年级筛选"
            style={{ width: 150 }}
            value={filters.grade}
            onChange={(value) => handleFilterChange('grade', value)}
            options={options.grades.map((item) => ({ label: item, value: item }))}
          />
          <Select
            allowClear
            placeholder="按风险级别筛选"
            style={{ width: 180 }}
            value={filters.riskLevel}
            onChange={(value) => handleFilterChange('riskLevel', value)}
            options={options.riskLevels.map((item) => ({ label: riskLabelMap[item] || item, value: item }))}
          />
          <Button onClick={resetFilters}>重置筛选</Button>
        </Space>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          scroll={{ x: 1600 }}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: '学生',
              render: (_, record) => (
                <div>
                  <div>{record.name}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{record.studentId}</div>
                </div>
              ),
            },
            { title: '学院', dataIndex: 'department' },
            { title: '专业', dataIndex: 'major' },
            { title: '年级', dataIndex: 'grade' },
            { title: '班级', dataIndex: 'class' },
            { title: '指导教师', dataIndex: 'teacherName' },
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
              title: '风险级别',
              render: (_, record) => renderRisk(record),
            },
            {
              title: '预警原因',
              render: (_, record) => (
                <span style={{ color: record.riskLevel === 'high' ? '#cf1322' : record.riskLevel === 'medium' ? '#ad6800' : '#389e0d' }}>
                  {record.riskReasons.join('；') || '暂无'}
                </span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default StudentProgress
