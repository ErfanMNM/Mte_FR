import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import KanbanBoard from '../kanban/KanbanBoard.jsx'
import { getProject, projectBoardKey, updateProject, removeProject } from '../projects/store.js'
import { useAuth } from '../auth/AuthProvider.jsx'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [proj, setProj] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', participantInput: '', cover: '' })
  const settingsRef = useRef(null)
  const location = useLocation()
  const [rightPanel, setRightPanel] = useState(null) // 'properties' | 'settings' | null
  const { user } = useAuth()
  const role = user?.role || 'admin' // mock fallback
  const canManage = role === 'admin' || role === 'editor'

  useEffect(() => {
    const p = getProject(id)
    if (!p) { setNotFound(true); return }
    setProj(p)
    setForm({ name: p.name, description: p.description || '', participantInput: '', cover: p.cover || '' })
  }, [id])

  const save = () => {
    const updated = updateProject(proj.id, { name: form.name, description: form.description })
    setProj(updated)
    setEdit(false)
  }

  const addParticipant = () => {
    const v = form.participantInput.trim()
    if (!v) return
    const updated = updateProject(proj.id, { participants: [...(proj.participants||[]), v] })
    setProj(updated)
    setForm(f => ({ ...f, participantInput: '' }))
  }

  const removeParticipant = (index) => {
    const next = [...(proj.participants||[])]
    next.splice(index, 1)
    const updated = updateProject(proj.id, { participants: next })
    setProj(updated)
  }

  const boardKey = useMemo(() => projectBoardKey(id), [id])

  useEffect(() => {
    if (location.hash === '#settings') setRightPanel('settings')
    if (location.hash === '#properties') setRightPanel('properties')
  }, [location])

  const saveCover = () => {
    const updated = updateProject(proj.id, { cover: form.cover.trim() })
    setProj(updated)
  }

  const resetBoard = () => {
    try { localStorage.removeItem(boardKey) } catch {}
    alert('Đã đặt lại bảng Kanban cho dự án này.')
  }

  const deleteProject = () => {
    if (!confirm('Bạn có chắc muốn xoá dự án này? Hành động không thể hoàn tác.')) return
    removeProject(proj.id)
    try { localStorage.removeItem(boardKey) } catch {}
    navigate('/projects')
  }

  if (notFound) return (
    <div className="page">
      <div className="card"><div className="card__body">Không tìm thấy dự án. <button className="btn btn--ghost" onClick={() => navigate('/projects')}>Quay lại</button></div></div>
    </div>
  )

  if (!proj) return <div className="page"><div className="card"><div className="card__body">Đang tải...</div></div></div>

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
        <h1 className="page__title" style={{ marginBottom: 0 }}>{proj.name}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--ghost" onClick={() => setRightPanel('properties')}>Thuộc tính</button>
          {canManage ? (
            <button className="btn btn--ghost" onClick={() => setRightPanel('settings')}>⚙️ Cài đặt</button>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <div className="card">
          <div className="card__body">
            <div className="card__title">Thông tin dự án</div>
            {edit ? (
              <div className="form">
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <textarea className="textarea" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={save}>Lưu</button>
                  <button className="btn btn--ghost" onClick={() => setEdit(false)}>Hủy</button>
                </div>
              </div>
            ) : (
              <>
                <div className="card__desc" style={{ whiteSpace: 'pre-wrap' }}>{proj.description || 'Chưa có mô tả'}</div>
                <button className="btn btn--ghost" onClick={() => setEdit(true)}>Sửa</button>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card__body">
            <div className="card__title">Người tham gia</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input className="input" placeholder="Email/username..." value={form.participantInput} onChange={e => setForm(f => ({ ...f, participantInput: e.target.value }))} onKeyDown={e => { if (e.key==='Enter') addParticipant() }} />
              <button className="btn" onClick={addParticipant}>Thêm</button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(proj.participants||[]).length === 0 ? <div className="card__desc">Chưa có thành viên</div> : null}
              {(proj.participants||[]).map((m, i) => (
                <span key={i} className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {m}
                  <button className="btn btn--ghost" onClick={() => removeParticipant(i)} title="Xoá" style={{ padding: '2px 6px' }}>×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__body">
            <div className="card__title">Bảng Kanban</div>
            <KanbanBoard storageKey={boardKey} />
          </div>
        </div>
      </div>

      {rightPanel && (
        <RightDrawer onClose={() => setRightPanel(null)}>
          {rightPanel === 'properties' ? (
            <PropertiesCard proj={proj} boardKey={boardKey} />
          ) : (
            <SettingsCard
              form={form}
              setForm={setForm}
              saveCover={saveCover}
              resetBoard={resetBoard}
              deleteProject={deleteProject}
              settingsRef={settingsRef}
            />
          )}
        </RightDrawer>
      )}
    </div>
  )
}

function PropertiesCard({ proj, boardKey }) {
  const [stats, setStats] = useState({ columns: 0, tasks: 0, size: 0 })
  useEffect(() => {
    try {
      const raw = localStorage.getItem(boardKey) || '[]'
      const size = new Blob([raw]).size
      const data = JSON.parse(raw)
      const columns = Array.isArray(data) ? data.length : 0
      const tasks = Array.isArray(data) ? data.reduce((sum, c) => sum + (c.tasks?.length || 0), 0) : 0
      setStats({ columns, tasks, size })
    } catch {
      setStats({ columns: 0, tasks: 0, size: 0 })
    }
  }, [boardKey])
  return (
    <div className="card">
      <div className="card__body">
        <div className="card__title">Thuộc tính</div>
        <div className="details">
          <div><span>ID</span><b style={{ overflowWrap: 'anywhere' }}>{proj.id}</b></div>
          <div><span>Thành viên</span><b>{proj.participants?.length || 0}</b></div>
          <div><span>Số cột</span><b>{stats.columns}</b></div>
          <div><span>Tổng task</span><b>{stats.tasks}</b></div>
          <div><span>Cover</span><b>{proj.cover ? 'Đã đặt' : '—'}</b></div>
          <div><span>Board size</span><b>{stats.size} B</b></div>
        </div>
      </div>
    </div>
  )
}

function SettingsCard({ form, setForm, saveCover, resetBoard, deleteProject, settingsRef }) {
  return (
    <div ref={settingsRef} className="card">
      <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card__title">Cài đặt dự án</div>
        <div>
          <div style={{ marginBottom: 6, fontWeight: 600 }}>Ảnh cover</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="input" placeholder="Dán URL ảnh (https://...)" value={form.cover} onChange={e => setForm(f => ({ ...f, cover: e.target.value }))} />
            <button className="btn" onClick={saveCover}>Lưu cover</button>
            <button className="btn btn--ghost" onClick={() => setForm(f => ({ ...f, cover: '' }))}>Xoá cover</button>
          </div>
          {form.cover ? <div style={{ marginTop: 8 }}><img src={form.cover} alt="Cover preview" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }} /></div> : null}
        </div>
        <div className="card__title">Khu vực nguy hiểm</div>
        <div className="card__desc">Các thao tác sau có thể xoá dữ liệu. Hãy cẩn thận.</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn--ghost" onClick={resetBoard}>Đặt lại bảng Kanban</button>
          <button className="btn btn--danger" onClick={deleteProject}>Xoá dự án</button>
        </div>
      </div>
    </div>
  )
}

function RightDrawer({ onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 380, background: '#fff', borderLeft: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', padding: 12, overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn--ghost" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
