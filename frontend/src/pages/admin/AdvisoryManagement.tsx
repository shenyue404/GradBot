import React, { useEffect, useState } from 'react'
import { Button, Card, Col, DatePicker, Form, Input, Modal, Row, Select, Space, Table, Tag, Upload, message } from 'antd'
import type { UploadProps } from 'antd'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { adminAPI } from '../../utils/api'

interface TeacherRow {
  id: number
  teacherId: string
  name: string
  department?: string
  title?: string
  email?: string
  studentCount: number
}

interface StudentRow {
  id: number
  studentId: string
  name: string
  department?: string
  major: string
  grade?: string
  class?: string
  assignedTeachers: Array<{ id: number; teacherId: string; name: string }>
}

interface AdvisoryRow {
  id: number
  status: string
  startDate?: string
  endDate?: string
  teacher: TeacherRow
  student: StudentRow
}

const AdvisoryManagement: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [students, setStudents] = useState<StudentRow[]>([])
  const [advisories, setAdvisories] = useState<AdvisoryRow[]>([])
  const [bindModalOpen, setBindModalOpen] = useState(false)
  const [teacherModalOpen, setTeacherModalOpen] = useState(false)
  const [studentModalOpen, setStudentModalOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [uploadingTeacher, setUploadingTeacher] = useState(false)
  const [uploadingStudent, setUploadingStudent] = useState(false)
  const [bindForm] = Form.useForm()
  const [teacherForm] = Form.useForm()
  const [studentForm] = Form.useForm()

  useEffect(() => {
    void fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [teacherList, studentList, advisoryList] = await Promise.all([
        adminAPI.getTeachers(),
        adminAPI.getStudents(),
        adminAPI.getAdvisories(),
      ])
      setTeachers(Array.isArray(teacherList) ? teacherList : [])
      setStudents(Array.isArray(studentList) ? studentList : [])
      setAdvisories(Array.isArray(advisoryList) ? advisoryList : [])
    } catch (error) {
      console.error('获取管理员数据失败:', error)
      message.error('获取管理员数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    try {
      const values = await bindForm.validateFields()
      await adminAPI.assignStudent({
        teacherId: values.teacherId,
        studentId: values.studentId,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : undefined,
      })
      message.success('师生绑定已更新')
      setBindModalOpen(false)
      bindForm.resetFields()
      await fetchData()
    } catch (error) {
      console.error('更新师生绑定失败:', error)
    }
  }

  const handleDeactivate = async (record: AdvisoryRow) => {
    try {
      await adminAPI.updateAdvisory(record.id, {
        status: 'inactive',
        endDate: dayjs().format('YYYY-MM-DD'),
      })
      message.success('人员关系已调整')
      await fetchData()
    } catch (error) {
      console.error('停用指导关系失败:', error)
      message.error('调整失败')
    }
  }

  const handleCreateTeacher = async () => {
    try {
      const values = await teacherForm.validateFields()
      await adminAPI.createTeacher({
        ...values,
        researchFields: values.researchFields
          ? String(values.researchFields)
              .split(/[,\n，；;]/)
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
      })
      message.success('教师录入成功，默认密码为 GradBot123!')
      setTeacherModalOpen(false)
      teacherForm.resetFields()
      await fetchData()
    } catch (error) {
      console.error('录入教师失败:', error)
    }
  }

  const handleCreateStudent = async () => {
    try {
      const values = await studentForm.validateFields()
      await adminAPI.createStudent(values)
      message.success('学生录入成功，默认密码为 GradBot123!')
      setStudentModalOpen(false)
      studentForm.resetFields()
      await fetchData()
    } catch (error) {
      console.error('录入学生失败:', error)
    }
  }

  const importTeachers: UploadProps['customRequest'] = async (options) => {
    try {
      setUploadingTeacher(true)
      const formData = new FormData()
      formData.append('file', options.file as File)
      const response = await adminAPI.importTeachers(formData)
      const result = response?.data || response
      message.success(`教师批量导入完成：成功 ${result?.success ?? 0} 条，失败 ${result?.failed ?? 0} 条`)
      options.onSuccess?.(result)
      await fetchData()
    } catch (error) {
      console.error('教师批量导入失败:', error)
      message.error('教师批量导入失败')
      options.onError?.(error as Error)
    } finally {
      setUploadingTeacher(false)
    }
  }

  const importStudents: UploadProps['customRequest'] = async (options) => {
    try {
      setUploadingStudent(true)
      const formData = new FormData()
      formData.append('file', options.file as File)
      const response = await adminAPI.importStudents(formData)
      const result = response?.data || response
      message.success(`学生批量导入完成：成功 ${result?.success ?? 0} 条，失败 ${result?.failed ?? 0} 条`)
      options.onSuccess?.(result)
      await fetchData()
    } catch (error) {
      console.error('学生批量导入失败:', error)
      message.error('学生批量导入失败')
      options.onError?.(error as Error)
    } finally {
      setUploadingStudent(false)
    }
  }

  const filteredStudents = students.filter((student) => {
    const text = `${student.name} ${student.studentId} ${student.major} ${student.department || ''} ${student.grade || ''}`.toLowerCase()
    return text.includes(keyword.trim().toLowerCase())
  })

  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card
            title="教师录入与批量导入"
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setTeacherModalOpen(true)}>单个录入教师</Button>}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{ color: '#666' }}>支持单个录入，也支持 Excel 批量导入。默认初始密码为 `GradBot123!`。</div>
              <Upload accept=".xlsx,.xls" showUploadList={false} customRequest={importTeachers}>
                <Button icon={<UploadOutlined />} loading={uploadingTeacher}>批量导入教师 Excel</Button>
              </Upload>
            </Space>
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card
            title="学生录入与批量导入"
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setStudentModalOpen(true)}>单个录入学生</Button>}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{ color: '#666' }}>学生批量导入支持学号、姓名、学院、专业、年级、班级、邮箱等常见列名。</div>
              <Upload accept=".xlsx,.xls" showUploadList={false} customRequest={importStudents}>
                <Button icon={<UploadOutlined />} loading={uploadingStudent}>批量导入学生 Excel</Button>
              </Upload>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="教师名单" style={{ marginTop: 24, marginBottom: 24 }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={teachers}
          pagination={{ pageSize: 8 }}
          columns={[
            {
              title: '教师',
              render: (_, record: TeacherRow) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{record.name}</div>
                  <div style={{ color: '#999', fontSize: 12 }}>{record.teacherId}</div>
                </div>
              ),
            },
            { title: '学院', dataIndex: 'department' },
            { title: '职称', dataIndex: 'title' },
            { title: '邮箱', dataIndex: 'email' },
            { title: '当前学生数', dataIndex: 'studentCount' },
            {
              title: '操作',
              render: (_, record: TeacherRow) => (
                <Button type="link" onClick={() => navigate(`/admin/teachers/${record.teacherId}/students`)}>
                  查看名下学生
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Card
        title="指导关系调整"
        extra={<Button type="primary" onClick={() => setBindModalOpen(true)}>新增绑定</Button>}
        style={{ marginBottom: 24 }}
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={advisories}
          pagination={{ pageSize: 8 }}
          columns={[
            {
              title: '教师',
              render: (_, record: AdvisoryRow) => `${record.teacher.name}（${record.teacher.teacherId}）`,
            },
            {
              title: '学生',
              render: (_, record: AdvisoryRow) => `${record.student.name}（${record.student.studentId}）`,
            },
            {
              title: '学院 / 专业 / 年级',
              render: (_, record: AdvisoryRow) =>
                [record.student.department, record.student.major, record.student.grade].filter(Boolean).join(' / '),
            },
            {
              title: '状态',
              render: (_, record: AdvisoryRow) => (
                <Tag color={record.status === 'active' ? 'green' : 'default'}>
                  {record.status === 'active' ? '有效' : '已停用'}
                </Tag>
              ),
            },
            { title: '开始日期', dataIndex: 'startDate' },
            {
              title: '操作',
              render: (_, record: AdvisoryRow) =>
                record.status === 'active' ? (
                  <Button danger size="small" onClick={() => void handleDeactivate(record)}>
                    调整解绑
                  </Button>
                ) : (
                  <span style={{ color: '#999' }}>无</span>
                ),
            },
          ]}
        />
      </Card>

      <Card title="学生名单速览">
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
          <Input.Search
            allowClear
            placeholder="按姓名、学号、学院、专业、年级筛选"
            style={{ width: 320 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <span style={{ color: '#666' }}>共 {filteredStudents.length} 名学生</span>
        </Space>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredStudents}
          pagination={{ pageSize: 8 }}
          columns={[
            {
              title: '学生',
              render: (_, record: StudentRow) => `${record.name}（${record.studentId}）`,
            },
            { title: '学院', dataIndex: 'department' },
            { title: '专业', dataIndex: 'major' },
            { title: '年级', dataIndex: 'grade' },
            { title: '班级', dataIndex: 'class' },
            {
              title: '当前指导教师',
              render: (_, record: StudentRow) =>
                record.assignedTeachers.length
                  ? record.assignedTeachers.map((teacher) => `${teacher.name}（${teacher.teacherId}）`).join('，')
                  : '未分配',
            },
          ]}
        />
      </Card>

      <Modal title="新增师生绑定" open={bindModalOpen} onCancel={() => setBindModalOpen(false)} onOk={() => void handleAssign()}>
        <Form form={bindForm} layout="vertical">
          <Form.Item label="教师" name="teacherId" rules={[{ required: true, message: '请选择教师' }]}>
            <Select
              placeholder="请选择教师"
              options={teachers.map((teacher) => ({
                label: `${teacher.name}（${teacher.teacherId}）`,
                value: teacher.teacherId,
              }))}
            />
          </Form.Item>
          <Form.Item label="学生" name="studentId" rules={[{ required: true, message: '请选择学生' }]}>
            <Select
              placeholder="请选择学生"
              options={students.map((student) => ({
                label: `${student.name}（${student.studentId}）`,
                value: student.studentId,
              }))}
            />
          </Form.Item>
          <Form.Item label="开始日期" name="startDate">
            <DatePicker style={{ width: '100%' }} placeholder="默认使用今天" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="单个录入教师" open={teacherModalOpen} onCancel={() => setTeacherModalOpen(false)} onOk={() => void handleCreateTeacher()}>
        <Form form={teacherForm} layout="vertical">
          <Form.Item label="工号" name="teacherId" rules={[{ required: true, message: '请输入工号' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input />
          </Form.Item>
          <Form.Item label="学院" name="department">
            <Input />
          </Form.Item>
          <Form.Item label="职称" name="title">
            <Input />
          </Form.Item>
          <Form.Item label="电话" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="办公室" name="office">
            <Input />
          </Form.Item>
          <Form.Item label="答疑时间" name="officeHours">
            <Input />
          </Form.Item>
          <Form.Item label="研究方向" name="researchFields">
            <TextAreaRows />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="单个录入学生" open={studentModalOpen} onCancel={() => setStudentModalOpen(false)} onOk={() => void handleCreateStudent()}>
        <Form form={studentForm} layout="vertical">
          <Form.Item label="学号" name="studentId" rules={[{ required: true, message: '请输入学号' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input />
          </Form.Item>
          <Form.Item label="学院" name="department">
            <Input />
          </Form.Item>
          <Form.Item label="专业" name="major" rules={[{ required: true, message: '请输入专业' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="年级" name="grade">
            <Input />
          </Form.Item>
          <Form.Item label="班级" name="class">
            <Input />
          </Form.Item>
          <Form.Item label="电话" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="指导教师展示名" name="advisor">
            <Input />
          </Form.Item>
          <Form.Item label="研究方向" name="researchDirection">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

const TextAreaRows: React.FC = () => <Input.TextArea rows={3} placeholder="多个方向可用逗号或换行分隔" />

export default AdvisoryManagement
