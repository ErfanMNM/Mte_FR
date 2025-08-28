import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addProject, getProjects } from '../projects/store.js'
import { usersApi } from '../api/client.js'

function ParticipantsPicker({ value = [], onChange, catalog = [] }) {
  const [q, setQ] = useState('')
  const selected = useMemo(() => new Set(value), [value])
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const pool = catalog.filter(u => !selected.has(u.id))
    if (!query) return pool.slice(0, 10)
    const hay = (u) => [u.username, u.email, u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ').toLowerCase()
    return pool.filter(u => hay(u).includes(query)).slice(0, 10)
  }, [q, catalog, selected])
  const add = (id) => { if (!selected.has(id)) onChange?.([...value, id]) }
  const remove = (id) => { onChange?.(value.filter(v => v !== id)) }
  const displayName = (u) => {
    const full = [u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ').trim()
    return full || u.username || u.email || `User ${u.id}`
  }
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {value.map(id => {
          const u = catalog.find(x => x.id === id)
          if (!u) return null
          return (
            <span key={id} className="badge" title={u.email} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              👤 {displayName(u)}
              <button className="btn btn--ghost" onClick={() => remove(id)} style={{ padding: '2px 6px' }}>×</button>
            </span>
          )
        })}
      </div>
      <input className="input" placeholder="Tìm và thêm người dùng..." value={q} onChange={e => setQ(e.target.value)} />
      {filtered.length > 0 && (
        <div className="table-wrap" style={{ maxHeight: 180, overflow: 'auto' }}>
          <table className="table">
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => add(u.id)}>
                  <td data-label="Người dùng">{displayName(u)}</td>
                  <td data-label="Email" className="muted">{u.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function ProjectsList() {
  const [projects, setProjects] = useState(getProjects())
  const [q, setQ] = useState('')
  const [form, setForm] = useState({ name: '', description: '', participants: [] })
  const [userCatalog, setUserCatalog] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [view, setView] = useState(() => {
    try { return localStorage.getItem('projects-view') || 'list' } catch { return 'list' }
  })
  const [showAdd, setShowAdd] = useState(false)
  const [sort, setSort] = useState(() => {
    try { return localStorage.getItem('projects-sort') || 'name-asc' } catch { return 'name-asc' }
  })
  const navigate = useNavigate()

  useEffect(() => {
    try { localStorage.setItem('projects-view', view) } catch {}
  }, [view])

  useEffect(() => {
    try { localStorage.setItem('projects-sort', sort) } catch {}
  }, [sort])

  useEffect(() => {
    let mounted = true
    async function loadUsers() {
      setLoadingUsers(true)
      try {
        const res = await usersApi.list({ page: 1, limit: 100 })
        const list = res?.users || res?.data?.users || res?.data || []
        if (mounted) setUserCatalog(Array.isArray(list) ? list : [])
      } catch {
        if (mounted) setUserCatalog([])
      } finally { if (mounted) setLoadingUsers(false) }
    }
    loadUsers()
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return projects
    return projects.filter(p => p.name.toLowerCase().includes(query) || (p.description||'').toLowerCase().includes(query))
  }, [projects, q])

  const sorted = useMemo(() => {
    const [key, dir] = sort.split('-')
    const list = [...filtered]
    list.sort((a, b) => {
      const va = String(a[key] || '').toLowerCase()
      const vb = String(b[key] || '').toLowerCase()
      if (va < vb) return dir === 'asc' ? -1 : 1
      if (va > vb) return dir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [filtered, sort])

  const create = (e) => {
    e.preventDefault()
    const participantIds = Array.from(new Set(form.participants))
    const proj = addProject({ name: form.name, description: form.description, participants: participantIds })
    setProjects(getProjects())
    setForm({ name: '', description: '', participants: '' })
    setShowAdd(false)
    navigate(`/projects/${proj.id}`)
  }

  // deletion moved to Project Detail settings

  const coverStyle = (seed) => {
    const hash = Array.from(String(seed)).reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0)
    const h1 = Math.abs(hash) % 360
    const h2 = (h1 + 40) % 360
    const c1 = `hsl(${h1}, 70%, 75%)`
    const c2 = `hsl(${h2}, 70%, 65%)`
    return { backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})` }
  }

  return (
    <div className="page">
      <h1 className="page__title">Projects</h1>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card__body" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => setShowAdd(true)}>+ Thêm</button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: 8, opacity: .6 }}>🔎</span>
              <input className="input" placeholder="Tìm kiếm dự án..." value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 280, paddingLeft: 32 }} />
            </div>
            <select className="input" value={sort} onChange={e => setSort(e.target.value)} style={{ maxWidth: 200 }}>
              <option value="name-asc">Sắp xếp: Tên (A→Z)</option>
              <option value="name-desc">Sắp xếp: Tên (Z→A)</option>
            </select>
            <div className="btn-group" style={{ display: 'flex', gap: 6 }}>
              <button className={`btn ${view === 'list' ? '' : 'btn--ghost'}`} onClick={() => setView('list')} title="Dạng danh sách">Danh sách</button>
              <button className={`btn ${view === 'cards' ? '' : 'btn--ghost'}`} onClick={() => setView('cards')} title="Dạng thẻ">Card</button>
            </div>
          </div>
        </div>
      </div>

      {view === 'list' ? (
        <div className="card">
          <div className="card__body">
            <div className="card__title">📋 Danh sách dự án</div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>📁 Tên</th>
                    <th>📝 Mô tả</th>
                    <th>👥 Thành viên</th>
                    <th>⏱ Quy trình</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: 12, color: 'var(--muted)' }}>Chưa có dự án</td></tr>
                  ) : sorted.map(p => (
                    <tr key={p.id} onDoubleClick={() => navigate(`/projects/${p.id}`)} style={{ cursor: 'pointer' }}>
                      <td data-label="📁 Tên"><Link to={`/projects/${p.id}`}>📁 {p.name}</Link></td>
                      <td data-label="📝 Mô tả" style={{ color: 'var(--muted)' }}>{p.description || '-'}</td>
                      <td data-label="👥 Thành viên">
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {Array.isArray(p.participants) && p.participants.slice(0,5).map((pid, i) => {
                            const u = userCatalog.find(x => String(x.id) === String(pid))
                            const label = u ? (([u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ') || u.username || u.email)) : String(pid)
                            return <span key={i} className="badge">👤 {label}</span>
                          })}
                          {p.participants?.length > 5 ? <span className="badge">+{p.participants.length - 5}</span> : null}
                        </div>
                      </td>
                      <td data-label="⏱ Quy trình">
                        <span className="badge">{['Thông tin','Khảo sát','Thiết kế','Demo','Thi công','Nghiệm thu','Hỗ trợ'][Math.min(Math.max(0, p.stageIndex ?? 0), 6)] || '—'}</span>
                      </td>
                      <td data-label="Hành động" style={{ textAlign: 'right' }}>
                        <Link className="btn btn--ghost" to={`/projects/${p.id}`}>🔎 Mở</Link>
                        <Link className="btn btn--ghost" style={{ marginLeft: 6 }} to={`/projects/${p.id}#settings`}>⚙️ Cài đặt</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card__body">
            <div className="card__title">🗂️ Dự án (dạng thẻ)</div>
            {sorted.length === 0 ? (
              <div className="card__desc">Chưa có dự án</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {sorted.map(p => (
                  <div
                    key={p.id}
                    className="card"
                    style={{ border: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <div style={{ position: 'relative' }}>
                      <div style={{ height: 120, backgroundSize: 'cover', backgroundPosition: 'center', ...(p.cover ? { backgroundImage: `url(${p.cover})` } : coverStyle(p.id)) }} />
                      <div style={{ position: 'absolute', left: 12, bottom: 12, right: 12, color: '#0f172a', fontWeight: 700, letterSpacing: .2 }}>📁 {p.name}</div>
                    </div>
                    <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="card__desc" style={{ minHeight: 36 }}>📝 {p.description || '—'}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minHeight: 24 }}>
                        {Array.isArray(p.participants) && p.participants.slice(0,5).map((pid, i) => {
                          const u = userCatalog.find(x => String(x.id) === String(pid))
                          const label = u ? (([u.profile?.first_name, u.profile?.last_name].filter(Boolean).join(' ') || u.username || u.email)) : String(pid)
                          return <span key={i} className="badge">👥 {label}</span>
                        })}
                        {p.participants?.length > 5 ? <span className="badge">+{p.participants.length - 5}</span> : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showAdd && (
        <Modal title="Tạo dự án mới" onClose={() => setShowAdd(false)}>
          <form className="form" onSubmit={create}>
            <input className="input" placeholder="Tên dự án" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            <input className="input" placeholder="Mô tả (tuỳ chọn)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div className="form__field">
              <div className="form__label">Người tham gia (từ backend)</div>
              <ParticipantsPicker value={form.participants} onChange={(v) => setForm(f => ({ ...f, participants: v }))} catalog={userCatalog} />
              {loadingUsers ? <div className="card__desc">Đang tải người dùng...</div> : null}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn--ghost" onClick={() => setShowAdd(false)}>Hủy</button>
              <button className="btn" type="submit">Tạo</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'grid', placeItems: 'center', padding: 16, zIndex: 50 }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="card__title">{title}</div>
            <button className="btn btn--ghost" onClick={onClose} aria-label="Đóng">×</button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
