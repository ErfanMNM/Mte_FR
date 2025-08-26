import React from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import KanbanBoard from './kanban/KanbanBoard.jsx'

function Layout({ children }) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar__logo">Kanban Admin</div>
        <nav className="sidebar__nav">
          <NavLink to="/" end className={({isActive}) => isActive ? 'nav__item active' : 'nav__item'}>Dashboard</NavLink>
          <NavLink to="/boards" className={({isActive}) => isActive ? 'nav__item active' : 'nav__item'}>Boards</NavLink>
          <NavLink to="/tasks" className={({isActive}) => isActive ? 'nav__item active' : 'nav__item'}>Tasks</NavLink>
          <NavLink to="/users" className={({isActive}) => isActive ? 'nav__item active' : 'nav__item'}>Users</NavLink>
          <NavLink to="/settings" className={({isActive}) => isActive ? 'nav__item active' : 'nav__item'}>Settings</NavLink>
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <input className="input topbar__search" placeholder="Tìm kiếm nhanh..." />
          <div className="topbar__right">
            <span className="badge">v0.1.0</span>
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

function BoardsPage() {
  return (
    <div className="page">
      <h1 className="page__title">Boards</h1>
      <KanbanBoard />
    </div>
  )
}

const Placeholder = ({ title }) => (
  <div className="page">
    <h1 className="page__title">{title}</h1>
    <div className="card"><div className="card__body">Nội dung sẽ được bổ sung.</div></div>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/boards" element={<BoardsPage />} />
          <Route path="/tasks" element={<Placeholder title="Tasks" />} />
          <Route path="/users" element={<Placeholder title="Users" />} />
          <Route path="/settings" element={<Placeholder title="Settings" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
