import React, { useEffect, useState } from 'react'
import { Button, Card, Form, Input, message, Select, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { studentAPI } from '../../utils/api'

interface StudentProfile {
  id: string
  studentId: string
  name: string
  email: string
  phone: string
  major: string
  grade: string
  class: string
  advisor: string
  researchDirection: string
  avatar?: string
  birthDate?: string
  gender?: string
}

const Profile: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [fileList, setFileList] = useState<any[]>([])

  useEffect(() => {
    void fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await studentAPI.getProfile()
      setProfile(data)
      form.setFieldsValue(data)

      if (data.avatar) {
        setFileList([{ uid: '-1', name: '头像', status: 'done', url: data.avatar }])
      }
    } catch (error) {
      console.error('获取学生资料失败:', error)
      message.error('获取个人信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: StudentProfile) => {
    try {
      setLoading(true)
      await studentAPI.updateProfile(values)
      message.success('个人信息已更新')
      await fetchProfile()
    } catch (error) {
      console.error('更新学生资料失败:', error)
      message.error('更新个人信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const result = await studentAPI.uploadAvatar(formData)
      form.setFieldsValue({ avatar: result.url })
      message.success('头像上传成功')
    } catch (error) {
      console.error('上传头像失败:', error)
      message.error('头像上传失败')
    }
  }

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      if (!file.type.startsWith('image/')) {
        message.error('仅支持上传图片文件')
        return false
      }
      if (file.size / 1024 / 1024 >= 2) {
        message.error('图片大小不能超过 2MB')
        return false
      }
      return false
    },
    onChange: (info) => {
      setFileList(info.fileList)
      if (info.file.originFileObj) {
        void handleAvatarUpload(info.file.originFileObj)
      }
    },
    fileList,
    listType: 'picture-circle',
    maxCount: 1,
  }

  return (
    <div className="profile-container">
      <Card title="个人信息" loading={loading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={profile || {}}>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <Form.Item label="头像" name="avatar">
                <Upload {...uploadProps}>
                  {fileList.length === 0 && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>点击上传头像</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </div>
            <div style={{ flex: 3 }}>
              <Form.Item label="学号" name="studentId" rules={[{ required: true, message: '请输入学号' }]}>
                <Input disabled placeholder="系统自动读取学号" />
              </Form.Item>
            </div>
          </div>

          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input disabled placeholder="系统自动读取姓名" />
          </Form.Item>

          <Form.Item label="性别" name="gender">
            <Select
              placeholder="请选择性别"
              options={[
                { label: '男', value: 'male' },
                { label: '女', value: 'female' },
                { label: '其他', value: 'other' },
              ]}
            />
          </Form.Item>

          <Form.Item label="出生日期" name="birthDate">
            <Input placeholder="例如：2002-06-18" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入常用邮箱" />
          </Form.Item>

          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item label="专业" name="major" rules={[{ required: true, message: '请输入专业名称' }]}>
            <Input disabled placeholder="系统自动读取专业" />
          </Form.Item>

          <Form.Item label="年级" name="grade" rules={[{ required: true, message: '请选择年级' }]}>
            <Select
              placeholder="请选择年级"
              options={[
                { label: '大一', value: 'freshman' },
                { label: '大二', value: 'sophomore' },
                { label: '大三', value: 'junior' },
                { label: '大四', value: 'senior' },
                { label: '研究生', value: 'graduate' },
              ]}
            />
          </Form.Item>

          <Form.Item label="班级" name="class" rules={[{ required: true, message: '请输入班级' }]}>
            <Input placeholder="例如：计算机 2101 班" />
          </Form.Item>

          <Form.Item label="指导教师" name="advisor" rules={[{ required: true, message: '请输入指导教师姓名' }]}>
            <Input placeholder="请输入指导教师姓名" />
          </Form.Item>

          <Form.Item label="研究方向" name="researchDirection" rules={[{ required: true, message: '请输入研究方向' }]}>
            <Input.TextArea rows={3} placeholder="例如：大模型应用、教育数据分析、知识图谱等" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存修改
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => form.resetFields()}>
              重置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Profile
