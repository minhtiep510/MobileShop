import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Save } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeoutRef = React.useRef(null);
  const toast = useToast();
  const confirm = useConfirm();
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const fetchCategories = async (search = searchTerm) => {
    try {
      setLoading(true);
      const url = search 
        ? `/Category?page=1&pageSize=100&searchTerm=${encodeURIComponent(search)}` 
        : '/Category?page=1&pageSize=100';
      const res = await api.get(url);
      if (res.data && res.data.items) {
        setCategories(res.data.items);
      } else if (Array.isArray(res.data)) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh mục:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchCategories(searchTerm);
    }, 400);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchTerm]);

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        name: category.name,
        description: category.description || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/Category/${editingId}`, formData);
        toast.success('Cập nhật danh mục thành công!');
      } else {
        await api.post('/Category', formData);
        toast.success('Thêm danh mục thành công!');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      console.error('Lỗi khi lưu danh mục:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Xóa danh mục',
      message: 'Bạn có chắc muốn xóa danh mục này? Hệ thống có thể không cho phép xóa nếu danh mục đang chứa sản phẩm.',
      confirmLabel: 'Xóa',
      confirmType: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/Category/${id}`);
      fetchCategories();
      toast.success('Xóa danh mục thành công!');
    } catch (err) {
      console.error('Lỗi khi xóa:', err);
      toast.error(err.response?.data?.message || 'Không thể xóa danh mục này.');
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Quản lý Danh mục</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} />
          Thêm danh mục
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-search-box">
            <Search className="admin-search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm danh mục..." 
              className="admin-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="loader inline-block" style={{ 
              border: '3px solid var(--background)', 
              borderTop: '3px solid var(--primary)', 
              borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' 
            }}></div>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tên danh mục</th>
                  <th>Mô tả</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không có danh mục nào.</td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id}>
                      <td><strong>{category.name}</strong></td>
                      <td style={{ color: 'var(--text-muted)' }}>{category.description || '-'}</td>
                      <td>
                        <div className="admin-actions">
                          <button className="action-btn edit" onClick={() => handleOpenModal(category)} title="Sửa danh mục">
                            <Edit size={18} />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(category.id)} title="Xóa danh mục">
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

      {/* Category Modal */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content" style={{ maxWidth: '500px' }}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{editingId ? 'Cập nhật Danh mục' : 'Thêm Danh mục mới'}</h2>
              <button onClick={() => setShowModal(false)} className="admin-modal-close">
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>&times;</span>
              </button>
            </div>
            
            <div className="admin-modal-body">
              <form id="categoryForm" onSubmit={handleSubmit}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Tên danh mục *</label>
                  <input 
                    type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="admin-form-input"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Mô tả</label>
                  <textarea 
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                    className="admin-form-textarea"
                    rows="4"
                  />
                </div>
              </form>
            </div>

            <div className="admin-modal-footer">
              <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Hủy</button>
              <button type="submit" form="categoryForm" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
