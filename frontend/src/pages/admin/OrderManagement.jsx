import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../components/ConfirmDialog';

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeoutRef = React.useRef(null);
  const toast = useToast();
  const confirm = useConfirm();

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async (page = currentPage, search = searchTerm) => {
    try {
      setLoading(true);
      const url = search 
        ? `/Order?page=${page}&pageSize=10&searchTerm=${encodeURIComponent(search)}` 
        : `/Order?page=${page}&pageSize=10`;
      const res = await api.get(url);
      if (res.data && res.data.items) {
        setOrders(res.data.items);
        setTotalPages(res.data.totalPages || 1);
      } else if (Array.isArray(res.data)) {
        setOrders(res.data);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Lỗi khi tải đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchOrders(currentPage, searchTerm);
    }, 400);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [currentPage, searchTerm]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/Order/${id}/status`, `"${status}"`, {
        headers: { 'Content-Type': 'application/json' }
      });
      toast.success('Cập nhật trạng thái thành công!');
      fetchOrders();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      toast.error('Không thể cập nhật trạng thái.');
    }
  };

  const handleUpdatePaymentStatus = async (id, status) => {
    try {
      await api.put(`/Order/${id}/payment-status`, `"${status}"`, {
        headers: { 'Content-Type': 'application/json' }
      });
      toast.success('Cập nhật trạng thái thanh toán thành công!');
      fetchOrders();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: status });
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái thanh toán:', err);
      toast.error('Không thể cập nhật trạng thái thanh toán.');
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Xóa đơn hàng',
      message: 'Bạn có chắc muốn xóa đơn hàng này? Việc này không thể hoàn tác!',
      confirmLabel: 'Xóa',
      confirmType: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/Order/${id}`);
      fetchOrders();
      toast.success('Xóa đơn hàng thành công!');
    } catch (err) {
      console.error('Lỗi khi xóa:', err);
      toast.error('Không thể xóa đơn hàng này.');
    }
  };

  const openOrderDetail = async (id) => {
    try {
      const res = await api.get(`/Order/${id}`);
      setSelectedOrder(res.data);
      setShowModal(true);
    } catch (err) {
      console.error('Lỗi lấy chi tiết đơn hàng:', err);
      toast.error('Không thể tải chi tiết đơn hàng.');
    }
  };

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Quản lý Đơn hàng</h1>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-search-box">
            <Search className="admin-search-icon" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm mã ĐH, KH, SĐT..."
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
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Khách hàng</th>
                  <th>SĐT</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không có đơn hàng nào.</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ color: 'var(--text-muted)' }}>DH-{order.id}</td>
                      <td><strong>{order.customerName || 'N/A'}</strong></td>
                      <td>{order.phone || 'N/A'}</td>
                      <td>{new Date(order.orderDate || order.date).toLocaleString('vi-VN')}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: '600' }}>
                        {new Intl.NumberFormat('vi-VN').format(order.totalAmount || 0)} đ
                      </td>
                      <td>
                        <select
                          value={order.status?.toLowerCase() || 'pending'}
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          disabled={order.status?.toLowerCase() === 'delivered' || order.status?.toLowerCase() === 'cancelled'}
                          className={`admin-badge badge-${order.status?.toLowerCase() === 'pending' ? 'yellow' :
                              order.status?.toLowerCase() === 'processing' ? 'blue' :
                                order.status?.toLowerCase() === 'shipped' ? 'blue' :
                                  order.status?.toLowerCase() === 'delivered' ? 'green' :
                                    order.status?.toLowerCase() === 'cancelled' ? 'red' : 'gray'
                            }`}
                          style={{
                            border: 'none',
                            cursor: (order.status?.toLowerCase() === 'delivered' || order.status?.toLowerCase() === 'cancelled') ? 'not-allowed' : 'pointer',
                            outline: 'none',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontWeight: '600',
                            opacity: (order.status?.toLowerCase() === 'delivered' || order.status?.toLowerCase() === 'cancelled') ? 0.8 : 1
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button className="action-btn view" onClick={() => openOrderDetail(order.id)} title="Xem chi tiết">
                            <Eye size={18} />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(order.id)} title="Xóa đơn hàng">
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

      {/* Order Detail Modal */}
      {showModal && selectedOrder && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content large">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Chi tiết đơn hàng DH-{selectedOrder.id}</h2>
              <button onClick={() => setShowModal(false)} className="admin-modal-close">
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>&times;</span>
              </button>
            </div>

            <div className="admin-modal-body">
              <div className="admin-form-row">
                <div>
                  <h3 className="admin-variant-title" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Thông tin khách hàng</h3>
                  <p style={{ marginBottom: '0.5rem', display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-muted)', flexShrink: 0, width: '120px' }}>Khách hàng:</span> <strong>{selectedOrder.customerName}</strong></p>
                  <p style={{ marginBottom: '0.5rem', display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-muted)', flexShrink: 0, width: '120px' }}>Số điện thoại:</span> {selectedOrder.phone}</p>
                  <p style={{ marginBottom: '0.5rem', display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-muted)', flexShrink: 0, width: '120px' }}>Địa chỉ:</span> <span>{selectedOrder.shippingAddress}</span></p>
                  <p style={{ marginBottom: '0.5rem', display: 'flex', gap: '8px' }}><span style={{ color: 'var(--text-muted)', flexShrink: 0, width: '120px' }}>Ngày đặt:</span> {new Date(selectedOrder.orderDate).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <h3 className="admin-variant-title" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Thông tin thanh toán</h3>
                  <p style={{ marginBottom: '0.5rem' }}><span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '120px' }}>Phương thức:</span> {selectedOrder.paymentMethod}</p>

                  <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '120px' }}>TT Thanh toán:</span>
                    {selectedOrder.paymentStatus === 'Paid' ? (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(52,199,89,0.12)',
                        color: '#34c759',
                        borderRadius: '20px',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        ✓ Đã thanh toán
                      </span>
                    ) : (
                      <select
                        value={selectedOrder.paymentStatus}
                        onChange={(e) => handleUpdatePaymentStatus(selectedOrder.id, e.target.value)}
                        className="admin-form-select"
                        style={{ padding: '0.25rem 0.5rem', width: 'auto' }}
                      >
                        <option value="Unpaid">Unpaid (Chưa thanh toán)</option>
                        <option value="Paid">Paid (Đã thanh toán)</option>
                      </select>
                    )}
                  </div>

                  <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '120px' }}>TT Giao hàng:</span>
                    {['delivered', 'cancelled'].includes(selectedOrder.status?.toLowerCase()) ? (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: selectedOrder.status?.toLowerCase() === 'delivered'
                          ? 'rgba(52,199,89,0.12)' : 'rgba(255,59,48,0.12)',
                        color: selectedOrder.status?.toLowerCase() === 'delivered' ? '#34c759' : '#ff3b30',
                        borderRadius: '20px',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {selectedOrder.status?.toLowerCase() === 'delivered' ? '✓ Đã giao hàng' : '✕ Đã hủy'}
                      </span>
                    ) : (
                      <select
                        value={selectedOrder.status?.toLowerCase() || 'pending'}
                        onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                        className="admin-form-select"
                        style={{ padding: '0.25rem 0.5rem', width: 'auto' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <h3 className="admin-variant-title" style={{ marginTop: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Sản phẩm đã đặt</h3>
              <table className="admin-table" style={{ marginTop: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th style={{ textAlign: 'center' }}>Đơn giá</th>
                    <th style={{ textAlign: 'center' }}>SL</th>
                    <th style={{ textAlign: 'right' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex-center">
                          <Link to={`/product/${item.productId}`}>
                            <img src={item.productImage || 'https://via.placeholder.com/40'} alt={item.productName} className="admin-thumbnail" style={{ cursor: 'pointer' }} />
                          </Link>
                          <div>
                            <p style={{ fontWeight: '600' }}>
                              <Link to={`/product/${item.productId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                {item.productName}
                              </Link>
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {item.sku}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{[item.color, item.size].filter(Boolean).join(' - ')}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{new Intl.NumberFormat('vi-VN').format(item.price)} đ</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--primary)' }}>
                        {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'right', fontWeight: '700', fontSize: '1.1rem' }}>Tổng cộng:</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '1.25rem', color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                      {new Intl.NumberFormat('vi-VN').format(selectedOrder.totalAmount)} đ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="admin-modal-footer">
              <button onClick={() => setShowModal(false)} className="btn-primary">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
