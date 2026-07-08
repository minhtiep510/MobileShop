import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Trash2 } from 'lucide-react';
import api from '../../services/api';

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/Order?page=1&pageSize=50');
      if (res.data && res.data.items) {
        setOrders(res.data.items);
      } else if (Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/Order/${id}/status`, `"${status}"`, {
        headers: { 'Content-Type': 'application/json' }
      });
      alert('Cập nhật trạng thái thành công!');
      fetchOrders();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      alert('Không thể cập nhật trạng thái.');
    }
  };

  const handleUpdatePaymentStatus = async (id, status) => {
    try {
      await api.put(`/Order/${id}/payment-status`, `"${status}"`, {
        headers: { 'Content-Type': 'application/json' }
      });
      alert('Cập nhật trạng thái thanh toán thành công!');
      fetchOrders();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: status });
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái thanh toán:', err);
      alert('Không thể cập nhật trạng thái thanh toán.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa đơn hàng này? Việc này không thể hoàn tác!')) return;
    try {
      await api.delete(`/Order/${id}`);
      fetchOrders();
      alert('Xóa đơn hàng thành công!');
    } catch (err) {
      console.error('Lỗi khi xóa:', err);
      alert('Không thể xóa đơn hàng này.');
    }
  };

  const openOrderDetail = async (id) => {
    try {
      const res = await api.get(`/Order/${id}`);
      setSelectedOrder(res.data);
      setShowModal(true);
    } catch (err) {
      console.error('Lỗi lấy chi tiết đơn hàng:', err);
      alert('Không thể tải chi tiết đơn hàng.');
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
              placeholder="Tìm kiếm đơn hàng..."
              className="admin-search-input"
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
                  <p style={{ marginBottom: '0.5rem' }}><span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '120px' }}>Khách hàng:</span> <strong>{selectedOrder.customerName}</strong></p>
                  <p style={{ marginBottom: '0.5rem' }}><span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '120px' }}>Số điện thoại:</span> {selectedOrder.phone}</p>
                  <p style={{ marginBottom: '0.5rem' }}><span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '120px' }}>Địa chỉ:</span> {selectedOrder.shippingAddress}</p>
                  <p style={{ marginBottom: '0.5rem' }}><span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '120px' }}>Ngày đặt:</span> {new Date(selectedOrder.orderDate).toLocaleString('vi-VN')}</p>
                </div>
                <div>
                  <h3 className="admin-variant-title" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Thông tin thanh toán</h3>
                  <p style={{ marginBottom: '0.5rem' }}><span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '120px' }}>Phương thức:</span> {selectedOrder.paymentMethod}</p>

                  <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '120px' }}>TT Thanh toán:</span>
                    <select
                      value={selectedOrder.paymentStatus}
                      onChange={(e) => handleUpdatePaymentStatus(selectedOrder.id, e.target.value)}
                      className="admin-form-select"
                      style={{ padding: '0.25rem 0.5rem', width: 'auto' }}
                    >
                      <option value="Unpaid">Unpaid (Chưa thanh toán)</option>
                      <option value="Paid">Paid (Đã thanh toán)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'inline-block', width: '120px' }}>TT Giao hàng:</span>
                    <select
                      value={selectedOrder.status?.toLowerCase() || 'pending'}
                      onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                      disabled={selectedOrder.status?.toLowerCase() === 'delivered' || selectedOrder.status?.toLowerCase() === 'cancelled'}
                      className="admin-form-select"
                      style={{
                        padding: '0.25rem 0.5rem',
                        width: 'auto',
                        cursor: (selectedOrder.status?.toLowerCase() === 'delivered' || selectedOrder.status?.toLowerCase() === 'cancelled') ? 'not-allowed' : 'pointer',
                        opacity: (selectedOrder.status?.toLowerCase() === 'delivered' || selectedOrder.status?.toLowerCase() === 'cancelled') ? 0.7 : 1
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
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
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{[item.color, item.capacity].filter(Boolean).join(' - ')}</p>
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
                    <td style={{ textAlign: 'right', fontWeight: '700', fontSize: '1.25rem', color: 'var(--primary)' }}>
                      <h2 style={{ color: 'var(--primary)', margin: 0 }}>
                        {new Intl.NumberFormat('vi-VN').format(selectedOrder.totalAmount)} đ
                      </h2>
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
