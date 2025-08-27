import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthProvider.jsx'
import { profileApi } from '../api/client.js'

function Avatar({ name, url, size = 64 }) {
  const initials = useMemo(() => {
    if (!name) return 'U'
    const parts = name.split(' ').filter(Boolean)
    return parts.slice(0,2).map(p => p[0]?.toUpperCase()).join('') || 'U'
  }, [name])
  if (url) {
    return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: 999, objectFit: 'cover', border: '1px solid var(--border)' }} />
  }
  return <div style={{ width: size, height: size }} className="avatar">{initials}</div>
}

function LogsTable() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [type, setType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true); setError('')
      try {
        const res = await profileApi.logs({ page, pageSize, type: type.trim() || undefined })
        // Try common shapes
        const list = res?.data?.list || res?.list || []
        const totalItems = res?.data?.total || res?.total || list.length
        if (mounted) { setRows(list); setTotal(totalItems) }
      } catch (err) {
        if (mounted) setError(err?.data?.message || err?.message || 'Không tải được logs')
      } finally { if (mounted) setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [page, pageSize, type])

  return (
    <div className="card">
      <div className="card__body">
        <div className="card__title">Nhật ký hoạt động</div>
        <div className="card__desc">Theo dõi đăng nhập và thay đổi bảo mật gần đây.</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '8px 0' }}>
          <input className="input" placeholder="Lọc theo type (vd: login)" value={type} onChange={e => { setPage(1); setType(e.target.value) }} style={{ maxWidth: 220 }} />
          <select className="input" value={pageSize} onChange={e => { setPage(1); setPageSize(Number(e.target.value)) }} style={{ maxWidth: 120 }}>
            <option value={5}>5 / trang</option>
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
          </select>
          <div style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 13 }}>Trang {page}/{totalPages}</div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Sự kiện</th>
                <th>IP</th>
                <th>Thiết bị</th>
                <th>Trình duyệt</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 12 }}>Đang tải...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} style={{ padding: 12, color: '#b91c1c' }}>{error}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 12, color: 'var(--muted)' }}>Không có dữ liệu</td></tr>
              ) : (
                rows.map(item => (
                  <tr key={item.id || `${item.summary}-${item.operatingTime}`}>
                    <td>{item.summary}</td>
                    <td>{item.ip}</td>
                    <td>{item.system || item.device || '-'}</td>
                    <td>{item.browser || '-'}</td>
                    <td>{new Date(item.operatingTime || item.createdAt || Date.now()).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', marginTop: 10 }}>
          <button className="btn btn--ghost" disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</button>
          <button className="btn btn--ghost" disabled={page >= totalPages || loading} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Sau</button>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true); setError('')
      try {
        const res = await profileApi.me()
        if (mounted) setProfile(res?.profile || res)
      } catch (err) {
        if (mounted) setError(err?.data?.message || err?.message || 'Không lấy được profile')
      } finally { if (mounted) setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [])

  const displayName = useMemo(() => {
    if (!profile) return ''
    const { first_name, last_name } = profile
    const full = [first_name, last_name].filter(Boolean).join(' ').trim()
    return full || user?.username || user?.email || 'User'
  }, [profile, user])

  return (
    <div className="page">
      <h1 className="page__title">User Profile</h1>
      <div className="grid-2">
        <div className="card">
          <div className="card__body" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, alignItems: 'center' }}>
            <Avatar name={displayName} url={profile?.avatar_url} size={72} />
            <div>
              <div className="card__title" style={{ fontSize: 18 }}>{displayName}</div>
              <div className="card__desc">
                <div>Email: <b>{user?.email || '-'}</b></div>
                <div>Username: <b>{user?.username || '-'}</b></div>
                <div>Role: <b>{user?.role || '-'}</b></div>
                <div>Địa chỉ: <b>{[profile?.city, profile?.country].filter(Boolean).join(', ') || '-'}</b></div>
              </div>
            </div>
            {loading ? <div style={{ gridColumn: '1 / -1', color: 'var(--muted)' }}>Đang tải profile...</div> : null}
            {error ? <div style={{ gridColumn: '1 / -1', color: '#b91c1c' }}>{error}</div> : null}
          </div>
        </div>

        <div className="card">
          <div className="card__body">
            <div className="card__title">Thông tin chi tiết</div>
            <div className="details">
              <div><span>Họ:</span><b>{profile?.last_name || '-'}</b></div>
              <div><span>Tên:</span><b>{profile?.first_name || '-'}</b></div>
              <div><span>Điện thoại:</span><b>{profile?.phone || '-'}</b></div>
              <div><span>Quốc gia:</span><b>{profile?.country || '-'}</b></div>
              <div><span>Thành phố:</span><b>{profile?.city || '-'}</b></div>
              <div><span>Ngôn ngữ:</span><b>{profile?.language || '-'}</b></div>
              <div style={{ gridColumn: '1 / -1' }}><span>Bio:</span><b>{profile?.bio || '-'}</b></div>
            </div>
          </div>
        </div>
      </div>

      <LogsTable />
    </div>
  )
}
