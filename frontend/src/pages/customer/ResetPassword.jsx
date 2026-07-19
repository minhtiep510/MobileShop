import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import '../../styles/Auth.css';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If navigated from ForgotPassword, pre-fill email
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      // If no email in state, redirect back to forgot-password
      navigate('/forgot-password');
    }
  }, [location, navigate]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (otp.length !== 6) {
      setError('Mã OTP phải bao gồm 6 chữ số.');
      return;
    }

    setLoading(true);
    try {
      // Verify OTP using the existing verify-email endpoint which checks the exact same token
      await api.post('/Auth/verify-email', { email: email.trim(), otp: otp.trim() });
      setStep(2); // OTP is valid, proceed to password reset
    } catch (err) {
      setError(err.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/Auth/reset-password', { 
        email: email.trim(), 
        otp: otp.trim(), 
        newPassword 
      });
      
      toast.success('Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.');
      navigate('/login');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra, mã OTP có thể đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cps-auth-container">
      <div className="cps-auth-box">
        <h2 className="cps-auth-title">{step === 1 ? 'Xác Nhận OTP' : 'Đặt Lại Mật Khẩu'}</h2>
        <p className="cps-auth-subtitle">
          {step === 1 
            ? `Vui lòng nhập mã OTP gồm 6 chữ số đã được gửi đến email ${email}` 
            : 'Mã xác nhận hợp lệ. Vui lòng tạo mật khẩu mới cho tài khoản của bạn.'}
        </p>

        {error && <div className="cps-auth-error">{error}</div>}

        {step === 1 ? (
          <form onSubmit={handleVerifyOtp} className="cps-auth-form">
            <div className="cps-auth-group">
              <label>Mã OTP *</label>
              <input
                type="text"
                required
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="Nhập mã OTP 6 số"
                maxLength="6"
                autoFocus
              />
            </div>

            <button type="submit" className="cps-btn-auth" disabled={loading}>
              {loading ? 'Đang xác thực...' : 'XÁC NHẬN OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="cps-auth-form">
            <div className="cps-auth-group">
              <label>Mật khẩu mới *</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                autoFocus
              />
            </div>

            <div className="cps-auth-group">
              <label>Xác nhận mật khẩu *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <button type="submit" className="cps-btn-auth" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'ĐỔI MẬT KHẨU'}
            </button>
          </form>
        )}

        <div className="cps-auth-footer" style={{ marginTop: '20px' }}>
          Quay lại trang <Link to="/login">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
