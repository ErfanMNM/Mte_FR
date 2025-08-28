import React, { useMemo, useState } from 'react'
import { updateProject } from '../projects/store.js'

function displayName(u) {
  return [u?.profile?.first_name, u?.profile?.last_name].filter(Boolean).join(' ').trim() || u?.username || u?.email || `User ${u?.id}`
}

export default function ProjectFlow({ project, setProject, users = [] }) {
  const [addName, setAddName] = useState('')
  const [expanded, setExpanded] = useState(() => new Set())
  const [selectedPath, setSelectedPath] = useState(() => [0])

  const persist = (next) => {
    const updated = updateProject(project.id, { pipeline: next })
    setProject(updated)
  }

  // --- Tree helpers ---
  const getAt = (arr, path) => {
    let list = arr
    let node = undefined
    for (let i = 0; i < path.length; i++) {
      const idx = path[i]
      if (!Array.isArray(list) || idx < 0 || idx >= list.length) return undefined
      node = list[idx]
      list = node?.children || []
    }
    return node
  }
  const setAt = (arr, path, updater) => {
    if (path.length === 0) return updater ? updater(arr) : arr
    const [head, ...rest] = path
    const next = arr.slice()
    if (rest.length === 0) {
      next[head] = updater(next[head])
      return next
    }
    const node = next[head]
    const children = Array.isArray(node?.children) ? node.children : []
    next[head] = { ...(node || {}), children: setAt(children, rest, updater) }
    return next
  }
  const modifyChildren = (arr, parentPath, transformer) => {
    if (parentPath.length === 0) {
      return transformer(arr.slice())
    }
    return setAt(arr, parentPath, (p) => ({ ...(p || {}), children: transformer([...(p?.children || [])]) }))
  }
  const flattenLeaves = (nodes, path = []) => nodes.flatMap((n, i) => (n?.children?.length ? flattenLeaves(n.children, [...path, i]) : [{ node: n, path: [...path, i] }]))
  const hasInProgress = (nodes) => nodes?.some(n => n?.status === 'in_progress' || (n?.children?.length && hasInProgress(n.children)))
  const isNodeComplete = (node) => {
    if (!node) return false
    if (node.status === 'done' || node.status === 'skipped') return true
    if (node.children?.length) {
      const leaves = flattenLeaves([node])
      return leaves.every(x => x.node.status === 'done' || x.node.status === 'skipped')
    }
    return false
  }
  const arePrevSiblingsDone = (nodes, index) => nodes.slice(0, index).every(isNodeComplete)
  const canActivatePath = (path) => {
    // Only leaf can be started
    const node = getAt(project.pipeline, path)
    if (!node || (node.children && node.children.length)) return false
    // Check gating within its siblings and ancestors
    let list = project.pipeline
    for (let d = 0; d < path.length; d++) {
      const idx = path[d]
      if (!arePrevSiblingsDone(list, idx)) return false
      const parent = list[idx]
      list = parent?.children || []
    }
    // Only one in_progress globally
    if (hasInProgress(project.pipeline)) return false
    return true
  }

  const setStatusAt = (path, status) => {
    const node = getAt(project.pipeline, path)
    if (!node) return
    // Enforce: only leaves can be in_progress/done. Parent actions limited.
    const isLeaf = !(node.children && node.children.length)
    if ((status === 'in_progress' || status === 'done') && !isLeaf) {
      alert('Chỉ có thể bắt đầu/hoàn thành ở giai đoạn con (leaf).')
      return
    }
    // Enforce gating for start
    if (status === 'in_progress' && !canActivatePath(path)) {
      alert('Không thể bắt đầu khi các giai đoạn trước chưa Hoàn thành hoặc Hủy, hoặc đang có giai đoạn khác đang làm.')
      return
    }
    let next = setAt(project.pipeline, path, (s) => {
      const patch = { ...s, status }
      if (status === 'in_progress' && !s.startAt) patch.startAt = new Date().toISOString().slice(0,16)
      if (status === 'done' && !s.endAt) patch.endAt = new Date().toISOString().slice(0,16)
      return patch
    })
    // Auto-advance to next leaf after done/skipped
    if ((status === 'done' || status === 'skipped') && !hasInProgress(next)) {
      const leaves = flattenLeaves(next)
      const curIdx = leaves.findIndex(x => JSON.stringify(x.path) === JSON.stringify(path))
      if (curIdx !== -1) {
        for (let k = curIdx + 1; k < leaves.length; k++) {
          if (canActivatePath(leaves[k].path)) {
            next = setAt(next, leaves[k].path, (s) => ({ ...s, status: 'in_progress', startAt: s.startAt || new Date().toISOString().slice(0,16) }))
            break
          }
        }
      }
    }
    persist(next)
  }

  const setName = (path, name) => { persist(setAt(project.pipeline, path, (s) => ({ ...s, name }))) }

  const setOwners = (path, owners) => { persist(setAt(project.pipeline, path, (s) => ({ ...s, owners }))) }

  const setTime = (path, key, val) => { persist(setAt(project.pipeline, path, (s) => ({ ...s, [key]: val }))) }

  const setNote = (path, note) => { persist(setAt(project.pipeline, path, (s) => ({ ...s, note }))) }

  const moveSibling = (path, dir) => {
    if (path.length === 0) return
    const parentPath = path.slice(0, -1)
    const index = path[path.length - 1]
    const siblings = parentPath.length ? (getAt(project.pipeline, parentPath)?.children || []) : project.pipeline
    const j = index + (dir === 'up' ? -1 : 1)
    if (j < 0 || j >= siblings.length) return
    const next = modifyChildren(project.pipeline, parentPath, (arr) => { const tmp = arr[index]; arr[index] = arr[j]; arr[j] = tmp; return arr })
    persist(next)
    setSelectedPath([...parentPath, j])
  }

  const removeAt = (path) => {
    const node = getAt(project.pipeline, path)
    if (!String(node.id).startsWith('custom-')) return
    const parentPath = path.slice(0, -1)
    const index = path[path.length - 1]
    const next = modifyChildren(project.pipeline, parentPath, (arr) => { arr.splice(index, 1); return arr })
    persist(next)
  }

  const addStage = (position = 'after') => {
    const id = `custom-${crypto.randomUUID()}`
    const parentPath = selectedPath.slice(0, -1)
    const index = selectedPath[selectedPath.length - 1] ?? 0
    const siblings = parentPath.length ? ((getAt(project.pipeline, parentPath)?.children) || []) : project.pipeline
    const insertAtCandidate = Math.max(0, index + (position === 'before' ? 0 : 1))
    const activatable = canActivatePath([...parentPath, insertAtCandidate]) && !hasInProgress(project.pipeline)
    const newStage = { id, name: addName.trim() || 'Giai đoạn mới', status: activatable ? 'in_progress' : undefined }
    const next = modifyChildren(project.pipeline, parentPath, (arr) => { const insertAt = Math.min(arr.length, insertAtCandidate); arr.splice(insertAt, 0, newStage); return arr })
    persist(next)
    setSelectedPath([...parentPath, insertAtCandidate])
    setAddName('')
  }

  const resetDefault = () => {
    const next = project.pipeline.map(s => ({ id: s.id, name: s.name }))
    // Keep current names for known IDs, but replace order with default list
    const defaultIds = ['start','assessment','check_report','survey_demo','design_build_demo','demo','demo_report','await_contract','design','build','test','install','trial_run','handover','acceptance','support']
    const named = (id) => next.find(x => x.id === id)?.name
    const fresh = defaultIds.map((id, i) => ({ id, name: named(id) || humanizeId(id), status: i === 0 ? 'in_progress' : undefined }))
    persist(fresh)
    setSelectedPath([0])
  }

  const humanizeId = (id) => id.split('_').map(s => s.charAt(0).toUpperCase()+s.slice(1)).join(' ')

  const OwnersCell = ({ path, owners = [] }) => {
    const selected = new Set(owners)
    const add = (uid) => { if (!uid) return; if (selected.has(Number(uid))) return; setOwners(path, [...owners, Number(uid)]) }
    const removeOwner = (uid) => setOwners(path, owners.filter(v => String(v) !== String(uid)))
    return (
      <div style={{ display: 'grid', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(owners||[]).map(uid => {
            const u = users.find(x => String(x.id) === String(uid))
            return (
              <span key={uid} className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                👤 {u ? displayName(u) : `User ${uid}`}
                <button className="btn btn--ghost" onClick={() => removeOwner(uid)} style={{ padding: '2px 6px' }}>×</button>
              </span>
            )
          })}
        </div>
        <select className="input input--sm" onChange={e => { add(e.target.value); e.target.value = '' }}>
          <option value="">+ Thêm owner</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{displayName(u)}</option>
          ))}
        </select>
      </div>
    )
  }

  const StatusChip = ({ s }) => {
    const cls = s.status ? `chip chip--status-${s.status}` : 'chip'
    const label = s.status === 'in_progress' ? 'Đang làm' : s.status === 'done' ? 'Hoàn thành' : s.status === 'skipped' ? 'Hủy' : 'Chưa bắt đầu'
    return <span className={cls}>{label}</span>
  }

  const progress = useMemo(() => {
    const leaves = flattenLeaves(project.pipeline)
    const total = leaves.length
    const skipped = leaves.filter(x => x.node.status === 'skipped').length
    const done = leaves.filter(x => x.node.status === 'done').length
    return { done, total, skipped, pct: Math.round((done / Math.max(1, total - skipped)) * 100) }
  }, [project.pipeline])

  const derivedStatus = (node) => {
    if (node.status === 'skipped' || node.status === 'done') return node.status
    if (node.children?.length) {
      if (hasInProgress(node.children)) return 'in_progress'
      const leaves = flattenLeaves([node])
      const allDone = leaves.every(x => x.node.status === 'done' || x.node.status === 'skipped')
      if (allDone) return 'done'
    }
    return node.status
  }
  const NodeRow = ({ node, path, depth }) => {
    const isLeaf = !(node.children && node.children.length)
    const isSelected = JSON.stringify(path) === JSON.stringify(selectedPath)
    const canStart = isLeaf && canActivatePath(path) && !hasInProgress(project.pipeline)
    const dStatus = derivedStatus(node)
    const bulletBg = dStatus === 'done' ? '#22c55e' : dStatus === 'in_progress' ? '#2563eb' : dStatus === 'skipped' ? '#94a3b8' : '#e5e7eb'
    const bulletContent = dStatus === 'done' ? '✓' : dStatus === 'skipped' ? '×' : (path[path.length-1] + 1)
    const hasChildren = !!(node.children && node.children.length)
    const key = path.join('.')
    const isOpen = expanded.has(key)
    const toggle = () => {
      const next = new Set(expanded)
      if (isOpen) next.delete(key); else next.add(key)
      setExpanded(next)
      setSelectedPath(path)
    }
    return (
      <div style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 8, background: isSelected ? '#f8fafc' : '#fff', display: 'grid', gap: 8, marginLeft: depth * 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: 999, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: '#fff', background: bulletBg }}>
            {bulletContent}
          </div>
          {hasChildren ? (
            <button className="btn btn--ghost" onClick={toggle} title={isOpen ? 'Thu gọn' : 'Mở rộng'}> {isOpen ? '▾' : '▸'} </button>
          ) : <span style={{ width: 26 }} />}
          <input className="input input--sm" value={node.name} onChange={e => setName(path, e.target.value)} style={{ fontWeight: 700 }} />
          <StatusChip s={{ status: dStatus }} />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button className="btn btn--ghost" onClick={() => setSelectedPath(path)}>Chọn</button>
            <button className="btn btn--ghost" onClick={() => moveSibling(path, 'up')} disabled={path[path.length-1]===0}>↑</button>
            <button className="btn btn--ghost" onClick={() => moveSibling(path, 'down')} disabled={(() => { const parent = getAt(project.pipeline, path.slice(0,-1)); const len = path.length===1 ? project.pipeline.length : (parent?.children||[]).length; return (len - 1) === path[path.length-1] })()}>↓</button>
            {String(node.id).startsWith('custom-') ? (
              <button className="btn btn--danger" onClick={() => removeAt(path)}>Xoá</button>
            ) : null}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 8, alignItems: 'center' }}>
          <input className="input input--sm" type="datetime-local" value={node.startAt || ''} onChange={e => setTime(path, 'startAt', e.target.value)} placeholder="Bắt đầu" />
          <input className="input input--sm" type="datetime-local" value={node.endAt || ''} onChange={e => setTime(path, 'endAt', e.target.value)} placeholder="Kết thúc" />
          <input className="input input--sm" value={node.note || ''} onChange={e => setNote(path, e.target.value)} placeholder="Ghi chú" />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button className="btn btn--ghost" onClick={() => setStatusAt(path, 'skipped')} disabled={node.status === 'done'}>Hủy</button>
            <button className="btn btn--ghost" onClick={() => setStatusAt(path, 'in_progress')} disabled={!canStart || node.status === 'done' || node.status === 'skipped' || !isLeaf}>Bắt đầu</button>
            <button className="btn" onClick={() => setStatusAt(path, 'done')} disabled={node.status === 'done' || !isLeaf}>Đánh dấu xong</button>
          </div>
        </div>
        <div>
          <div className="form__label">Owners</div>
          <OwnersCell path={path} owners={node.owners || []} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn--ghost" onClick={() => addChild(path)}>+ Thêm giai đoạn con</button>
        </div>
        {hasChildren && expanded.has(key) && (
          <div style={{ display: 'grid', gap: 8 }}>
            {node.children.map((child, ci) => (
              <NodeRow key={child.id} node={child} path={[...path, ci]} depth={depth+1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const addChild = (path) => {
    const id = `custom-${crypto.randomUUID()}`
    const newStage = { id, name: 'Giai đoạn nhỏ', status: undefined }
    const next = setAt(project.pipeline, path, (s) => ({ ...s, children: [...(s.children||[]), newStage] }))
    persist(next)
    const key = path.join('.')
    const nextExpanded = new Set(expanded); nextExpanded.add(key); setExpanded(nextExpanded)
  }

  return (
    <div className="card">
      <div className="card__body" style={{ display: 'grid', gap: 12 }}>
        <div className="card__title">Timeline quy trình</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge">Tiến độ: {progress.done}/{progress.total - progress.skipped} ({progress.pct}%)</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <input className="input input--sm" placeholder="Tên giai đoạn mới" value={addName} onChange={e => setAddName(e.target.value)} style={{ maxWidth: 240 }} />
            <button className="btn" onClick={() => addStage('after')} disabled={!addName.trim()}>+ Thêm (sau)</button>
            <button className="btn btn--ghost" onClick={() => addStage('before')} disabled={!addName.trim()}>+ Thêm (trước)</button>
            <button className="btn btn--ghost" onClick={resetDefault}>↺ Reset mặc định</button>
          </div>
        </div>

        {/* Tree timeline */}
        <div style={{ display: 'grid', gap: 10 }}>
          {project.pipeline.map((node, i) => (
            <NodeRow key={node.id} node={node} path={[i]} depth={0} />
          ))}
        </div>
      </div>
    </div>
  )
}
