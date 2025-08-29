import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { projectBoardKey } from '../projects/store.js'
import { usersApi } from '../api/client.js'
import { useAuth } from '../auth/AuthProvider.jsx'

function loadBoard(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    const data = raw ? JSON.parse(raw) : []
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function saveBoard(storageKey, board) {
  try { localStorage.setItem(storageKey, JSON.stringify(board)) } catch {}
}

function findTask(board, taskId) {
  for (const col of board) {
    const idx = (col.tasks || []).findIndex(t => t.id === taskId)
    if (idx !== -1) return { column: col, task: col.tasks[idx], colIndex: board.indexOf(col), taskIndex: idx }
  }
  return { column: null, task: null, colIndex: -1, taskIndex: -1 }
}

function keyActivity(boardKey, taskId) { return `${boardKey}::task::${taskId}::activity` }
function keyFiles(boardKey, taskId) { return `${boardKey}::task::${taskId}::files` }
function keyRelations(boardKey, taskId) { return `${boardKey}::task::${taskId}::relations` }
function keyComments(boardKey, taskId) { return `${boardKey}::task::${taskId}::comments` }

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}
function saveJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)) } catch {} }

export default function TaskDetailPage() {
  const { id: projectId, taskId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const boardKey = useMemo(() => projectBoardKey(projectId), [projectId])
  const [board, setBoard] = useState(() => loadBoard(boardKey))
  const { task, column } = useMemo(() => findTask(board, taskId), [board, taskId])
  const [tab, setTab] = useState('activity') // activity | files | relations
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignee: task?.assignee || '',
    assigneeId: task?.assigneeId || '',
    members: Array.isArray(task?.members) ? task.members : [],
    startAt: task?.startAt || '',
    endAt: task?.endAt || task?.dueDate || '',
    priority: task?.priority || 'medium',
    type: task?.type || 'task',
    tags: Array.isArray(task?.tags) ? task.tags.join(', ') : (task?.tags || '')
  })

  // Side data
  const [activity, setActivity] = useState(() => loadJSON(keyActivity(boardKey, taskId), []))
  const [files, setFiles] = useState(() => loadJSON(keyFiles(boardKey, taskId), []))
  const [relations, setRelations] = useState(() => loadJSON(keyRelations(boardKey, taskId), []))
  const [comments, setComments] = useState(() => loadJSON(keyComments(boardKey, taskId), []))
  const [commentInput, setCommentInput] = useState('')
  const [userCatalog, setUserCatalog] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [activityPage, setActivityPage] = useState(1)
  const activityPageSize = 10
  const [newMemberId, setNewMemberId] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('Liên quan')
  const MEMBER_ROLES = ['Liên quan','Theo dõi','Giám sát','Kiểm tra']

  useEffect(() => { saveJSON(keyActivity(boardKey, taskId), activity) }, [activity, boardKey, taskId])
  useEffect(() => { saveJSON(keyFiles(boardKey, taskId), files) }, [files, boardKey, taskId])
  useEffect(() => { saveJSON(keyRelations(boardKey, taskId), relations) }, [relations, boardKey, taskId])
  useEffect(() => { saveJSON(keyComments(boardKey, taskId), comments) }, [comments, boardKey, taskId])

  const actor = useMemo(() => {
    const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() || user?.username || user?.email || 'Người dùng'
    const initials = name.split(' ').filter(Boolean).slice(0,2).map(p => p[0]?.toUpperCase()).join('') || 'U'
    return { id: user?.id || 'anon', name, initials, avatar_url: profile?.avatar_url || '' }
  }, [user, profile])

  const logActivity = (evt) => {
    const payload = { id: crypto.randomUUID(), at: new Date().toISOString(), actor, ...evt }
    setActivity(a => [payload, ...a])
  }

  useEffect(() => {
    // log view
    logActivity({ type: 'view' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  useEffect(() => {
    // keep form in sync if board changed (e.g., from elsewhere)
    if (!task) return
    setForm({
      title: task.title || '',
      description: task.description || '',
      assignee: task.assignee || '',
      assigneeId: task.assigneeId || '',
      members: Array.isArray(task.members) ? task.members : [],
      startAt: task.startAt || '',
      endAt: task.endAt || task.dueDate || '',
      priority: task.priority || 'medium',
      type: task.type || 'task',
      tags: Array.isArray(task.tags) ? task.tags.join(', ') : (task.tags || '')
    })
  }, [task?.id])

  if (!task) {
    return (
      <div className="page">
        <div className="card"><div className="card__body">Không tìm thấy task. <button className="btn btn--ghost" onClick={() => navigate(`/projects/${projectId}`)}>Quay lại dự án</button></div></div>
      </div>
    )
  }

  const saveTask = () => {
    const list = loadBoard(boardKey)
    const { colIndex, taskIndex } = findTask(list, taskId)
    if (colIndex === -1) return
    const tags = form.tags.split(',').map(s => s.trim()).filter(Boolean)
    const chosenUser = userCatalog.find(u => String(u.id) === String(form.assigneeId || ''))
    const assigneeDisplay = chosenUser ? ([chosenUser.profile?.first_name, chosenUser.profile?.last_name].filter(Boolean).join(' ') || chosenUser.username || chosenUser.email) : (form.assignee.trim())
    list[colIndex].tasks[taskIndex] = {
      ...list[colIndex].tasks[taskIndex],
      title: form.title.trim() || 'Không tên',
      description: form.description,
      assignee: assigneeDisplay || '',
      assigneeId: form.assigneeId || undefined,
      members: Array.isArray(form.members) ? form.members : [],
      startAt: form.startAt,
      endAt: form.endAt,
      priority: form.priority,
      type: form.type,
      tags,
      status: form.status || list[colIndex].tasks[taskIndex].status || 'plan'
    }
    saveBoard(boardKey, list)
    setBoard(list)
    setEditing(false)
    logActivity({ type: 'update' })
  }

  const addRelation = (value) => {
    const v = String(value || '').trim()
    if (!v) return
    setRelations(r => [{ id: crypto.randomUUID(), value: v, at: new Date().toISOString() }, ...r])
  }

  const removeRelation = (id) => {
    setRelations(r => r.filter(x => x.id !== id))
  }

  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || [])
    if (picked.length === 0) return
    const items = picked.map(f => ({ id: crypto.randomUUID(), name: f.name, size: f.size, type: f.type, at: new Date().toISOString() }))
    setFiles(fs => [...items, ...fs])
    logActivity({ type: 'attach', count: picked.length })
    e.target.value = ''
  }

  const addComment = () => {
    const text = commentInput.trim()
    if (!text) return
    const item = { id: crypto.randomUUID(), text, at: new Date().toISOString() }
    setComments(cs => [item, ...cs])
    setCommentInput('')
    logActivity({ type: 'comment' })
  }

  const removeComment = (id) => {
    setComments(cs => cs.filter(c => c.id !== id))
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn--ghost" onClick={() => navigate(`/projects/${projectId}`)}>← Quay lại</button>
          <h1 className="page__title" style={{ marginBottom: 0 }}>{task.title}</h1>
          <span className={`chip chip--sm chip--status-${task.status || 'plan'}`}>{(task.status || 'plan') === 'plan' ? 'Kế hoạch' : (task.status || 'plan') === 'prepare' ? 'Chuẩn bị' : (task.status || 'plan') === 'in_progress' ? 'Đang làm' : 'Hoàn thành'}</span>
          <span className="badge">Cột: {column?.title}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--danger" onClick={() => navigate(`/projects/${projectId}`)}>Đóng</button>
        </div>
      </div>

      <div className="task-layout">
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="card">
            <div className="card__body" style={{ display: 'grid', gap: 12 }}>
            <div className="card__title">Chi tiết</div>
            {editing ? (
              <div className="form" style={{ gap: 10 }}>
                <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Tên task" />
            <textarea className="textarea" rows={6} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả chi tiết" />
            <div>
              <div className="form__label">Tình trạng</div>
              <select className="input input--sm" value={form.status || (task.status || 'plan')} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="plan">Dự kiến</option>
                <option value="prepare">Chuẩn bị</option>
                <option value="in_progress">Đang làm</option>
                <option value="done">Hoàn thành</option>
              </select>
            </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div className="form__label">Loại</div>
                    <select className="input input--sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="task">Nhiệm vụ</option>
                      <option value="info">Thông tin</option>
                      <option value="request">Yêu cầu</option>
                    </select>
                  </div>
                  <div>
                    <div className="form__label">Ưu tiên</div>
                    <select className="input input--sm" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                    </select>
                  </div>
                  <div>
                    <div className="form__label">Người phụ trách</div>
                    {userCatalog.length > 0 ? (
                      <select className="input" value={String(form.assigneeId || '')} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value || '' }))}>
                        <option value="">— Chưa gán —</option>
                        {userCatalog.map(u => (
                          <option key={u.id} value={u.id}>{[u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ') || u.username || u.email}</option>
                        ))}
                      </select>
                    ) : (
                      <input className="input" value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} placeholder="Tên/Email" />
                    )}
                  </div>
                  <div>
                    <div className="form__label">Tags</div>
                    <input className="input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="tag1, tag2" />
                  </div>
                  <div>
                    <div className="form__label">Bắt đầu</div>
                    <input className="input" type="datetime-local" value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))} />
                  </div>
                  <div>
                    <div className="form__label">Kết thúc</div>
                    <input className="input" type="datetime-local" value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn--ghost" onClick={() => setEditing(false)}>Hủy</button>
                  <button className="btn" onClick={saveTask}>Lưu</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                <div className="task__title" style={{ fontSize: 18, fontWeight: 700 }}>{task.title}</div>
                {task.description ? <div className="task__desc">{task.description}</div> : <div className="card__desc">Chưa có mô tả</div>}
                <div className="task__meta" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="chip">Trạng thái: {((task.status || 'plan') === 'plan' ? 'Dự kiến' : (task.status || 'plan') === 'prepare' ? 'Chuẩn bị' : (task.status || 'plan') === 'in_progress' ? 'Đang làm' : 'Hoàn thành')}</span>
                  <span className="chip">Loại: {task.type === 'task' ? 'Nhiệm vụ' : task.type === 'info' ? 'Thông tin' : 'Yêu cầu'}</span>
                  <span className="chip">Ưu tiên: {task.priority}</span>
                  <span className="chip">👤 {(() => { const u = userCatalog.find(x => String(x.id) === String(task.assigneeId || '')); const name = u ? ([u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ') || u.username || u.email) : (task.assignee || 'Chưa gán'); return name || 'Chưa gán' })()}</span>
                  <span className="chip">⏱ {task.startAt ? String(task.startAt).replace('T',' ') : '—'} → {task.endAt ? String(task.endAt).replace('T',' ') : '—'}</span>
                  {Array.isArray(task.tags) && task.tags.length > 0 ? task.tags.map((t,i) => <span key={i} className="chip">#{t}</span>) : <span className="chip">#no-tags</span>}
                </div>
                <div>
                  <button className="btn" onClick={() => setEditing(true)}>Chỉnh sửa</button>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Comments section stacked under details (left column only) */}
          <div className="card">
            <div className="card__body" style={{ display: 'grid', gap: 10 }}>
              <div className="card__title">Bình luận</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder="Viết bình luận..." value={commentInput} onChange={e => setCommentInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment() } }} />
                <button className="btn" onClick={addComment}>Gửi</button>
              </div>
              {comments.length === 0 ? (
                <div className="card__desc">Chưa có bình luận</div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nội dung</th>
                        <th>Thời gian</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {comments.map(c => (
                        <tr key={c.id}>
                          <td data-label="Nội dung" style={{ whiteSpace: 'pre-wrap' }}>{c.text}</td>
                          <td data-label="Thời gian" className="muted">{String(c.at).replace('T',' ').replace('Z','')}</td>
                          <td data-label="Hành động" style={{ textAlign: 'right' }}>
                            <button className="btn btn--ghost" onClick={() => removeComment(c.id)}>Xoá</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card: Thành viên */}
        <div className="card">
          <div className="card__body" style={{ display: 'grid', gap: 10 }}>
            <div className="card__title">Thành viên</div>
            {editing ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <div>
                  <div className="form__label">Người phụ trách</div>
                  <div className="chip">
                    {(() => {
                      const u = userCatalog.find(x => String(x.id) === String(form.assigneeId || ''))
                      const name = u ? ([u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ') || u.username || u.email) : (form.assignee || 'Chưa gán')
                      return name || 'Chưa gán'
                    })()}
                  </div>
                </div>
                <div>
                  <div className="form__label">Thành viên khác</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(form.members || []).map((m, i) => (
                      <span key={i} className="chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {(() => {
                          const u = userCatalog.find(x => String(x.id) === String(m.userId))
                          const name = u ? ([u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ') || u.username || u.email) : String(m.userId)
                          return `${name} — ${m.role}`
                        })()}
                        <button className="btn btn--ghost" onClick={() => setForm(f => ({ ...f, members: (f.members || []).filter((_, idx) => idx !== i) }))} style={{ padding: '0 6px' }}>×</button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <select className="input input--sm" value={newMemberId} onChange={e => setNewMemberId(e.target.value)}>
                      <option value="">+ Chọn thành viên</option>
                      {userCatalog.map(u => (
                        <option key={u.id} value={u.id}>{[u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ') || u.username || u.email}</option>
                      ))}
                    </select>
                    <select className="input input--sm" value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)}>
                      {MEMBER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button className="btn" onClick={() => {
                      if (!newMemberId) return
                      setForm(f => ({ ...f, members: [...(f.members || []), { userId: Number(newMemberId), role: newMemberRole }] }))
                      setNewMemberId('')
                    }}>+ Thêm</button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                <div>
                  <div className="form__label">Người phụ trách</div>
                  <div className="chip">
                    {(() => {
                      const u = userCatalog.find(x => String(x.id) === String(task.assigneeId || ''))
                      const name = u ? ([u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ') || u.username || u.email) : (task.assignee || 'Chưa gán')
                      return name || 'Chưa gán'
                    })()}
                  </div>
                </div>
                <div>
                  <div className="form__label">Thành viên khác</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {Array.isArray(task.members) && task.members.length > 0 ? task.members.map((m,i) => (
                      <span key={i} className="chip">
                        {(() => {
                          const u = userCatalog.find(x => String(x.id) === String(m.userId))
                          const name = u ? ([u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ') || u.username || u.email) : String(m.userId)
                          return `${name} — ${m.role}`
                        })()}
                      </span>
                    )) : <span className="chip">-</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar right remains */}

        <div className="card">
          <div className="card__body" style={{ display: 'grid', gap: 10 }}>
            <div className="card__title">Bảng phụ</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button className={`btn ${tab === 'activity' ? '' : 'btn--ghost'}`} onClick={() => setTab('activity')}>Activity</button>
              <button className={`btn ${tab === 'files' ? '' : 'btn--ghost'}`} onClick={() => setTab('files')}>Files</button>
              <button className={`btn ${tab === 'relations' ? '' : 'btn--ghost'}`} onClick={() => setTab('relations')}>Relations</button>
            </div>

            {tab === 'activity' && (
              <div style={{ display: 'grid', gap: 8 }}>
                {activity.length === 0 ? <div className="card__desc">Chưa có hoạt động</div> : null}
                {activity.slice((activityPage-1)*activityPageSize, (activityPage-1)*activityPageSize + activityPageSize).map(evt => {
                  const t = String(evt.at).replace('T',' ').replace('Z','')
                  const who = evt.actor?.name || 'Người dùng'
                  let desc = ''
                  if (evt.type === 'view') desc = 'đã xem task'
                  else if (evt.type === 'update') desc = 'đã cập nhật task'
                  else if (evt.type === 'attach') desc = `đã đính kèm ${evt.count || 1} tệp`
                  else if (evt.type === 'comment') desc = 'đã bình luận'
                  return (
                    <div key={evt.id} className="card" style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                      {evt.actor?.avatar_url ? (
                        <img src={evt.actor.avatar_url} alt={evt.actor?.initials || 'U'} className="avatar--xs" style={{ width: 22, height: 22, borderRadius: 999, objectFit: 'cover' }} />
                      ) : (
                        <div className="avatar--xs" title={who}>{evt.actor?.initials || 'U'}</div>
                      )}
                      <div style={{ display: 'grid', gap: 2 }}>
                        <div style={{ fontSize: 12 }}><b>{who}</b> {desc}</div>
                        <div className="muted" style={{ fontSize: 11 }}>{t}</div>
                      </div>
                    </div>
                  )
                })}
                {activity.length > activityPageSize && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button className="btn btn--ghost" onClick={() => setActivityPage(p => Math.max(1, p - 1))} disabled={activityPage <= 1}>Trước</button>
                    <span className="badge">Trang {activityPage}/{Math.max(1, Math.ceil(activity.length / activityPageSize))}</span>
                    <button className="btn btn--ghost" onClick={() => setActivityPage(p => Math.min(Math.max(1, Math.ceil(activity.length / activityPageSize)), p + 1))} disabled={activityPage >= Math.ceil(activity.length / activityPageSize)}>Sau</button>
                  </div>
                )}
              </div>
            )}

            {tab === 'files' && (
              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <input type="file" multiple onChange={onPickFiles} />
                </div>
                {files.length === 0 ? <div className="card__desc">Chưa có tệp đính kèm</div> : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead><tr><th>Tên</th><th>Loại</th><th>Kích thước</th><th>Thời gian</th></tr></thead>
                      <tbody>
                        {files.map(f => (
                          <tr key={f.id}>
                            <td data-label="Tên">📎 {f.name}</td>
                            <td data-label="Loại">{f.type || '—'}</td>
                            <td data-label="Kích thước">{f.size} B</td>
                            <td data-label="Thời gian">{String(f.at).replace('T',' ').replace('Z','')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'relations' && (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="input" placeholder="Task ID hoặc URL..." onKeyDown={e => { if (e.key === 'Enter') addRelation(e.target.value) }} />
                  <button className="btn" onClick={(e) => {
                    const input = e.currentTarget.previousSibling
                    if (input && input.value) { addRelation(input.value); input.value=''}
                  }}>Thêm</button>
                </div>
                {relations.length === 0 ? <div className="card__desc">Chưa có liên kết</div> : (
                  <div style={{ display: 'grid', gap: 6 }}>
                    {relations.map(r => (
                      <div key={r.id} className="card" style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className="badge">🔗</span>
                          {String(r.value).startsWith('http') ? <a href={r.value} target="_blank" rel="noreferrer">{r.value}</a> : <span>{r.value}</span>}
                        </div>
                        <button className="btn btn--ghost" onClick={() => removeRelation(r.id)}>Xoá</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comments moved into left column above, removed full-width block */}
    </div>
  )
}
