import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Shield, User } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeoutRef = React.useRef(null);
  const toast = useToast();

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    role: 'customer'
  });

  const fetchUsers = async (page = currentPage, search = searchTerm) => {
    try {
      setLoading(true);
      const url = search 
        ? `/User?page=${page}&pageSize=10&searchTerm=${encodeURIComponent(search)}` 
        : `/User?page=${page}&pageSize=10`;
      const res = await api.get(url);
      if (res.data && res.data.items) {
        setUsers(res.data.items);
        setTotalPages(res.data.totalPages || 1);
      } else if (Array.isArray(res.data)) {
        setUsers(res.data);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Lỗi khi tải người dùng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchUsers(currentPage, searchTerm);
    }, 400);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [currentPage, searchTerm]);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        role: user.role || 'customer'
      });
    } else {
      setEditingId(null);
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        address: '',
        role: 'customer'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/User/${editingId}`, formData);
        toast.success('Cập nhật người dùng thành công!');
      } else {
        await api.post('/User', formData);
        toast.success('Thêm người dùng thành công!');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      console.error('Lỗi khi lưu người dùng:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này?')) return;
    try {
      await api.delete(`/User/${id}`);
      fetchUsers();
      toast.success('Xóa người dùng thành công!');
    } catch (err) {
      console.error('Lỗi khi xóa:', err);
      toast.error('Không thể xóa người dùng này.');
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Quản lý Người dùng</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} />
          Thêm người dùng
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-search-box">
            <Search className="admin-search-icon" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm tên, email, sđt..."
              className="admin-search-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
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
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Quyền hạn</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không có người dùng nào.</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>

                      <td><strong>{user.fullName}</strong></td>
                      <td>{user.email}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{user.phoneNumber || 'N/A'}</td>
                      <td>
                        <span className={`admin-badge badge-${user.role?.toLowerCase() === 'admin' ? 'purple' : 'blue'}`}>
                          {user.role?.toLowerCase() === 'admin' ? <Shield size={12} /> : <User size={12} />}
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button className="action-btn edit" onClick={() => handleOpenModal(user)} title="Sửa">
                            <Edit size={18} />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(user.id)} title="Xóa">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="admin-pagination">
                <button 
                  className="page-btn" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  &laquo;
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i + 1} 
                    className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button 
                  className="page-btn" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  &raquo;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">{editingId ? 'Cập nhật Người dùng' : 'Thêm Người dùng mới'}</h2>
              <button onClick={() => setShowModal(false)} className="admin-modal-close">
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>&times;</span>
              </button>
            </div>

            <div className="admin-modal-body">
              <form id="userForm" onSubmit={handleSubmit}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Họ và tên *</label>
                  <input
                    type="text" required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="admin-form-input"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Email *</label>
                  <input
                    type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="admin-form-input"
                    disabled={!!editingId}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Số điện thoại</label>
                  <input
                    type="tel" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="admin-form-input"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Địa chỉ</label>
                  <input
                    type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="admin-form-input"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Quyền hạn *</label>
                  <select
                    required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="admin-form-select"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="admin-modal-footer">
              <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Hủy</button>
              <button type="submit" form="userForm" className="btn-primary">{editingId ? 'Cập nhật' : 'Thêm mới'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
