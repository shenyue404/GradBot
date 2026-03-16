import React, { useState } from 'react'
import { Layout as AntLayout, Menu, Button, Switch, Space } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  BookOutlined,
  AuditOutlined,
  FileDoneOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Header, Sider, Content } = AntLayout

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [userType, setUserType] = useState<'student' | 'teacher'>('student')
  const navigate = useNavigate()
  const location = useLocation()

  const studentMenuItems = [
    { key: '/student/dashboard', icon: <DashboardOutlined />, label: '状态通知' },
    { key: '/student/topic-selection', icon: <FileTextOutlined />, label: '选题申报' },
    { key: '/student/taskbook', icon: <BookOutlined />, label: '任务书生成' },
    { key: '/student/proposal', icon: <FileDoneOutlined />, label: '开题报告生成' },
    { key: '/student/midterm', icon: <AuditOutlined />, label: '中期报告生成' },
  ]

  const teacherMenuItems = [
    { key: '/teacher/dashboard', icon: <DashboardOutlined />, label: '教师工作台' },
    { key: '/teacher/topic-review', icon: <FileTextOutlined />, label: '选题审核' },
    { key: '/teacher/taskbook-review', icon: <BookOutlined />, label: '任务书批改' },
    { key: '/teacher/proposal-review', icon: <FileDoneOutlined />, label: '开题报告批改' },
    { key: '/teacher/midterm-review', icon: <AuditOutlined />, label: '中期报告批改' },
  ]

  const currentMenuItems = userType === 'student' ? studentMenuItems : teacherMenuItems

  const toggleUserType = () => {
    const nextType = userType === 'student' ? 'teacher' : 'student'
    setUserType(nextType)
    navigate(nextType === 'student' ? '/student/dashboard' : '/teacher/dashboard')
  }

  return (
    <AntLayout className="main-layout">
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div
          className="logo"
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          {collapsed ? 'GB' : 'GradBot'}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={currentMenuItems} onClick={({ key }) => navigate(key)} />
      </Sider>
      <AntLayout>
        <Header style={{ padding: '0 24px', background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((value) => !value)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Space>
              <Switch checkedChildren="教师端" unCheckedChildren="学生端" checked={userType === 'teacher'} onChange={toggleUserType} />
              <UserSwitchOutlined />
            </Space>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
