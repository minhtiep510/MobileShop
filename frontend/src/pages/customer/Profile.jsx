import React, { useState, useEffect } from 'react';
import { User, Key, Shield, Award, MapPin, Phone, Mail, CheckCircle, AlertCircle, Edit2, X, Save } from 'lucide-react';
import api from '../../services/api';
import './Profile.css';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phoneNumber: '', address: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/Profile');
        setProfile(res.data);
        setEditForm({
          fullName: res.data.fullName || '',
          phoneNumber: res.data.phoneNumber || '',
          address: res.data.address || ''
        });
      } catch (err) {
        console.error('Lỗi lấy thông tin:', err);
        setError('Không thể lấy thông tin người dùng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="profile-container flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-container text-center py-12">
        <AlertCircle className="w-16 h-16 text-danger mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">{error || 'Không tìm thấy người dùng'}</h2>
      </div>
    );
  }

  // Determine rank color
  let rankColor = 'rank-default';
  if (profile.rank === 'Bạc') rankColor = 'rank-silver';
  if (profile.rank === 'Vàng') rankColor = 'rank-gold';
  if (profile.rank === 'Kim Cương') rankColor = 'rank-diamond';

  const formatCurrency = (amount) => {
    if (!amount) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
  };

  // Tính phần trăm tiến trình đến rank tiếp theo (nếu có thể)
  let nextRankTarget = 10000000;
  let nextRankName = "Bạc";
  if (profile.totalSpent >= 50000000) {
    nextRankTarget = profile.totalSpent; // Max rank
    nextRankName = "Max";
  } else if (profile.totalSpent >= 20000000) {
    nextRankTarget = 50000000;
    nextRankName = "Kim Cương";
  } else if (profile.totalSpent >= 10000000) {
    nextRankTarget = 20000000;
    nextRankName = "Vàng";
  }

  const progressPercent = profile.totalSpent >= 50000000 
    ? 100 
    : Math.min(100, Math.max(0, (profile.totalSpent / nextRankTarget) * 100));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.fullName.trim()) {
      alert('Vui lòng nhập họ và tên.');
      return;
    }
    
    try {
      setIsSaving(true);
      await api.put('/Profile', editForm);
      setProfile({ ...profile, ...editForm });
      setShowEditModal(false);
      alert('Cập nhật hồ sơ thành công!');
    } catch (err) {
      console.error('Lỗi khi cập nhật:', err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="profile-page-wrapper">
      <h2 className="profile-page-header">
        Hồ sơ của tôi
      </h2>
      <p className="profile-page-subtitle">
        Quản lý thông tin hồ sơ để bảo mật tài khoản
      </p>

      <div className="profile-cards-grid">
        {/* User Info Card */}
        <div className="user-profile-card">
          <div className="user-profile-cover"></div>
          
          <div className="user-profile-content">
            <div className="user-profile-avatar">
              <User size={36} color="#9ca3af" />
            </div>
            
            <h2 className="user-profile-name">{profile.fullName}</h2>
            
            <div className={`user-profile-rank-badge ${rankColor}`}>
              <Award size={18} />
              <span>{profile.rank || 'Thành viên'}</span>
            </div>
            
            <div className="user-profile-details">
              <div className="user-detail-row">
                <Mail className="user-detail-icon" size={20} />
                <div className="user-detail-info">
                  <p className="label">Email</p>
                  <p className="value">{profile.email}</p>
                </div>
              </div>
              <div className="user-detail-row">
                <Phone className="user-detail-icon" size={20} />
                <div className="user-detail-info">
                  <p className="label">Số điện thoại</p>
                  <p className="value">{profile.phoneNumber || 'Chưa cập nhật'}</p>
                </div>
              </div>
              <div className="user-detail-row">
                <MapPin className="user-detail-icon" size={20} />
                <div className="user-detail-info">
                  <p className="label">Địa chỉ</p>
                  <p className="value">{profile.address || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </div>
            
            <button 
              className="cps-btn-primary" 
              style={{ width: '100%', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={() => setShowEditModal(true)}
            >
              <Edit2 size={16} />
              Cập nhật tài khoản
            </button>
          </div>
        </div>

        {/* Rank Info Card */}
        <div className="rank-info-card">
          <h3 className="rank-info-title">
            <Shield size={24} />
            Thông tin hạng thành viên
          </h3>
          
          <div className="rank-spent-row">
            <span className="rank-spent-label">Chi tiêu tích luỹ:</span>
            <span className="rank-spent-value">{formatCurrency(profile.totalSpent)}</span>
          </div>
          
          {profile.totalSpent < 50000000 ? (
            <div className="rank-progress-container">
              <div className="rank-progress-bar-bg">
                <div className="rank-progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <p className="rank-target-text">
                Cần chi tiêu thêm <strong>{formatCurrency(nextRankTarget - profile.totalSpent)}</strong> để lên hạng <span className="rank-name">{nextRankName}</span>
              </p>
            </div>
          ) : (
            <div className="rank-max-badge">
              <Award size={48} />
              <p>Chúc mừng bạn đã đạt cấp bậc cao nhất của PhoneStore!</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal-content">
            <div className="profile-modal-header">
              <h3>Cập nhật Hồ sơ</h3>
              <button onClick={() => setShowEditModal(false)} className="profile-modal-close">
                <X size={20} />
              </button>
            </div>
            <div className="profile-modal-body">
              <form onSubmit={handleSaveProfile} className="profile-edit-form">
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input 
                    type="text" 
                    value={editForm.fullName} 
                    onChange={e => setEditForm({...editForm, fullName: e.target.value})} 
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input 
                    type="text" 
                    value={editForm.phoneNumber} 
                    onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} 
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className="form-group">
                  <label>Địa chỉ giao hàng</label>
                  <textarea 
                    value={editForm.address} 
                    onChange={e => setEditForm({...editForm, address: e.target.value})} 
                    placeholder="Nhập địa chỉ nhận hàng của bạn"
                    rows="3"
                  />
                </div>
                
                <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn-outline" onClick={() => setShowEditModal(false)} style={{ flex: 1 }}>
                    Hủy
                  </button>
                  <button type="submit" className="cps-btn-primary" disabled={isSaving} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Save size={16} />
                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
