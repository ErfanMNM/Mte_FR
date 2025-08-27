import React, { useMemo } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import KanbanBoard from './kanban/KanbanBoard.jsx'
import { AuthProvider, useAuth } from './auth/AuthProvider.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
import LoginPage from './pages/LoginPage.jsx'
import UsersPage from './pages/UsersPage.jsx'
import ProjectsList from './pages/ProjectsList.jsx'
import ProjectDetail from './pages/ProjectDetail.jsx'

function Layout({ children }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  function AvatarTopbar() {
    const { user, profile } = useAuth()
    const initials = useMemo(() => {
      const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() || user?.username || user?.email || 'U'
      const parts = name.split(' ').filter(Boolean)
      return parts.slice(0,2).map(p => p[0]?.toUpperCase()).join('') || 'U'
    }, [profile, user])
    if (profile?.avatar_url) {
      return <img className="avatar" src={profile.avatar_url} alt={initials} title={user?.email || ''} style={{ width: 32, height: 32, borderRadius: 999, objectFit: 'cover' }} />
    }
    return <div className="avatar" title={user?.email || ''} style={{ width: 32, height: 32 }}>{initials}</div>
  }
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar__logo">Kanban Admin</div>
        <nav className="sidebar__nav">
          <NavLink to="/" end className={({isActive}) => isActive ? 'nav__item active' : 'nav__item'}>
            <span className="nav__icon">🏠</span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/projects" className={({isActive}) => isActive ? 'nav__item active' : 'nav__item'}>
            <span className="nav__icon">📁</span>
            <span>Projects</span>
          </NavLink>
          <NavLink to="/tasks" className={({isActive}) => isActive ? 'nav__item active' : 'nav__item'}>
            <span className="nav__icon">✅</span>
            <span>Tasks</span>
          </NavLink>
          <NavLink to="/users" className={({isActive}) => isActive ? 'nav__item active' : 'nav__item'}>
            <span className="nav__icon">👥</span>
            <span>Users</span>
          </NavLink>
          <NavLink to="/settings" className={({isActive}) => isActive ? 'nav__item active' : 'nav__item'}>
            <span className="nav__icon">⚙️</span>
            <span>Settings</span>
          </NavLink>
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <input className="input topbar__search" placeholder="Tìm kiếm nhanh..." />
          <div className="topbar__right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge">v0.1.0</span>
            <AvatarTopbar />
            <button className="btn btn--ghost" onClick={() => { logout(); navigate('/login', { replace: true }) }} title="Đăng xuất">Đăng xuất</button>
          </div>
        </header>
        <div className="content">
          {children}
        </div>
        <footer className="footer">© {new Date().getFullYear()} Kanban Admin</footer>
      </div>
    </div>
  )
}

function StatCard({ title, value, hint }) {
  return (
    <div className="stat">
      <div className="stat__title">{title}</div>
      <div className="stat__value">{value}</div>
      {hint ? <div className="stat__hint">{hint}</div> : null}
    </div>
  )
}

function Dashboard() {
  return (
    <div className="page">
      <h1 className="page__title">Dashboard</h1>
      <div className="stats">
        <StatCard title="Tasks mở" value="8" hint="+2 tuần này" />
        <StatCard title="Đang làm" value="3" hint="-1 hôm nay" />
        <StatCard title="Hoàn thành" value="21" hint="+5 tuần này" />
        <StatCard title="Quá hạn" value="1" hint="0 thay đổi" />
      </div>
      <div className="card">
        <div className="card__body">
          <div className="card__title">Hoạt động gần đây</div>
          <div className="card__desc">Tích hợp bảng Kanban và định tuyến cơ bản đã hoàn tất.</div>
        </div>
      </div>
    </div>
  )
}

// Boards page removed per requirement

const Placeholder = ({ title }) => (
  <div className="page">
    <h1 className="page__title">{title}</h1>
    <div className="card"><div className="card__body">Nội dung sẽ được bổ sung.</div></div>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/projects" element={<ProjectsList />} />
                    <Route path="/projects/:id" element={<ProjectDetail />} />
                    <Route path="/tasks" element={<Placeholder title="Tasks" />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/settings" element={<Placeholder title="Settings" />} />
                  </Routes>
                </Layout>
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
