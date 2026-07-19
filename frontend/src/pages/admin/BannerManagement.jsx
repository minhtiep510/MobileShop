import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, Image, ToggleLeft, ToggleRight } from 'lucide-react';
import api, { API_BASE_URL } from '../../services/api';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';

export default function BannerManagement() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    isActive: true,
    displayOrder: 0
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get('/Banner');
      setBanners(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Lỗi khi tải banner:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setEditingId(banner.id);
      setFormData({
        title: banner.title || '',
        imageUrl: banner.imageUrl || '',
        linkUrl: banner.linkUrl || '',
        isActive: banner.isActive,
        displayOrder: banner.displayOrder || 0
      });
    } else {
      setEditingId(null);
      setFormData({ title: '', imageUrl: '', linkUrl: '', isActive: true, displayOrder: 0 });
    }
    setShowModal(true);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/Upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData(prev => ({ ...prev, imageUrl: res.data.url }));
    } catch (err) {
      toast.error('Upload ảnh thất bại!');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imageUrl) { toast.warning('Vui lòng chọn ảnh banner!'); return; }
    try {
      if (editingId) {
        await api.put(`/Banner/${editingId}`, formData);
        toast.success('Cập nhật banner thành công!');
      } else {
        await api.post('/Banner', formData);
        toast.success('Thêm banner thành công!');
      }
      setShowModal(false);
      fetchBanners();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra!');
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Xóa banner',
      message: 'Bạn có chắc muốn xóa banner này?',
      confirmLabel: 'Xóa',
      confirmType: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/Banner/${id}`);
      fetchBanners();
    } catch (err) {
      toast.error('Không thể xóa banner!');
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      await api.put(`/Banner/${banner.id}`, { ...banner, isActive: !banner.isActive });
      fetchBanners();
    } catch (err) {
      toast.error('Có lỗi xảy ra!');
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Quản lý Banner</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} /> Thêm banner
        </button>
      </div>

      <div className="admin-card">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải...</div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tiêu đề</th>
                  <th>Link</th>
                  <th>Thứ tự</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {banners.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      Chưa có banner nào. Hãy thêm banner đầu tiên!
                    </td>
                  </tr>
                ) : (
                  banners.map(banner => (
                    <tr key={banner.id}>
                      <td>
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          style={{ width: 120, height: 48, objectFit: 'cover', borderRadius: 6, background: '#f5f5f7' }}
                          onError={e => { e.target.src = 'https://via.placeholder.com/120x48'; }}
                        />
                      </td>
                      <td><strong>{banner.title || '-'}</strong></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {banner.linkUrl || '-'}
                      </td>
                      <td>{banner.displayOrder}</td>
                      <td>
                        <button
                          onClick={() => handleToggleActive(banner)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: banner.isActive ? '#34c759' : '#86868b' }}
                          title={banner.isActive ? 'Đang hiển thị - Click để ẩn' : 'Đang ẩn - Click để hiện'}
                        >
                          {banner.isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </button>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button className="action-btn edit" onClick={() => handleOpenModal(banner)} title="Sửa">
                            <Edit size={18} />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(banner.id)} title="Xóa">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content" style={{ maxWidth: 560 }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{editingId ? 'Cập nhật Banner' : 'Thêm Banner mới'}</h2>
              <button onClick={() => setShowModal(false)} className="admin-modal-close">
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>&times;</span>
              </button>
            </div>
            <div className="admin-modal-body">
              <form id="bannerForm" onSubmit={handleSubmit}>
                {/* Image upload */}
                <div className="admin-form-group">
                  <label className="admin-form-label">Ảnh Banner *</label>
                  {formData.imageUrl && (
                    <img
                      src={formData.imageUrl}
                      alt="preview"
                      style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                    />
                  )}
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 16px', border: '2px dashed #d2d2d7', borderRadius: 8,
                    cursor: 'pointer', color: '#86868b', fontSize: '0.9rem'
                  }}>
                    <Image size={18} />
                    {uploading ? 'Đang upload...' : 'Chọn ảnh từ máy tính'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
                  </label>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Tiêu đề</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ví dụ: iPhone 16 - Đổi mới hoàn toàn"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Link khi click (tuỳ chọn)</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.linkUrl}
                    onChange={e => setFormData({ ...formData, linkUrl: e.target.value })}
                    placeholder="Ví dụ: /category/1 hoặc https://..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Thứ tự hiển thị</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      value={formData.displayOrder}
                      onChange={e => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Trạng thái</label>
                    <select
                      className="admin-form-input"
                      value={formData.isActive ? 'true' : 'false'}
                      onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    >
                      <option value="true">Hiển thị</option>
                      <option value="false">Ẩn</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div className="admin-modal-footer">
              <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Hủy</button>
              <button type="submit" form="bannerForm" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} disabled={uploading}>
                <Save size={18} />
                {editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
