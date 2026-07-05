import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      await api.post('/Auth/forgot-password', { email: trimmedEmail });
      
      // Navigate to reset password page, passing email in state
      navigate('/reset-password', { state: { email: trimmedEmail } });
      
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cps-auth-container">
      <div className="cps-auth-box">
        <h2 className="cps-auth-title">Quên Mật Khẩu</h2>
        <p className="cps-auth-subtitle">Nhập email của bạn để nhận mã xác thực OTP lấy lại mật khẩu.</p>

        {error && <div className="cps-auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="cps-auth-form">
          <div className="cps-auth-group">
            <label>Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Nhập email đã đăng ký"
            />
          </div>

          <button type="submit" className="cps-btn-auth" disabled={loading}>
            {loading ? 'Đang gửi mã...' : 'GỬI MÃ OTP'}
          </button>
        </form>

        <div className="cps-auth-footer" style={{ marginTop: '20px' }}>
          Quay lại trang <Link to="/login">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
