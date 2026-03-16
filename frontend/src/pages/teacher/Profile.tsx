import React, { useEffect, useState } from 'react'
import { Button, Card, Form, Input, message, Select, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { teacherAPI } from '../../utils/api'

interface TeacherProfile {
  id: string
  teacherId: string
  name: string
  email: string
  phone: string
  department: string
  title: string
  researchFields: string[]
  avatar?: string
  birthDate?: string
  gender?: string
  office?: string
  officeHours?: string
}

const Profile: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [fileList, setFileList] = useState<any[]>([])

  useEffect(() => {
    void fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await teacherAPI.getProfile()
      setProfile(data)
      form.setFieldsValue(data)

      if (data.avatar) {
        setFileList([{ uid: '-1', name: '头像', status: 'done', url: data.avatar }])
      }
    } catch (error) {
      console.error('获取教师资料失败:', error)
      message.error('获取个人信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: TeacherProfile) => {
    try {
      setLoading(true)
      await teacherAPI.updateProfile(values)
      message.success('个人信息已更新')
      await fetchProfile()
    } catch (error) {
      console.error('更新教师资料失败:', error)
      message.error('更新个人信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const result = await teacherAPI.uploadAvatar(formData)
      form.setFieldsValue({ avatar: result.url })
      message.success('头像上传成功')
    } catch (error) {
      console.error('上传教师头像失败:', error)
      message.error('头像上传失败')
    }
  }

  const uploadProps = {
    beforeUpload: (file: File) => {
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
    onChange: (info: any) => {
      setFileList(info.fileList)
      if (info.file.originFileObj) {
        void handleAvatarUpload(info.file.originFileObj)
      }
    },
    fileList,
    listType: 'picture-circle' as const,
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
              <Form.Item label="工号" name="teacherId" rules={[{ required: true, message: '请输入工号' }]}>
                <Input disabled placeholder="系统自动读取工号" />
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
            <Input placeholder="例如：1988-11-06" />
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

          <Form.Item label="所属院系" name="department" rules={[{ required: true, message: '请输入所属院系' }]}>
            <Input placeholder="例如：计算机学院" />
          </Form.Item>

          <Form.Item label="职称" name="title" rules={[{ required: true, message: '请选择职称' }]}>
            <Select
              placeholder="请选择职称"
              options={[
                { label: '教授', value: 'professor' },
                { label: '副教授', value: 'associate_professor' },
                { label: '讲师', value: 'lecturer' },
                { label: '助教', value: 'assistant' },
                { label: '研究员', value: 'researcher' },
                { label: '副研究员', value: 'associate_researcher' },
              ]}
            />
          </Form.Item>

          <Form.Item label="研究方向" name="researchFields" rules={[{ required: true, message: '请输入研究方向' }]}>
            <Select mode="tags" placeholder="请输入研究方向，例如：人工智能、教育技术、大模型应用" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="办公室" name="office">
            <Input placeholder="例如：信息楼 A302" />
          </Form.Item>

          <Form.Item label="答疑时间" name="officeHours">
            <Input.TextArea rows={2} placeholder="例如：周二、周四 14:00-16:00" />
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
