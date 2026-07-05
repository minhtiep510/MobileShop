import React, { useState } from 'react';
import { Key, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';

export default function ChangePassword() {
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [pwdStatus, setPwdStatus] = useState({ type: '', message: '' });
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const handlePwdChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const submitChangePassword = async (e) => {
    e.preventDefault();
    setPwdStatus({ type: '', message: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPwdStatus({ type: 'error', message: 'Mật khẩu xác nhận không khớp.' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPwdStatus({ type: 'error', message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }

    setIsChangingPwd(true);
    try {
      const res = await api.post('/Profile/change-password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      setPwdStatus({ type: 'success', message: res.data.message || 'Đổi mật khẩu thành công.' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      setPwdStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.' 
      });
    } finally {
      setIsChangingPwd(false);
    }
  };

  return (
    <div style={{ padding: '30px' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--cps-text)', marginBottom: '20px', borderBottom: '1px solid var(--cps-border)', paddingBottom: '15px' }}>
        Đổi Mật Khẩu
      </h2>
      <p style={{ color: 'var(--cps-text-light)', marginBottom: '20px', fontSize: '0.95rem' }}>
        Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác.
      </p>

      {pwdStatus.message && (
        <div style={{ padding: '12px 15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px', background: pwdStatus.type === 'error' ? '#fef2f2' : '#f0fdf4', color: pwdStatus.type === 'error' ? '#b91c1c' : '#15803d' }}>
          {pwdStatus.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span style={{ fontWeight: 500 }}>{pwdStatus.message}</span>
        </div>
      )}

      <form onSubmit={submitChangePassword} style={{ maxWidth: '500px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--cps-text)' }}>Mật khẩu hiện tại</label>
          <input 
            type="password" 
            name="oldPassword"
            value={passwordData.oldPassword}
            onChange={handlePwdChange}
            required
            style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid var(--cps-border)', outline: 'none' }}
            placeholder="Nhập mật khẩu hiện tại"
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--cps-text)' }}>Mật khẩu mới</label>
          <input 
            type="password" 
            name="newPassword"
            value={passwordData.newPassword}
            onChange={handlePwdChange}
            required
            style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid var(--cps-border)', outline: 'none' }}
            placeholder="Nhập mật khẩu mới"
          />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--cps-text)' }}>Xác nhận mật khẩu</label>
          <input 
            type="password" 
            name="confirmPassword"
            value={passwordData.confirmPassword}
            onChange={handlePwdChange}
            required
            style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid var(--cps-border)', outline: 'none' }}
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>

        <button 
          type="submit" 
          disabled={isChangingPwd}
          style={{ background: 'var(--cps-red)', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          {isChangingPwd ? 'Đang xử lý...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
}
