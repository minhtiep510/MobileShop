import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, GraduationCap, Briefcase, MapPin, Package, Gift, Edit2, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import '../../styles/Profile.css';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();

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

        // Fetch total orders
        const ordersRes = await api.get('/Order/my-orders');
        if (ordersRes.data && ordersRes.data.items) {
          setTotalOrders(ordersRes.data.totalCount || ordersRes.data.items.length);
        } else if (Array.isArray(ordersRes.data)) {
          setTotalOrders(ordersRes.data.length);
        }
      } catch (err) {
        console.error('Lỗi lấy thông tin:', err);
        setError('Không thể lấy thông tin người dùng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.fullName.trim()) {
      toast.warning('Vui lòng nhập họ và tên.');
      return;
    }
    
    try {
      setIsSaving(true);
      await api.put('/Profile', editForm);
      setProfile({ ...profile, ...editForm });
      setShowEditModal(false);
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (err) {
      console.error('Lỗi khi cập nhật:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="loader inline-block" style={{ borderTopColor: '#0071e3', width: '30px', height: '30px', animation: 'spin 1s linear infinite', border: '3px solid #f0f0f0', borderRadius: '50%' }}></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-danger">{error || 'Không tìm thấy người dùng'}</h2>
      </div>
    );
  }

  // Get initials for Avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Tính phần trăm tiến trình đến rank tiếp theo
  let nextRankTarget = 5000000;
  let rankLabel = profile.rank || 'S-NULL';
  
  if (profile.totalSpent >= 50000000) {
    nextRankTarget = profile.totalSpent;
    rankLabel = 'S-DIAMOND';
  } else if (profile.totalSpent >= 20000000) {
    nextRankTarget = 50000000;
    rankLabel = 'S-GOLD';
  } else if (profile.totalSpent >= 10000000) {
    nextRankTarget = 20000000;
    rankLabel = 'S-SILVER';
  } else if (profile.totalSpent >= 5000000) {
    nextRankTarget = 10000000;
    rankLabel = 'S-BRONZE';
  }

  const progressPercent = profile.totalSpent >= 50000000 
    ? 100 
    : Math.min(100, Math.max(0, (profile.totalSpent / nextRankTarget) * 100));
    
  const remainingToNextRank = Math.max(0, nextRankTarget - profile.totalSpent);

  return (
    <div className="profile-dashboard">
      
      {/* Row 1 */}
      <div className="profile-row-1">
        {/* User Card */}
        <div className="card-white profile-user-card">
          <div className="profile-avatar">{getInitials(profile.fullName)}</div>
          <h2 className="profile-name">{profile.fullName || 'Người dùng'}</h2>
          <div className="profile-phone">{profile.phoneNumber || 'Chưa cập nhật SĐT'}</div>
          <div className="profile-rank-badge">Hạng thành viên: {rankLabel}</div>
          <div className="profile-last-update">
            <RefreshCw size={12} /> Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>

        {/* Stats Card */}
        <div className="card-white profile-stats-card">
          <div className="stats-grid">
            <div>
              <div className="stat-item-label">TỔNG SỐ ĐƠN HÀNG</div>
              <div className="stat-item-value">{totalOrders}</div>
            </div>
            <div>
              <div className="stat-item-label">TỔNG TIỀN TÍCH LŨY</div>
              <div className="stat-item-value blue">{new Intl.NumberFormat('vi-VN').format(profile.totalSpent || 0)}đ</div>
            </div>
          </div>
          
          <div className="rank-progress-container">
            <div className="rank-progress-header">
              <div className="rank-progress-title">Tiến trình lên hạng</div>
              <div className="rank-progress-amounts">
                {new Intl.NumberFormat('vi-VN').format(profile.totalSpent || 0)} / {new Intl.NumberFormat('vi-VN').format(nextRankTarget)}đ
              </div>
            </div>
            <div className="progress-track">
              <div className="progress-fill active" style={{ width: `${progressPercent}%` }}></div>
            </div>
            {remainingToNextRank > 0 && (
              <div className="rank-progress-note">Bạn cần tích lũy thêm {new Intl.NumberFormat('vi-VN').format(remainingToNextRank)}đ để thăng hạng.</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="profile-row-2">
        <Link to="#" className="banner-card banner-blue">
          <div className="banner-content">
            <h3>S-Student</h3>
            <p>Ưu đãi dành cho Sinh viên</p>
          </div>
          <GraduationCap className="banner-icon" />
        </Link>
        <Link to="#" className="banner-card banner-red">
          <div className="banner-content">
            <h3>S-Business</h3>
            <p>Giải pháp cho doanh nghiệp</p>
          </div>
          <Briefcase className="banner-icon" />
        </Link>
        <div className="banner-card banner-black" onClick={() => setShowEditModal(true)}>
          <div className="banner-content">
            <h3>Địa chỉ nhận hàng</h3>
            <p>Thêm/Sửa địa chỉ giao hàng</p>
          </div>
          <MapPin className="banner-icon" />
        </div>
      </div>

      {/* Row 3 */}
      <div className="profile-row-3">
        <Link to="/account/orders" className="feature-card">
          <div className="feature-icon-wrapper red">
            <span style={{ fontWeight: '900', fontStyle: 'italic', color: '#fff', fontSize: '2.5rem' }}>ORDERS</span>
          </div>
          <h3>Đơn hàng gần đây</h3>
          <p>Xem danh sách các đơn hàng của bạn</p>
        </Link>
        <Link to="#" className="feature-card">
          <div className="feature-icon-wrapper black">
            <Gift size={40} />
          </div>
          <h3>Ưu đãi của bạn</h3>
          <p>Khám phá các Voucher đang có sẵn</p>
        </Link>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal-content">
            <div className="profile-modal-header">
              <h2 className="profile-modal-title">Cập nhật thông tin</h2>
              <button className="profile-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveProfile}>
              <div className="profile-form-group">
                <label className="profile-form-label">Họ và tên</label>
                <input 
                  type="text" 
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({...editForm, fullName: e.target.value})}
                  className="profile-form-input" 
                  required
                />
              </div>
              <div className="profile-form-group">
                <label className="profile-form-label">Số điện thoại</label>
                <input 
                  type="text" 
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
                  className="profile-form-input" 
                />
              </div>
              <div className="profile-form-group">
                <label className="profile-form-label">Địa chỉ</label>
                <input 
                  type="text" 
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  className="profile-form-input" 
                />
              </div>
              <div className="profile-form-actions">
                <button type="button" className="profile-btn-cancel" onClick={() => setShowEditModal(false)} disabled={isSaving}>Hủy</button>
                <button type="submit" className="profile-btn-save" disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
