import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AppLayout from './components/Layout/AppLayout'
import Login from './pages/Login'
import StudentDashboard from './pages/student/StudentDashboard'
import TopicSelection from './pages/student/TopicSelection'
import TaskBookGeneration from './pages/student/TaskBookGeneration'
import ProposalGeneration from './pages/student/ProposalGeneration'
import MidtermReportGeneration from './pages/student/MidtermReportGeneration'
import StudentProfile from './pages/student/Profile'
import TopicReview from './pages/teacher/TopicReview'
import TaskBookReview from './pages/teacher/TaskBookReview'
import ProposalReview from './pages/teacher/ProposalReview'
import MidtermReportReview from './pages/teacher/MidtermReportReview'
import TeacherProfile from './pages/teacher/Profile'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdvisoryManagement from './pages/admin/AdvisoryManagement'
import StudentProgress from './pages/admin/StudentProgress'
import TeacherStudents from './pages/admin/TeacherStudents'
import AiHealthCheck from './pages/shared/AiHealthCheck'
import './App.css'

const getDefaultRoute = () => {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) {
      return '/login'
    }

    const user = JSON.parse(raw)
    if (user?.role === 'student') {
      return '/student'
    }

    if (user?.role === 'teacher') {
      return '/teacher'
    }

    if (user?.role === 'admin') {
      return '/admin'
    }
  } catch {
    return '/login'
  }

  return '/login'
}

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />

          <Route path="/student" element={<AppLayout userType="student" />}>
            <Route index element={<StudentDashboard />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="topic-selection" element={<TopicSelection />} />
            <Route path="taskbook" element={<TaskBookGeneration />} />
            <Route path="proposal" element={<ProposalGeneration />} />
            <Route path="midterm" element={<MidtermReportGeneration />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="ai-status" element={<AiHealthCheck />} />
          </Route>

          <Route path="/teacher" element={<AppLayout userType="teacher" />}>
            <Route index element={<TopicReview />} />
            <Route path="topic-review" element={<TopicReview />} />
            <Route path="taskbook-review" element={<TaskBookReview />} />
            <Route path="proposal-review" element={<ProposalReview />} />
            <Route path="midterm-review" element={<MidtermReportReview />} />
            <Route path="profile" element={<TeacherProfile />} />
            <Route path="ai-status" element={<AiHealthCheck />} />
          </Route>

          <Route path="/admin" element={<AppLayout userType="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="advisories" element={<AdvisoryManagement />} />
            <Route path="student-progress" element={<StudentProgress />} />
            <Route path="teachers/:teacherId/students" element={<TeacherStudents />} />
            <Route path="ai-status" element={<AiHealthCheck />} />
          </Route>

          <Route path="*" element={<div>404 - Page not found</div>} />
        </Routes>
      </Router>
    </ConfigProvider>
  )
}

export default App
