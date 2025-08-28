import React, { useEffect, useMemo, useState } from 'react'

const DEFAULT_STORAGE_KEY = 'kanban-board-v1'

const defaultBoard = () => ([
  { id: 'todo', title: 'Todo', color: '#f1f5f9', tasks: [
    { id: crypto.randomUUID(), title: 'Chào mừng 👋', description: 'Kéo thả thẻ giữa các cột', status: 'plan', type: 'task' },
  ]},
  { id: 'doing', title: 'In Progress', color: '#fff7ed', tasks: [] },
  { id: 'done', title: 'Done', color: '#ecfdf5', tasks: [] },
])

function useLocalBoard(storageKey) {
  const [board, setBoard] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : defaultBoard()
    } catch {
      return defaultBoard()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(board))
    } catch {}
  }, [board, storageKey])

  return [board, setBoard]
}

export default function KanbanBoard({ storageKey = DEFAULT_STORAGE_KEY, onOpenTask, users = [] }) {
  const [board, setBoard] = useLocalBoard(storageKey)
  const [filter, setFilter] = useState('')
  const [showNewCol, setShowNewCol] = useState(false)
  const [colTitle, setColTitle] = useState('')
  const [colColor, setColColor] = useState('#eef2ff')

  const filteredBoard = useMemo(() => {
    if (!filter.trim()) return board
    const q = filter.toLowerCase()
    return board.map(col => ({
      ...col,
      tasks: col.tasks.filter(t => t.title.toLowerCase().includes(q) || (t.description||'').toLowerCase().includes(q))
    }))
  }, [board, filter])

  const addTask = (columnId, payload) => {
    const isString = typeof payload === 'string'
    const title = isString ? payload : (payload?.title || '')
    const type = isString ? 'task' : (payload?.type || 'task')
    const status = isString ? 'plan' : (payload?.status || 'plan')
    if (!title.trim()) return
    const newTask = { id: crypto.randomUUID(), title: title.trim(), description: '', status, type }
    setBoard(prev => prev.map(c => c.id === columnId ? { ...c, tasks: [...c.tasks, newTask] } : c))
  }

  const updateTask = (taskId, updater) => {
    setBoard(prev => prev.map(c => ({
      ...c,
      tasks: c.tasks.map(t => t.id === taskId ? { ...t, ...updater } : t)
    })))
  }

  const deleteTask = (taskId) => {
    setBoard(prev => prev.map(c => ({
      ...c,
      tasks: c.tasks.filter(t => t.id !== taskId)
    })))
  }

  const moveTaskToColumnEnd = (taskId, fromColumnId, toColumnId) => {
    if (fromColumnId === toColumnId) return
    let movingTask = null
    const removed = board.map(col => {
      if (col.id !== fromColumnId) return col
      const idx = col.tasks.findIndex(t => t.id === taskId)
      if (idx === -1) return col
      movingTask = col.tasks[idx]
      const newTasks = [...col.tasks]
      newTasks.splice(idx, 1)
      return { ...col, tasks: newTasks }
    })
    if (!movingTask) return
    const next = removed.map(col => col.id === toColumnId ? { ...col, tasks: [...col.tasks, movingTask] } : col)
    setBoard(next)
  }

  const addColumn = () => {
    const title = colTitle.trim()
    if (!title) return
    const id = crypto.randomUUID()
    setBoard(prev => [...prev, { id, title, color: colColor || '#eef2ff', tasks: [] }])
    setColTitle('')
    setColColor('#eef2ff')
    setShowNewCol(false)
  }

  const updateColumn = (columnId, patch) => {
    setBoard(prev => prev.map(c => c.id === columnId ? { ...c, ...patch } : c))
  }

  const deleteColumn = (columnId) => {
    if (!confirm('Xoá cột này và toàn bộ thẻ bên trong?')) return
    setBoard(prev => prev.filter(c => c.id !== columnId))
  }

  const moveColumn = (fromId, toId) => {
    if (fromId === toId) return
    setBoard(prev => {
      const list = [...prev]
      const fromIndex = list.findIndex(c => c.id === fromId)
      const toIndex = list.findIndex(c => c.id === toId)
      if (fromIndex === -1 || toIndex === -1) return prev
      const [moved] = list.splice(fromIndex, 1)
      const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex
      list.splice(insertIndex, 0, moved)
      return list
    })
  }

  return (<>
    <div className="app">
      <header className="app__header">
        <h2>Kanban Board</h2>
        <div className="header__actions">
          <input
            className="input"
            placeholder="Tìm kiếm..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <button className="btn" onClick={() => setBoard(defaultBoard())}>Reset</button>
          <button className="btn" onClick={() => setShowNewCol(s => !s)}>{showNewCol ? 'Đóng' : 'Thêm cột'}</button>
        </div>
      </header>

      <main className="board">
        {filteredBoard.map(col => (
          <Column
            key={col.id}
            column={col}
            onAdd={title => addTask(col.id, title)}
            onDropTask={(taskId, fromColumnId) => moveTaskToColumnEnd(taskId, fromColumnId, col.id)}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onOpenTask={onOpenTask}
            users={users}
            onUpdateColumn={patch => updateColumn(col.id, patch)}
            onDeleteColumn={() => deleteColumn(col.id)}
            onMoveColumn={fromId => moveColumn(fromId, col.id)}
          />
        ))}

        {showNewCol && (
          <section className="column" style={{ backgroundColor: '#f8fafc', minWidth: 280 }}>
            <header className="column__header">
              <h3>Thêm cột mới</h3>
            </header>
            <div className="column__add" style={{ padding: 12, display: 'grid', gap: 8 }}>
              <input className="input" placeholder="Tiêu đề cột" value={colTitle} onChange={e => setColTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addColumn() }} />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input className="input" type="color" title="Màu nền" value={colColor} onChange={e => setColColor(e.target.value)} style={{ width: 48, padding: 2 }} />
                <input className="input" placeholder="#eef2ff" value={colColor} onChange={e => setColColor(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={addColumn}>Thêm cột</button>
                <button className="btn btn--ghost" onClick={() => setShowNewCol(false)}>Hủy</button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  </>)
}

function Column({ column, onAdd, onDropTask, onUpdateTask, onDeleteTask, onUpdateColumn, onDeleteColumn, onMoveColumn, onOpenTask, users }) {
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('task')
  const [newStatus, setNewStatus] = useState('plan')
  const [dragOver, setDragOver] = useState(false)
  const [editingMeta, setEditingMeta] = useState(false)
  const [colTitle, setColTitle] = useState(column.title)
  const [colColor, setColColor] = useState(column.color || '#eef2ff')
  const [showMenu, setShowMenu] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const onDrop = (e) => {
    e.preventDefault()
    const colData = e.dataTransfer.getData('application/x-kanban-column')
    if (colData) {
      onMoveColumn && onMoveColumn(colData)
      setDragOver(false)
      return
    }
    const data = e.dataTransfer.getData('application/json')
    if (data) {
      try {
        const { taskId, fromColumnId } = JSON.parse(data)
        onDropTask(taskId, fromColumnId)
      } catch {}
    }
    setDragOver(false)
  }

  const onDragOver = (e) => { e.preventDefault() }
  const onDragEnter = () => setDragOver(true)
  const onDragLeave = () => setDragOver(false)

  const handleAdd = () => {
    onAdd({ title: newTitle, type: newType, status: newStatus })
    setNewTitle('')
    setNewType('task')
    setNewStatus('plan')
    setShowAdd(false)
  }

  const saveMeta = () => {
    onUpdateColumn && onUpdateColumn({ title: colTitle.trim() || 'Untitled', color: colColor })
    setEditingMeta(false)
  }

  return (
    <section className={`column ${dragOver ? 'drag-over' : ''}`} style={{ backgroundColor: column.color }} onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragEnter} onDragLeave={onDragLeave}>
      <header className="column__header">
        {editingMeta ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
            <input className="input" value={colTitle} onChange={e => setColTitle(e.target.value)} />
            <input className="input" type="color" title="Màu nền" value={colColor} onChange={e => setColColor(e.target.value)} style={{ width: 40, padding: 2 }} />
            <button className="btn" onClick={saveMeta}>Lưu</button>
            <button className="btn btn--ghost" onClick={() => { setEditingMeta(false); setColTitle(column.title); setColColor(column.color) }}>Hủy</button>
          </div>
        ) : (
          <>
            <h3 draggable onDragStart={e => { e.dataTransfer.setData('application/x-kanban-column', column.id); e.dataTransfer.effectAllowed = 'move' }}>{column.title}</h3>
            <span className="badge">{column.tasks.length}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', position: 'relative' }} onMouseLeave={() => setShowMenu(false)}>
              <button className="btn" onClick={() => setShowAdd(v => !v)}>{showAdd ? 'Đóng' : '+ Thêm'}</button>
              <button
                className="btn btn--ghost"
                aria-haspopup="menu"
                aria-expanded={showMenu}
                title="Tùy chọn"
                onClick={() => setShowMenu(v => !v)}
              >
                ⋯
              </button>
              {showMenu && (
                <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', borderRadius: 6, padding: 6, zIndex: 10, minWidth: 140 }} role="menu">
                  <div style={{ display: 'grid', gap: 6 }}>
                    <button className="btn btn--ghost" role="menuitem" onClick={() => { setEditingMeta(true); setShowMenu(false) }}>Sửa cột</button>
                    <button className="btn btn--danger" role="menuitem" onClick={() => { setShowMenu(false); onDeleteColumn() }}>Xóa cột</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </header>

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80 }}>
          <div onClick={() => setShowAdd(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 520, maxWidth: '95vw', background: '#fff', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-md)' }}>
            <div className="card__body" style={{ display: 'grid', gap: 10 }}>
              <div className="card__title">Thêm thẻ mới</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div className="form__label">Loại</div>
                  <select className="input input--sm" value={newType} onChange={e => setNewType(e.target.value)}>
                    <option value="task">Nhiệm vụ</option>
                    <option value="info">Thông tin</option>
                    <option value="request">Yêu cầu</option>
                  </select>
                </div>
                <div>
                  <div className="form__label">Tình trạng</div>
                  <select className="input input--sm" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                    <option value="plan">Dự kiến</option>
                    <option value="prepare">Chuẩn bị</option>
                    <option value="in_progress">Đang làm</option>
                    <option value="done">Hoàn thành</option>
                  </select>
                </div>
              </div>
              <input className="input" placeholder="Tiêu đề..." value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAdd() }} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn--ghost" onClick={() => setShowAdd(false)}>Hủy</button>
                <button className="btn" onClick={handleAdd} disabled={!newTitle.trim()}>Thêm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="column__list">
        {column.tasks.map((task, idx) => (
          <TaskItem key={task.id} task={task} index={idx} columnId={column.id} onUpdate={onUpdateTask} onDelete={onDeleteTask} onOpen={() => onOpenTask && onOpenTask(task.id)} users={users} />
        ))}
      </div>
    </section>
  )
}

// Compact task item UI
function TaskItem({ task, columnId, onUpdate, onDelete, index, onOpen, users = [] }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [desc, setDesc] = useState(task.description || '')
  const [assignee, setAssignee] = useState(task.assignee || '')
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || '')
  const [startAt, setStartAt] = useState(task.startAt || '')
  const [endAt, setEndAt] = useState(task.endAt || task.dueDate || '')
  const [priority, setPriority] = useState(task.priority || 'medium')
  const [tags, setTags] = useState(Array.isArray(task.tags) ? task.tags.join(', ') : (task.tags || ''))
  const [status, setStatus] = useState(task.status || 'plan')
  const [type, setType] = useState(task.type || 'task')
  const [dragging, setDragging] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    setTitle(task.title)
    setDesc(task.description || '')
    setAssignee(task.assignee || '')
    setAssigneeId(task.assigneeId || '')
    setStartAt(task.startAt || '')
    setEndAt(task.endAt || task.dueDate || '')
    setPriority(task.priority || 'medium')
    setTags(Array.isArray(task.tags) ? task.tags.join(', ') : (task.tags || ''))
    setStatus(task.status || 'plan')
    setType(task.type || 'task')
  }, [task.id])

  const onDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id, fromColumnId: columnId }))
    e.dataTransfer.effectAllowed = 'move'
    setDragging(true)
  }
  const onDragEnd = () => setDragging(false)

  const userLabel = (id) => {
    const u = users.find(x => String(x.id) === String(id))
    if (!u) return ''
    const full = [u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ').trim()
    return full || u.username || u.email || String(id)
  }

  const save = () => {
    const tagList = tags.split(',').map(s => s.trim()).filter(Boolean)
    const displayAssignee = assigneeId ? userLabel(assigneeId) : (assignee.trim() || '')
    onUpdate(task.id, {
      title: title.trim() || 'Không tên',
      description: desc,
      assignee: displayAssignee,
      assigneeId: assigneeId || undefined,
      startAt,
      endAt,
      priority,
      tags: tagList,
      status,
      type,
      done: status === 'done'
    })
    setEditing(false)
  }

  const titleStyle = (task.status || 'plan') === 'done' ? { textDecoration: 'line-through', opacity: 0.8 } : {}

  return (<>
    <article className={`card task ${dragging ? 'dragging' : ''}`} draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onDoubleClick={() => { if (editing) return; if (onOpen) { onOpen(); return } setShowDetails(true) }}>
      {editing ? (
        <div className="card__body">
          <div className="task__row" style={{ gap: 6, alignItems: 'center' }}>
            <span className={`chip chip--sm chip--status-${status}`} title="Trạng thái">
              {status === 'plan' ? 'Dự kiến' : status === 'prepare' ? 'Chuẩn bị' : status === 'in_progress' ? 'Đang làm' : 'Hoàn thành'}
            </span>
            <span className="chip" title="STT">#{(index ?? 0) + 1}</span>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Tên task" />
          </div>
          <div className="task__row">
            <select className="input input--sm" value={type} onChange={e => setType(e.target.value)}>
              <option value="task">Loại: Nhiệm vụ</option>
              <option value="info">Loại: Thông tin</option>
              <option value="request">Loại: Yêu cầu</option>
            </select>
          </div>
          <div className="task__row">
            <select className="input input--sm" value={status} onChange={e => setStatus(e.target.value)} title="Tình trạng">
              <option value="plan">Tình trạng: Dự kiến</option>
              <option value="prepare">Tình trạng: Chuẩn bị</option>
              <option value="in_progress">Tình trạng: Đang làm</option>
              <option value="done">Tình trạng: Hoàn thành</option>
            </select>
          </div>
          <textarea className="textarea" rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Nội dung" />
          <div className="task__row">
            {Array.isArray(users) && users.length > 0 ? (
              <select className="input" title="Người phụ trách" value={String(assigneeId || '')} onChange={e => setAssigneeId(e.target.value || '')}>
                <option value="">— Chưa gán —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{[u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ') || u.username || u.email}</option>
                ))}
              </select>
            ) : (
              <input className="input" placeholder="Người phụ trách" value={assignee} onChange={e => setAssignee(e.target.value)} />
            )}
            <input className="input" type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} title="Bắt đầu" />
            <input className="input" type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} title="Kết thúc" />
          </div>
          <div className="task__row">
            <select className="input input--sm" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
            <input className="input" placeholder="tag1, tag2" value={tags} onChange={e => setTags(e.target.value)} />
          </div>
          <div className="card__actions">
            <button className="btn" onClick={save}>Lưu</button>
            <button className="btn btn--ghost" onClick={() => setEditing(false)}>Hủy</button>
          </div>
        </div>
      ) : (
        <div className="card__body">
          <div className="task__row" style={{ gap: 8, alignItems: 'center' }}>
            <span className="chip chip--sm" title="STT">#{(index ?? 0) + 1}</span>
            <span className={`chip chip--sm chip--status-${task.status || 'plan'}`} title="Trạng thái">
              {(task.status || 'plan') === 'plan' ? 'Dự kiến' : (task.status || 'plan') === 'prepare' ? 'Chuẩn bị' : (task.status || 'plan') === 'in_progress' ? 'Đang làm' : 'Hoàn thành'}
            </span>
          </div>
          <div className="task__title" style={titleStyle} title={task.title}>{task.title}</div>
          {task.description ? <div className="task__desc">{task.description}</div> : null}
          <div className="task__meta">
            {task.type ? <span className="chip" title="Loại">🏷 {task.type === 'task' ? 'Nhiệm vụ' : task.type === 'info' ? 'Thông tin' : 'Yêu cầu'}</span> : null}
            {task.startAt || task.endAt ? (
              <span className="chip" title="Thời gian">⏱ {task.startAt ? String(task.startAt).replace('T',' ') : '—'} → {task.endAt ? String(task.endAt).replace('T',' ') : '—'}</span>
            ) : null}
            {task.assigneeId ? (
              <span className="chip" title={userLabel(task.assigneeId)}>👤 {userLabel(task.assigneeId)}</span>
            ) : (task.assignee ? <span className="chip" title={task.assignee}>👤 {task.assignee}</span> : null)}
            {task.priority ? (
              <span className="chip" title={`Ưu tiên: ${task.priority}`}>
                <span className={`dot ${task.priority === 'high' ? 'dot--high' : task.priority === 'low' ? 'dot--low' : 'dot--med'}`}></span>
                {task.priority}
              </span>
            ) : null}
            {Array.isArray(task.tags) && task.tags.length > 0 ? task.tags.slice(0,3).map((t,i) => <span key={i} className="chip">#{t}</span>) : null}
          </div>
        </div>
      )}
    </article>
    {showDetails && (
      <TaskDetailsModal
        task={task}
        index={index}
        onClose={() => setShowDetails(false)}
        onSave={(patch) => { onUpdate(task.id, patch); setShowDetails(false) }}
        onDelete={() => { onDelete(task.id); setShowDetails(false) }}
      />
    )}
  </>)
}

