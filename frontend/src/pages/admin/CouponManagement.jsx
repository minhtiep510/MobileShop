import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Save, Tag, Calendar, DollarSign, CheckCircle, XCircle, Award, ShoppingBag, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';
import '../../styles/CouponManagement.css';

export default function CouponManagement() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();
  const confirm = useConfirm();

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discountAmount: '',
    minimumOrderAmount: '',
    requiredRank: 'All',
    usageLimit: '',
    expirationDate: '',
    isActive: true
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/Coupon');
      if (Array.isArray(res.data)) {
        setCoupons(res.data);
      } else if (res.data?.items) {
        setCoupons(res.data.items);
      } else {
        setCoupons([]);
      }
    } catch (err) {
      console.error('Lỗi khi tải mã giảm giá:', err);
      toast.error('Không thể tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setEditingId(coupon.id);
      const expDate = coupon.expirationDate ? new Date(coupon.expirationDate).toISOString().slice(0, 16) : '';
      setFormData({
        code: coupon.code,
        discountAmount: coupon.discountAmount,
        minimumOrderAmount: coupon.minimumOrderAmount || 0,
        requiredRank: coupon.requiredRank || 'All',
        usageLimit: coupon.usageLimit || 0,
        expirationDate: expDate,
        isActive: coupon.isActive ?? true
      });
    } else {
      setEditingId(null);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      setFormData({
        code: '',
        discountAmount: '',
        minimumOrderAmount: 0,
        requiredRank: 'All',
        usageLimit: 0,
        expirationDate: futureDate.toISOString().slice(0, 16),
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.warning('Vui lòng nhập mã giảm giá');
      return;
    }
    if (!formData.discountAmount || Number(formData.discountAmount) <= 0) {
      toast.warning('Số tiền giảm giá phải lớn hơn 0');
      return;
    }
    if (!formData.expirationDate) {
      toast.warning('Vui lòng chọn ngày hết hạn');
      return;
    }

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discountAmount: Number(formData.discountAmount),
        minimumOrderAmount: Number(formData.minimumOrderAmount) || 0,
        requiredRank: formData.requiredRank || 'All',
        usageLimit: Number(formData.usageLimit) || 0,
        expirationDate: new Date(formData.expirationDate).toISOString(),
        isActive: formData.isActive
      };

      if (editingId) {
        await api.put(`/Coupon/${editingId}`, payload);
        toast.success('Cập nhật mã giảm giá thành công!');
      } else {
        await api.post('/Coupon', payload);
        toast.success('Thêm mã giảm giá thành công!');
      }
      setShowModal(false);
      fetchCoupons();
    } catch (err) {
      console.error('Lỗi lưu coupon:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  const handleDelete = async (id, code) => {
    const ok = await confirm({
      title: 'Xóa mã giảm giá',
      message: `Bạn có chắc chắn muốn xóa mã "${code}" không? Hành động này không thể hoàn tác.`,
      confirmLabel: 'Xóa',
      confirmType: 'danger'
    });

    if (!ok) return;

    try {
      await api.delete(`/Coupon/${id}`);
      toast.success('Đã xóa mã giảm giá!');
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Lỗi khi xóa:', err);
      toast.error(err.response?.data?.message || 'Không thể xóa mã giảm giá.');
    }
  };

  const filteredCoupons = coupons.filter(c =>
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isExpired = (dateStr) => {
    return new Date(dateStr) < new Date();
  };

  return (
    <div className="coupon-management">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Quản lý mã giảm giá</h1>
          <p className="admin-subtitle">Tạo và thiết lập các chương trình khuyến mãi cho khách hàng</p>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} /> Thêm mã mới
        </button>
      </div>

      {/* Toolbar tìm kiếm & thống kê */}
      <div className="coupon-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã coupon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="coupon-count-badge">
          Tổng số: <strong>{coupons.length}</strong> mã
        </div>
      </div>

      {/* Bảng danh sách coupon */}
      <div className="table-responsive coupon-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mã giảm giá</th>
              <th>Số tiền giảm</th>
              <th>Đơn tối thiểu</th>
              <th>Hạng áp dụng</th>
              <th>Ngày hết hạn</th>
              <th>Trạng thái</th>
              <th className="text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-6">
                  <div className="loader inline-block"></div>
                </td>
              </tr>
            ) : filteredCoupons.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-muted">
                  {searchTerm ? 'Không tìm thấy mã giảm giá phù hợp' : 'Chưa có mã giảm giá nào'}
                </td>
              </tr>
            ) : (
              filteredCoupons.map((coupon) => {
                const expired = isExpired(coupon.expirationDate);
                const rankClass = `badge-rank badge-rank-${coupon.requiredRank?.toLowerCase() || 'all'}`;
                return (
                  <tr key={coupon.id} className={expired ? 'coupon-row-expired' : ''}>
                    <td>#{coupon.id}</td>
                    <td>
                      <div className="coupon-code-pill">
                        <Tag size={14} />
                        <span>{coupon.code}</span>
                      </div>
                    </td>
                    <td>
                      <span className="coupon-discount-text">
                        -{new Intl.NumberFormat('vi-VN').format(coupon.discountAmount)} đ
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.9rem', color: '#555' }}>
                        {coupon.minimumOrderAmount > 0 
                          ? `${new Intl.NumberFormat('vi-VN').format(coupon.minimumOrderAmount)} đ`
                          : '0 đ'}
                      </span>
                    </td>
                    <td>
                      <span className={rankClass}>
                        {coupon.requiredRank === 'All' ? 'Tất cả' : coupon.requiredRank}
                      </span>
                    </td>
                    <td>
                      <div className="coupon-date-wrap">
                        <Calendar size={14} />
                        <span>{new Date(coupon.expirationDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </td>
                    <td>
                      {expired ? (
                        <span className="badge-status badge-expired">
                          <XCircle size={13} /> Đã hết hạn
                        </span>
                      ) : coupon.isActive ? (
                        <span className="badge-status badge-active">
                          <CheckCircle size={13} /> Đang hoạt động
                        </span>
                      ) : (
                        <span className="badge-status badge-inactive">
                          <XCircle size={13} /> Tạm khóa
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="table-actions">
                        <button
                          className="action-btn edit"
                          title="Chỉnh sửa"
                          onClick={() => handleOpenModal(coupon)}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="action-btn delete"
                          title="Xóa"
                          onClick={() => handleDelete(coupon.id, coupon.code)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm / Sửa Coupon chuẩn Admin */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content large">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{editingId ? 'Chỉnh sửa mã giảm giá' : 'Thêm mã giảm giá mới'}</h2>
              <button className="admin-modal-close" onClick={() => setShowModal(false)} type="button">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Mã Coupon (Code) *</label>
                    <div className="input-with-icon">
                      <Tag size={16} className="field-icon" />
                      <input
                        type="text"
                        className="admin-form-input code-input"
                        placeholder="VD: GIAM100K, VIP2026..."
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        required
                      />
                    </div>
                    <small className="form-hint">Mã sẽ tự động viết hoa (VD: APPLE50K)</small>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Số tiền giảm (VNĐ) *</label>
                    <div className="input-with-icon">
                      <DollarSign size={16} className="field-icon" />
                      <input
                        type="number"
                        className="admin-form-input"
                        placeholder="VD: 50000"
                        value={formData.discountAmount}
                        onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                        min="1000"
                        step="1000"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Đơn hàng tối thiểu (VNĐ)</label>
                    <div className="input-with-icon">
                      <ShoppingBag size={16} className="field-icon" />
                      <input
                        type="number"
                        className="admin-form-input"
                        placeholder="0 = Không yêu cầu"
                        value={formData.minimumOrderAmount}
                        onChange={(e) => setFormData({ ...formData, minimumOrderAmount: e.target.value })}
                        min="0"
                        step="10000"
                      />
                    </div>
                    <small className="form-hint">Đơn hàng phải đạt giá trị này mới được áp mã</small>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Hạng thành viên áp dụng</label>
                    <div className="input-with-icon">
                      <Award size={16} className="field-icon" />
                      <select
                        className="admin-form-select"
                        value={formData.requiredRank}
                        onChange={(e) => setFormData({ ...formData, requiredRank: e.target.value })}
                      >
                        <option value="All">Tất cả khách hàng</option>
                        <option value="Silver">Hạng Bạc (Silver) trở lên</option>
                        <option value="Gold">Hạng Vàng (Gold) trở lên</option>
                        <option value="Diamond">Hạng Kim Cương (Diamond)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Ngày & Giờ hết hạn *</label>
                    <div className="input-with-icon">
                      <Calendar size={16} className="field-icon" />
                      <input
                        type="datetime-local"
                        className="admin-form-input"
                        value={formData.expirationDate}
                        onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="admin-form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '1.8rem' }}>
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      <span className="toggle-text">Kích hoạt mã ngay sau khi lưu</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  <Save size={18} /> {editingId ? 'Cập nhật' : 'Tạo mã'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
