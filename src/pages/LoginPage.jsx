import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ login: '', password: '', totp_code: '' })
  const [showTotp, setShowTotp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await login({ login: form.login.trim(), password: form.password, totp_code: showTotp ? form.totp_code.trim() : undefined })
      // Nếu server báo cần 2FA
      if (!showTotp && (res?.user?.has_2fa || res?.need_totp)) {
        setShowTotp(true)
        return
      }
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Đăng nhập thất bại'
      if (/2fa|totp/i.test(msg) && !showTotp) setShowTotp(true)
      setError(msg)
    } finally { setLoading(false) }
  }

  return (
    <div className="login">
      <div className="login__card card">
        <div className="card__body">
          <div className="page__title" style={{ marginBottom: 4 }}>Đăng nhập</div>
          <div className="card__desc">Nhập email/username và mật khẩu để tiếp tục.</div>
          {error ? <div style={{ color: '#b91c1c', fontSize: 13 }}>{error}</div> : null}
          <form onSubmit={onSubmit} className="form" autoComplete="off">
            <label className="form__field">
              <div className="form__label">Email hoặc Username</div>
              <input className="input" name="login" value={form.login} onChange={onChange} placeholder="you@example.com hoặc username" required />
            </label>
            <label className="form__field">
              <div className="form__label">Mật khẩu</div>
              <input className="input" type="password" name="password" value={form.password} onChange={onChange} placeholder="••••••••" required />
            </label>
            {showTotp && (
              <label className="form__field">
                <div className="form__label">Mã 2FA (TOTP)</div>
                <input className="input" name="totp_code" value={form.totp_code} onChange={onChange} placeholder="123456" />
              </label>
            )}
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Đang xử lý...' : 'Đăng nhập'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}

