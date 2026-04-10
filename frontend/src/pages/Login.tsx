import React, { useState } from 'react'
import { Form, Input, Button, Card, message, Radio } from 'antd'
import { MailOutlined, LockOutlined, UserOutlined, PhoneOutlined, IdcardOutlined, BookOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../utils/api'

interface LoginFormData {
  role: 'student' | 'teacher' | 'admin'
  email: string
  password: string
}

interface RegisterFormData {
  name: string
  email: string
  password: string
  role: 'student' | 'teacher'
  studentId?: string
  teacherId?: string
  department?: string
  major?: string
  class?: string
  phone?: string
}

const Login: React.FC = () => {
  const [form] = Form.useForm()
  const [registerForm] = Form.useForm()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [currentRole, setCurrentRole] = useState<'student' | 'teacher'>('student')
  const navigate = useNavigate()

  const navigateByRole = (role?: 'student' | 'teacher' | 'admin') => {
    if (role === 'teacher') {
      navigate('/teacher')
      return
    }
    if (role === 'admin') {
      navigate('/admin')
      return
    }
    navigate('/student')
  }

  const handleLogin = async (values: LoginFormData) => {
    setLoading(true)
    try {
      const response = await authAPI.login(values.email, values.password)
      if (response.user?.role !== values.role) {
        const roleLabelMap = {
          student: '学生',
          teacher: '教师',
          admin: '管理员',
        }
        message.error(`该账号不是${roleLabelMap[values.role]}账号。`)
        return
      }

      if (response.token) {
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        message.success('登录成功')
        navigateByRole(response.user.role)
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values: RegisterFormData) => {
    setLoading(true)
    try {
      const response = await authAPI.register(values)
      if (response.token) {
        localStorage.setItem('token', response.token)
        localStorage.setItem('user', JSON.stringify(response.user))
        message.success('注册成功')
        navigateByRole(response.user?.role)
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (key: 'login' | 'register') => {
    setActiveTab(key)
    if (key === 'register') {
      setTimeout(() => {
        registerForm.resetFields()
        registerForm.setFieldsValue({ role: 'student' })
        setCurrentRole('student')
      }, 0)
      return
    }

    setTimeout(() => {
      form.setFieldsValue({ role: 'student' })
    }, 0)
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card style={{ width: 440, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ color: '#1890ff' }}>GradBot</h1>
          <p style={{ color: '#666' }}>毕业设计辅助平台</p>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Button type={activeTab === 'login' ? 'primary' : 'default'} onClick={() => switchTab('login')} style={{ marginRight: 16 }}>
            登录
          </Button>
          <Button type={activeTab === 'register' ? 'primary' : 'default'} onClick={() => switchTab('register')}>
            注册
          </Button>
        </div>

        {activeTab === 'login' ? (
          <Form form={form} name="login" onFinish={handleLogin} autoComplete="off" layout="vertical" initialValues={{ role: 'student' }}>
            <Form.Item name="role" rules={[{ required: true, message: '请选择身份' }]}>
              <Radio.Group>
                <Radio value="student">学生登录</Radio>
                <Radio value="teacher">教师登录</Radio>
                <Radio value="admin">管理员登录</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item name="email" rules={[{ required: true, message: '请输入邮箱' }]}>
              <Input prefix={<MailOutlined />} placeholder="邮箱地址" size="large" />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} size="large" style={{ width: '100%' }}>
                登录
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form form={registerForm} name="register" onFinish={handleRegister} autoComplete="off" layout="vertical" initialValues={{ role: 'student' }}>
            <Form.Item name="name" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input prefix={<UserOutlined />} placeholder="姓名" size="large" />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="邮箱地址" size="large" />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
            </Form.Item>

            <Form.Item name="role" rules={[{ required: true, message: '请选择身份' }]}>
              <Radio.Group
                onChange={(e) => {
                  const nextRole = e.target.value as 'student' | 'teacher'
                  setCurrentRole(nextRole)
                  if (nextRole === 'student') {
                    registerForm.setFieldValue('teacherId', '')
                  } else {
                    registerForm.setFieldValue('studentId', '')
                  }
                }}
              >
                <Radio value="student">学生注册</Radio>
                <Radio value="teacher">教师注册</Radio>
              </Radio.Group>
            </Form.Item>

            {currentRole === 'student' && (
              <Form.Item name="studentId" rules={[{ required: true, message: '请输入学号' }]}>
                <Input prefix={<IdcardOutlined />} placeholder="学号" size="large" />
              </Form.Item>
            )}

            {currentRole === 'student' && (
              <Form.Item name="major" rules={[{ required: true, message: '请输入专业' }]}>
                <Input prefix={<BookOutlined />} placeholder="专业" size="large" />
              </Form.Item>
            )}

            {currentRole === 'teacher' && (
              <Form.Item name="teacherId" rules={[{ required: true, message: '请输入工号' }]}>
                <Input prefix={<IdcardOutlined />} placeholder="工号" size="large" />
              </Form.Item>
            )}

            <Form.Item name="phone">
              <Input prefix={<PhoneOutlined />} placeholder="联系电话，可选" size="large" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} size="large" style={{ width: '100%' }}>
                注册
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  )
}

export default Login
