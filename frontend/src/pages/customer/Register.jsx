import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/Auth.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);

    try {
      await api.post('/Auth/register', { 
        email, 
        password, 
        fullName, 
        phoneNumber: phone 
      });
      setMsg('Đăng ký thành công! Đang chuyển hướng đến trang xác thực OTP...');
      setTimeout(() => {
        navigate('/verify-otp', { state: { email } });
      }, 1500);
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorMsgs = err.response.data.errors.map(e => e.description).join(' ');
        setError(`Đăng ký thất bại: ${errorMsgs}`);
      } else if (err.response?.data?.errors) {
        // If it's an object (like standard ASP.NET validation errors)
        const errorObj = err.response.data.errors;
        const msgs = Object.values(errorObj).flat().join(' ');
        setError(`Đăng ký thất bại: ${msgs}`);
      } else {
        setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cps-auth-container">
      <div className="cps-auth-box">
        <h2 className="cps-auth-title">Đăng Ký Tài Khoản</h2>
        <p className="cps-auth-subtitle">Tạo tài khoản để nhận nhiều ưu đãi thành viên.</p>

        {error && <div className="cps-auth-error">{error}</div>}
        {msg && <div className="cps-auth-success">{msg}</div>}

        <form onSubmit={handleSubmit} className="cps-auth-form">
          <div className="cps-auth-group">
            <label>Họ và tên *</label>
            <input 
              type="text" 
              required 
              value={fullName} 
              onChange={e => setFullName(e.target.value)}
              placeholder="Nhập họ và tên của bạn"
            />
          </div>

          <div className="cps-auth-group">
            <label>Số điện thoại *</label>
            <input 
              type="tel" 
              required 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
            />
          </div>

          <div className="cps-auth-group">
            <label>Email *</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="Nhập địa chỉ email"
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

          <button type="submit" className="cps-btn-auth" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'ĐĂNG KÝ'}
          </button>
        </form>

        <div className="cps-auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
