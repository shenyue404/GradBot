import React, { useEffect, useState } from 'react'
import { Avatar, Badge, Button, Card, Dropdown, Layout, Menu, Space, message, theme } from 'antd'
import {
  AlertOutlined,
  ApiOutlined,
  BellOutlined,
  BookOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  LogoutOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const { Header, Sider, Content } = Layout

interface AppLayoutProps {
  userType: 'student' | 'teacher' | 'admin'
}

const readCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const readAiDebugInfo = () => {
  try {
    const raw = localStorage.getItem('gradbot-ai-debug')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const AppLayout: React.FC<AppLayoutProps> = ({ userType }) => {
  const [collapsed] = useState(false)
  const [aiDebugInfo, setAiDebugInfo] = useState<any>(() => readAiDebugInfo())
  const navigate = useNavigate()
  const location = useLocation()
  const currentUser = readCurrentUser()
  const {
    token: { colorBgContainer },
  } = theme.useToken()

  useEffect(() => {
    const syncDebugInfo = () => setAiDebugInfo(readAiDebugInfo())
    window.addEventListener('gradbot-ai-debug-updated', syncDebugInfo)
    window.addEventListener('storage', syncDebugInfo)
    return () => {
      window.removeEventListener('gradbot-ai-debug-updated', syncDebugInfo)
      window.removeEventListener('storage', syncDebugInfo)
    }
  }, [])

  const studentMenuItems = [
    { key: '/student/dashboard', icon: <DashboardOutlined />, label: '状态总览' },
    { key: '/student/topic-selection', icon: <FileTextOutlined />, label: '选题申报' },
    { key: '/student/taskbook', icon: <BookOutlined />, label: '任务书' },
    { key: '/student/proposal', icon: <ExperimentOutlined />, label: '开题报告' },
    { key: '/student/midterm', icon: <CheckCircleOutlined />, label: '中期报告' },
    { key: '/student/ai-status', icon: <ApiOutlined />, label: 'AI 连通性' },
  ]

  const teacherMenuItems = [
    { key: '/teacher/topic-review', icon: <FileTextOutlined />, label: '选题审核' },
    { key: '/teacher/taskbook-review', icon: <BookOutlined />, label: '任务书审核' },
    { key: '/teacher/proposal-review', icon: <ExperimentOutlined />, label: '开题审核' },
    { key: '/teacher/midterm-review', icon: <CheckCircleOutlined />, label: '中期审核' },
    { key: '/teacher/ai-status', icon: <ApiOutlined />, label: 'AI 连通性' },
  ]

  const adminMenuItems = [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '管理员总览' },
    { key: '/admin/advisories', icon: <TeamOutlined />, label: '师生分配' },
    { key: '/admin/student-progress', icon: <AlertOutlined />, label: '进度预警' },
    { key: '/admin/ai-status', icon: <ApiOutlined />, label: 'AI 连通性' },
  ]

  const menuItems =
    userType === 'student'
      ? studentMenuItems
      : userType === 'teacher'
        ? teacherMenuItems
        : adminMenuItems

  const handleUserMenuClick = (event: { key: string }) => {
    if (event.key === 'profile') {
      if (userType !== 'admin') {
        navigate(`/${userType}/profile`)
      }
      return
    }

    localStorage.removeItem('token')
    localStorage.removeItem('user')
    message.success('已退出登录')
    navigate('/login')
  }

  const roleTitle = userType === 'student' ? '学生端' : userType === 'teacher' ? '教师端' : '管理员端'
  const displayName = currentUser?.name || (userType === 'student' ? '学生用户' : userType === 'teacher' ? '教师用户' : '管理员')

  const dropdownItems =
    userType === 'admin'
      ? [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }]
      : [
          { key: 'profile', icon: <UserOutlined />, label: '个人资料' },
          { type: 'divider' as const },
          { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
        ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} style={{ background: '#fff', boxShadow: '2px 0 8px rgba(0,0,0,0.1)' }}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
            fontSize: 18,
            fontWeight: 'bold',
            color: '#1677ff',
          }}
        >
          {collapsed ? 'GB' : 'GradBot'}
        </div>

        <Menu mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={(event) => navigate(event.key)} style={{ height: 'calc(100vh - 64px)', borderRight: 0 }} />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 'bold' }}>{roleTitle}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={userType === 'admin' ? 0 : 3} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
            </Badge>

            <Dropdown menu={{ items: dropdownItems, onClick: handleUserMenuClick }} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <span style={{ fontSize: 14 }}>{displayName}</span>
              </Space>
            </Dropdown>
          </div>
        </Header>

        <Content
          style={{
            margin: 24,
            padding: 24,
            background: colorBgContainer,
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            minHeight: 'calc(100vh - 160px)',
            overflow: 'auto',
          }}
        >
          <Outlet />
          {userType === 'student' && aiDebugInfo ? (
            <Card
              size="small"
              title="临时调试信息"
              extra={
                <Button
                  size="small"
                  onClick={() => {
                    localStorage.removeItem('gradbot-ai-debug')
                    setAiDebugInfo(null)
                  }}
                >
                  清空
                </Button>
              }
              style={{
                position: 'fixed',
                right: 24,
                bottom: 24,
                width: 420,
                maxWidth: 'calc(100vw - 48px)',
                zIndex: 1000,
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              }}
            >
              <pre style={{ margin: 0, maxHeight: 260, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(aiDebugInfo, null, 2)}
              </pre>
            </Card>
          ) : null}
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout
