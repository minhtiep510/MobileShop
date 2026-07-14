import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      const res = await api.post('/Auth/login', { email: trimmedEmail, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      if (res.data.user.role?.toLowerCase() === 'admin') {
        window.location.href = '/admin'; // Hard redirect for admin layout
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cps-auth-container">
      <div className="cps-auth-box">
        <h2 className="cps-auth-title">Đăng Nhập</h2>
        <p className="cps-auth-subtitle">Đăng nhập để theo dõi đơn hàng và nhận nhiều ưu đãi.</p>

        {error && <div className="cps-auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="cps-auth-form">
          <div className="cps-auth-group">
            <label>Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
            />
          </div>

          <div className="cps-auth-group">
            <label>Mật khẩu *</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
            />
          </div>

          <div className="cps-auth-forgot">
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>

          <button type="submit" className="cps-btn-auth" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        <div className="cps-auth-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
}
