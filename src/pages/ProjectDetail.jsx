import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import KanbanBoard from '../kanban/KanbanBoard.jsx'
import ProjectFlow from '../flow/ProjectFlow.jsx'
import { getProject, projectBoardKey, updateProject, removeProject } from '../projects/store.js'
import { useAuth } from '../auth/AuthProvider.jsx'
import { usersApi } from '../api/client.js'

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
  const [tab, setTab] = useState('dashboard') // dashboard | kanban | flow
  const { user } = useAuth()
  const role = user?.role || 'admin' // mock fallback
  const canManage = role === 'admin' || role === 'editor'
  const [userCatalog, setUserCatalog] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const STAGES = useMemo(() => ([
    { id: 'info', name: 'Thông tin' },
    { id: 'survey', name: 'Khảo sát' },
    { id: 'design', name: 'Thiết kế' },
    { id: 'demo', name: 'Demo' },
    { id: 'build', name: 'Thi công' },
    { id: 'acceptance', name: 'Nghiệm thu' },
    { id: 'support', name: 'Hỗ trợ' }
  ]), [])

  useEffect(() => {
    const p = getProject(id)
    if (!p) { setNotFound(true); return }
    setProj(p)
    setForm({ name: p.name, description: p.description || '', participantInput: '', cover: p.cover || '' })
  }, [id])

  useEffect(() => {
    let mounted = true
    async function loadUsers() {
      setLoadingUsers(true)
      try {
        const res = await usersApi.list({ page: 1, limit: 200 })
        const list = res?.users || res?.data?.users || res?.data || []
        if (mounted) setUserCatalog(Array.isArray(list) ? list : [])
      } catch { if (mounted) setUserCatalog([]) }
      finally { if (mounted) setLoadingUsers(false) }
    }
    loadUsers()
    return () => { mounted = false }
  }, [])

  const save = () => {
    const updated = updateProject(proj.id, { name: form.name, description: form.description })
    setProj(updated)
    setEdit(false)
  }

  const addParticipant = () => {
    const idVal = Number(form.participantInput)
    if (!idVal) return
    const nextIds = new Set([...(proj.participants || [])])
    nextIds.add(idVal)
    const updated = updateProject(proj.id, { participants: Array.from(nextIds) })
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
    if (location.hash === '#kanban') setTab('kanban')
    else if (location.hash === '#flow') setTab('flow')
    else if (location.hash === '#dashboard') setTab('dashboard')
  }, [location])

  const switchTab = (t) => {
    setTab(t)
    const hash = t === 'dashboard' ? '#dashboard' : (t === 'kanban' ? '#kanban' : '#flow')
    if (window?.history?.replaceState) {
      const url = new URL(window.location.href)
      url.hash = hash
      window.history.replaceState(null, '', url.toString())
    }
  }

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

      {/* Tabs */}
      <div className="card" style={{ marginTop: 12 }}>
        <div className="card__body" style={{ paddingBottom: 0 }}>
          <div className="tabs" role="tablist" aria-label="Project tabs">
            <button role="tab" aria-selected={tab==='dashboard'} className={`tab ${tab==='dashboard' ? 'tab--active' : ''}`} onClick={() => switchTab('dashboard')}>🏠 Dashboard</button>
            <button role="tab" aria-selected={tab==='kanban'} className={`tab ${tab==='kanban' ? 'tab--active' : ''}`} onClick={() => switchTab('kanban')}>✅ Kanban</button>
            <button role="tab" aria-selected={tab==='flow'} className={`tab ${tab==='flow' ? 'tab--active' : ''}`} onClick={() => switchTab('flow')}>🔁 Flow dự án</button>
            <div className="tabs__spacer" />
          </div>
        </div>
      </div>

      {tab === 'dashboard' && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="card">
            <div className="card__body">
              <div className="card__title">Mô tả dự án</div>
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
              <div className="card__title">Thành viên</div>
              <div style={{ display: 'grid', gap: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select className="input" value={form.participantInput} onChange={e => setForm(f => ({ ...f, participantInput: e.target.value }))}>
                    <option value="">-- Chọn người dùng --</option>
                    {userCatalog.map(u => (
                      <option key={u.id} value={u.id}>{[u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ') || u.username || u.email}</option>
                    ))}
                  </select>
                  <button className="btn" onClick={addParticipant} disabled={!form.participantInput}>Thêm</button>
                </div>
                {loadingUsers ? <div className="card__desc">Đang tải danh sách người dùng…</div> : null}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(proj.participants||[]).length === 0 ? <div className="card__desc">Chưa có thành viên</div> : null}
                {(proj.participants||[]).map((pid, i) => {
                  const u = userCatalog.find(x => String(x.id) === String(pid))
                  const label = u ? ([u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ') || u.username || u.email) : String(pid)
                  return (
                    <span key={i} className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      👤 {label}
                      <button className="btn btn--ghost" onClick={() => removeParticipant(i)} title="Xoá" style={{ padding: '2px 6px' }}>×</button>
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          <ChatCard projectId={id} />
        </div>
      )}

      {tab === 'kanban' && (
        <div className="card">
          <div className="card__body">
            <div className="card__title">Bảng Kanban</div>
            <KanbanBoard
              storageKey={boardKey}
              onOpenTask={(taskId) => navigate(`/projects/${id}/tasks/${taskId}`)}
              users={userCatalog}
            />
          </div>
        </div>
      )}

      {tab === 'flow' && (
        <ProjectFlow project={proj} setProject={setProj} users={userCatalog} />
      )}

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
      <div style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 'min(100%, 380px)', background: '#fff', borderLeft: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', padding: 12, overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn--ghost" onClick={onClose} aria-label="Đóng">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ProjectProcessCard({ proj, setProj, stages, userCatalog = [] }) {
  const currentIndex = Math.min(Math.max(0, proj.stageIndex ?? 0), stages.length - 1)
  const currentStage = stages[currentIndex]
  const meta = proj.stageMeta || {}
  const curId = currentStage.id
  const curMeta = meta[curId] || { startAt: '', endAt: '', note: '', sale_contact: '', tech_reviewer_id: '', demo_at: '', demo_note: '', feedback: '' }
  const [selIndex, setSelIndex] = React.useState(currentIndex)
  const [form, setForm] = React.useState({
    startAt: curMeta.startAt || '',
    endAt: curMeta.endAt || '',
    note: curMeta.note || '',
    sale_contact: curMeta.sale_contact || '',
    tech_reviewer_id: curMeta.tech_reviewer_id || '',
    demo_at: curMeta.demo_at || '',
    demo_note: curMeta.demo_note || '',
    feedback: curMeta.feedback || ''
  })

  useEffect(() => {
    setSelIndex(currentIndex)
    const m = (proj.stageMeta || {})[stages[currentIndex].id] || {}
    setForm({
      startAt: m.startAt || '',
      endAt: m.endAt || '',
      note: m.note || '',
      sale_contact: m.sale_contact || '',
      tech_reviewer_id: m.tech_reviewer_id || '',
      demo_at: m.demo_at || '',
      demo_note: m.demo_note || '',
      feedback: m.feedback || ''
    })
  }, [proj.stageIndex])

  const go = (idx) => {
    const i = Math.min(Math.max(0, idx), stages.length - 1)
    const updated = updateProject(proj.id, { stageIndex: i })
    setProj(updated)
  }
  const prev = () => go(currentIndex - 1)
  const next = () => go(currentIndex + 1)
  const saveMeta = () => {
    const nextMeta = { ...(proj.stageMeta || {}) }
    nextMeta[curId] = {
      startAt: form.startAt,
      endAt: form.endAt,
      note: form.note,
      sale_contact: form.sale_contact,
      tech_reviewer_id: form.tech_reviewer_id,
      demo_at: form.demo_at,
      demo_note: form.demo_note,
      feedback: form.feedback
    }
    const updated = updateProject(proj.id, { stageMeta: nextMeta })
    setProj(updated)
  }

  return (
    <div className="card">
      <div className="card__body" style={{ display: 'grid', gap: 10 }}>
        <div className="card__title">Quy trình dự án</div>
        {/* Stepper */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {stages.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => go(i)} title={s.name}>
              <div style={{ width: 26, height: 26, borderRadius: 999, display: 'grid', placeItems: 'center', fontWeight: 700, color: i <= currentIndex ? '#fff' : '#334155', background: i < currentIndex ? '#22c55e' : i === currentIndex ? '#2563eb' : '#e5e7eb', border: '1px solid var(--border)' }}>{i+1}</div>
              <div style={{ fontWeight: i === currentIndex ? 700 : 500 }}>{s.name}</div>
              {i < stages.length-1 ? <div style={{ width: 28, height: 2, background: '#e5e7eb', margin: '0 6px' }} /> : null}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge">Hiện tại: {currentStage.name}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn--ghost" onClick={prev} disabled={currentIndex <= 0}>← Trước</button>
            <select className="input" value={selIndex} onChange={e => setSelIndex(Number(e.target.value))}>
              {stages.map((s, i) => <option key={s.id} value={i}>{i+1}. {s.name}</option>)}
            </select>
            <button className="btn" onClick={() => go(selIndex)}>Chuyển</button>
            <button className="btn" onClick={next} disabled={currentIndex >= stages.length - 1}>Tiếp →</button>
          </div>
        </div>
        {/* Meta form for current stage */}
        <div className="form" style={{ gap: 8 }}>
          <div className="card__title" style={{ marginTop: 4 }}>Thông tin giai đoạn: {currentStage.name}</div>
          {currentStage.id === 'info' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div className="form__label">Liên hệ Sale</div>
                  <input className="input" placeholder="Tên/Email/Phone" value={form.sale_contact} onChange={e => setForm(f => ({ ...f, sale_contact: e.target.value }))} />
                </div>
                <div>
                  <div className="form__label">Kỹ thuật kiểm tra</div>
                  <select className="input" value={String(form.tech_reviewer_id || '')} onChange={e => setForm(f => ({ ...f, tech_reviewer_id: e.target.value || '' }))}>
                    <option value="">— Chưa chọn —</option>
                    {userCatalog.map(u => (
                      <option key={u.id} value={u.id}>{[u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ') || u.username || u.email}</option>
                    ))}
                  </select>
                </div>
              </div>
              <textarea className="textarea" rows={3} placeholder="Ghi chú/Thông báo gửi lại Sale" value={form.feedback} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))} />
            </>
          ) : currentStage.id === 'demo' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div className="form__label">Thời gian demo</div>
                  <input className="input" type="datetime-local" value={form.demo_at} onChange={e => setForm(f => ({ ...f, demo_at: e.target.value }))} />
                </div>
                <div>
                  <div className="form__label">Ghi chú demo</div>
                  <input className="input" placeholder="Kết quả/đầu mối/ghi chú" value={form.demo_note} onChange={e => setForm(f => ({ ...f, demo_note: e.target.value }))} />
                </div>
              </div>
              <textarea className="textarea" rows={3} placeholder="Ghi chú chung cho giai đoạn demo (tuỳ chọn)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div className="form__label">Bắt đầu</div>
                  <input className="input" type="datetime-local" value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))} />
                </div>
                <div>
                  <div className="form__label">Kết thúc</div>
                  <input className="input" type="datetime-local" value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} />
                </div>
              </div>
              <textarea className="textarea" rows={3} placeholder="Ghi chú cho giai đoạn này (tuỳ chọn)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn" onClick={saveMeta}>Lưu thông tin giai đoạn</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatCard({ projectId }) {
  const { user, profile } = useAuth()
  const key = useMemo(() => `project-chat-${projectId}`, [projectId])
  const [messages, setMessages] = useState(() => {
    try { const raw = localStorage.getItem(key); const data = raw ? JSON.parse(raw) : []; return Array.isArray(data) ? data : [] } catch { return [] }
  })
  const [text, setText] = useState('')

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(messages)) } catch {}
  }, [messages, key])

  const send = () => {
    const body = text.trim()
    if (!body) return
    const actorName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() || user?.username || user?.email || 'User'
    const msg = { id: crypto.randomUUID(), at: new Date().toISOString(), by: actorName, text: body }
    setMessages(m => [msg, ...m])
    setText('')
  }

  return (
    <div className="card">
      <div className="card__body" style={{ display: 'grid', gap: 10 }}>
        <div className="card__title">💬 Chat</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="Nhập nội dung và Enter để gửi..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} />
          <button className="btn" onClick={send}>Gửi</button>
        </div>
        {messages.length === 0 ? <div className="card__desc">Chưa có tin nhắn</div> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Người gửi</th><th>Nội dung</th><th>Thời gian</th></tr></thead>
              <tbody>
                {messages.map(m => (
                  <tr key={m.id}>
                    <td data-label="Người gửi">{m.by}</td>
                    <td data-label="Nội dung">{m.text}</td>
                    <td data-label="Thời gian">{String(m.at).replace('T',' ').replace('Z','')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
