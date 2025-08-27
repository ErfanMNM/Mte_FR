import React, { useEffect, useMemo, useState } from 'react'

const DEFAULT_STORAGE_KEY = 'kanban-board-v1'

const defaultBoard = () => ([
  { id: 'todo', title: 'Todo', color: '#f1f5f9', tasks: [
    { id: crypto.randomUUID(), title: 'Chào mừng 👋', description: 'Kéo thả thẻ giữa các cột' },
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

export default function KanbanBoard({ storageKey = DEFAULT_STORAGE_KEY }) {
  const [board, setBoard] = useLocalBoard(storageKey)
  const [filter, setFilter] = useState('')

  const filteredBoard = useMemo(() => {
    if (!filter.trim()) return board
    const q = filter.toLowerCase()
    return board.map(col => ({
      ...col,
      tasks: col.tasks.filter(t => t.title.toLowerCase().includes(q) || (t.description||'').toLowerCase().includes(q))
    }))
  }, [board, filter])

  const addTask = (columnId, title) => {
    if (!title.trim()) return
    setBoard(prev => prev.map(c =>
      c.id === columnId
        ? { ...c, tasks: [...c.tasks, { id: crypto.randomUUID(), title: title.trim(), description: '' }] }
        : c
    ))
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

  return (
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
          />
        ))}
      </main>
    </div>
  )
}

function Column({ column, onAdd, onDropTask, onUpdateTask, onDeleteTask }) {
  const [newTitle, setNewTitle] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const onDrop = (e) => {
    e.preventDefault()
    const data = e.dataTransfer.getData('application/json')
    if (!data) return
    try {
      const { taskId, fromColumnId } = JSON.parse(data)
      onDropTask(taskId, fromColumnId)
    } catch {}
    setDragOver(false)
  }

  const onDragOver = (e) => { e.preventDefault() }
  const onDragEnter = () => setDragOver(true)
  const onDragLeave = () => setDragOver(false)

  const handleAdd = () => {
    onAdd(newTitle)
    setNewTitle('')
  }

  return (
    <section className={`column ${dragOver ? 'drag-over' : ''}`} style={{ backgroundColor: column.color }} onDrop={onDrop} onDragOver={onDragOver} onDragEnter={onDragEnter} onDragLeave={onDragLeave}>
      <header className="column__header">
        <h3>{column.title}</h3>
        <span className="badge">{column.tasks.length}</span>
      </header>

      <div className="column__list">
        {column.tasks.map(task => (
          <TaskCard key={task.id} task={task} columnId={column.id} onUpdate={onUpdateTask} onDelete={onDeleteTask} />
        ))}
      </div>

      <div className="column__add">
        <input
          className="input"
          placeholder="Thêm thẻ mới..."
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        />
        <button className="btn" onClick={handleAdd}>Thêm</button>
      </div>
    </section>
  )
}

function TaskCard({ task, columnId, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [desc, setDesc] = useState(task.description || '')
  const [dragging, setDragging] = useState(false)

  useEffect(() => { setTitle(task.title); setDesc(task.description || '') }, [task.id])

  const onDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id, fromColumnId: columnId }))
    e.dataTransfer.effectAllowed = 'move'
    setDragging(true)
  }
  const onDragEnd = () => setDragging(false)

  const save = () => {
    onUpdate(task.id, { title: title.trim() || 'Không tên', description: desc })
    setEditing(false)
  }

  return (
    <article className={`card ${dragging ? 'dragging' : ''}`} draggable onDragStart={onDragStart} onDragEnd={onDragEnd}>
      {editing ? (
        <div className="card__body">
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} />
          <textarea className="textarea" rows={3} value={desc} onChange={e => setDesc(e.target.value)} />
          <div className="card__actions">
            <button className="btn" onClick={save}>Lưu</button>
            <button className="btn btn--ghost" onClick={() => setEditing(false)}>Hủy</button>
          </div>
        </div>
      ) : (
        <div className="card__body">
          <div className="card__title">{task.title}</div>
          {task.description ? <div className="card__desc">{task.description}</div> : null}
          <div className="card__actions">
            <button className="btn btn--ghost" onClick={() => setEditing(true)}>Sửa</button>
            <button className="btn btn--danger" onClick={() => onDelete(task.id)}>Xóa</button>
          </div>
        </div>
      )}
    </article>
  )
}
