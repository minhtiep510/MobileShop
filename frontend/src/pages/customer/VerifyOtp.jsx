import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import './Auth.css';

export default function VerifyOtp() {
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const inputRefs = useRef([]);

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 6).split('');
    if (pastedData.some(isNaN)) return;

    const newOtp = [...otp];
    pastedData.forEach((value, index) => {
      newOtp[index] = value;
    });
    setOtp(newOtp);

    // Focus the last filled input or the first empty one
    const focusIndex = Math.min(pastedData.length, 5);
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus();
    } else if (inputRefs.current[5]) {
      inputRefs.current[5].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalOtp = otp.join('');
    if (finalOtp.length < 6) return;

    setError('');
    setMsg('');
    setLoading(true);

    try {
      await api.post('/Auth/verify-email', { email, otp: finalOtp });
      setMsg('Xác thực thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setMsg('');
    try {
      await api.post('/Auth/resend-otp', { email });
      setMsg('Đã gửi lại mã OTP. Vui lòng kiểm tra email (hoặc Terminal).');
      setCountdown(300); // Bắt đầu lại bộ đếm ngược
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi lại mã OTP.');
    }
  };

  if (!email) return null;

  return (
    <div className="cps-auth-container">
      <div className="cps-auth-box">
        <h2 className="cps-auth-title">Xác Thực Email</h2>
        <p className="cps-auth-subtitle">Vui lòng nhập mã OTP đã được gửi đến email <strong>{email}</strong></p>

        {error && <div className="cps-auth-error">{error}</div>}
        {msg && <div className="cps-auth-success">{msg}</div>}

        <form onSubmit={handleSubmit} className="cps-auth-form">
          <div className="cps-auth-group">
            <label style={{ textAlign: 'center', display: 'block', marginBottom: '15px' }}>Mã OTP *</label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={data}
                  ref={(el) => (inputRefs.current[index] = el)}
                  onChange={e => handleChange(e.target, index)}
                  onKeyDown={e => handleKeyDown(e, index)}
                  onFocus={e => e.target.select()}
                  onPaste={handlePaste}
                  style={{
                    width: '45px',
                    height: '50px',
                    fontSize: '24px',
                    textAlign: 'center',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontWeight: 'bold',
                    color: '#d70018',
                    outlineColor: '#d70018'
                  }}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="cps-btn-auth" disabled={loading || otp.join('').length < 6} style={{ marginTop: '20px' }}>
            {loading ? 'Đang xác thực...' : 'XÁC THỰC'}
          </button>
        </form>

        <div className="cps-auth-footer">
          Chưa nhận được mã?
          {countdown > 0 ? (
            <span style={{ color: '#666', marginLeft: '5px', fontSize: '0.9rem', fontWeight: '600' }}>Gửi lại sau {countdown}s</span>
          ) : (
            <button type="button" onClick={handleResend} style={{ color: '#1e40af', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginLeft: '5px' }}>Gửi lại mã</button>
          )}
        </div>
      </div>
    </div>
  );
}