function TaskDetailsModal({ task, index, onClose, onSave, onDelete }) {
  const [mode, setMode] = useState('view')
  const [title, setTitle] = useState(task.title)
  const [desc, setDesc] = useState(task.description || '')
  const [assignee, setAssignee] = useState(task.assignee || '')
  const [startAt, setStartAt] = useState(task.startAt || '')
  const [endAt, setEndAt] = useState(task.endAt || task.dueDate || '')
  const [priority, setPriority] = useState(task.priority || 'medium')
  const [tags, setTags] = useState(Array.isArray(task.tags) ? task.tags.join(', ') : (task.tags || ''))
  const [type, setType] = useState(task.type || 'task')
  const status = task.status || 'plan'

  const save = () => {
    const tagList = tags.split(',').map(s => s.trim()).filter(Boolean)
    onSave({
      title: title.trim() || 'Không tên',
      description: desc,
      assignee: assignee.trim() || '',
      startAt,
      endAt,
      priority,
      tags: tagList,
      type
    })
    setMode('view')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 720,
        maxWidth: '90vw',
        maxHeight: '90vh',
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 8,
        boxShadow: 'var(--shadow-lg)',
        padding: 16,
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div className="chip chip--sm" title="STT">#{(index ?? 0) + 1}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span className={`chip chip--sm chip--status-${status}`} title="Trạng thái">
              {status === 'plan' ? 'Dự kiến' : status === 'prepare' ? 'Chuẩn bị' : status === 'in_progress' ? 'Đang làm' : 'Hoàn thành'}
            </span>
            {mode === 'view' ? (
              <button className="btn btn--ghost" onClick={() => setMode('edit')}>Chỉnh sửa</button>
            ) : null}
            <button className="btn btn--ghost" onClick={onClose}>Đóng</button>
          </div>
        </div>

        {mode === 'view' ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <h3 style={{ margin: 0 }}>{task.title}</h3>
            {task.description ? (
              <div>
                <div className="form__label">Mô tả</div>
                <div className="task__desc">{task.description}</div>
              </div>
            ) : null}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div className="form__label">Loại</div>
                <div className="chip">{task.type === 'task' ? 'Nhiệm vụ' : task.type === 'info' ? 'Thông tin' : 'Yêu cầu'}</div>
              </div>
              <div>
                <div className="form__label">Mức độ ưu tiên</div>
                <div className="chip">
                  <span className={`dot ${task.priority === 'high' ? 'dot--high' : task.priority === 'low' ? 'dot--low' : 'dot--med'}`}></span>
                  {task.priority || 'medium'}
                </div>
              </div>
              <div>
                <div className="form__label">Người phụ trách</div>
                <div className="chip">{task.assignee || '—'}</div>
              </div>
              <div>
                <div className="form__label">Tags</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Array.isArray(task.tags) && task.tags.length > 0 ? task.tags.map((t,i) => <span key={i} className="chip">#{t}</span>) : <span className="chip">—</span>}
                </div>
              </div>
              <div>
                <div className="form__label">Bắt đầu</div>
                <div className="chip">{task.startAt ? String(task.startAt).replace('T',' ') : '—'}</div>
              </div>
              <div>
                <div className="form__label">Kết thúc</div>
                <div className="chip">{task.endAt ? String(task.endAt).replace('T',' ') : (task.dueDate ? String(task.dueDate).replace('T',' ') : '—')}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn--danger" onClick={onDelete}>Xóa</button>
              <button className="btn" onClick={() => setMode('edit')}>Chỉnh sửa</button>
            </div>
          </div>
        ) : (
          <div className="form" style={{ gap: 10 }}>
            <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Tên task" />
            <textarea className="textarea" rows={6} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Nội dung chi tiết" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div className="form__label">Loại</div>
                <select className="input input--sm" value={type} onChange={e => setType(e.target.value)}>
                  <option value="task">Nhiệm vụ</option>
                  <option value="info">Thông tin</option>
                  <option value="request">Yêu cầu</option>
                </select>
              </div>
              <div>
                <div className="form__label">Mức độ ưu tiên</div>
                <select className="input input--sm" value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                </select>
              </div>
              <div>
                <div className="form__label">Người phụ trách</div>
                <input className="input" placeholder="Tên/Email" value={assignee} onChange={e => setAssignee(e.target.value)} />
              </div>
              <div>
                <div className="form__label">Tags</div>
                <input className="input" placeholder="tag1, tag2" value={tags} onChange={e => setTags(e.target.value)} />
              </div>
              <div>
                <div className="form__label">Bắt đầu</div>
                <input className="input" type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} />
              </div>
              <div>
                <div className="form__label">Kết thúc</div>
                <input className="input" type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn--ghost" onClick={() => setMode('view')}>Hủy</button>
              <button className="btn" onClick={save}>Lưu</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
