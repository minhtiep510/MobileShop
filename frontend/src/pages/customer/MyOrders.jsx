import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import './MyOrders.css';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await api.get('/Order/my-orders');
        if (response.data && response.data.items) {
          setOrders(response.data.items);
        } else if (Array.isArray(response.data)) {
          setOrders(response.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải đơn hàng:', err);
        setError('Không thể tải danh sách đơn hàng.');
      } finally {
        setLoading(false);
      }
    };

    if (localStorage.getItem('token')) {
      fetchOrders();
    } else {
      navigate('/auth');
    }
  }, [navigate]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không? Việc này không thể hoàn tác.')) {
      return;
    }
    try {
      await api.put(`/Order/${orderId}/cancel`);
      alert('Hủy đơn hàng thành công!');
      // Reload orders
      const response = await api.get('/Order/my-orders');
      if (response.data && response.data.items) {
        setOrders(response.data.items);
      } else if (Array.isArray(response.data)) {
        setOrders(response.data);
      }
    } catch (err) {
      console.error('Lỗi khi hủy đơn hàng:', err);
      alert(err.response?.data?.message || 'Không thể hủy đơn hàng.');
    }
  };

  const getStatusDisplay = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return { text: 'Đang xử lý', class: 'status-pending', icon: <Clock size={14} /> };
      case 'processing': return { text: 'Đang chuẩn bị', class: 'status-processing', icon: <Package size={14} /> };
      case 'shipped': return { text: 'Đang giao', class: 'status-shipped', icon: <Package size={14} /> };
      case 'delivered': return { text: 'Hoàn thành', class: 'status-delivered', icon: <CheckCircle size={14} /> };
      case 'cancelled': return { text: 'Đã hủy', class: 'status-cancelled', icon: <XCircle size={14} /> };
      default: return { text: status || 'Mới', class: 'status-pending', icon: <Clock size={14} /> };
    }
  };

  if (loading) {
    return (
      <div className="my-orders-page flex justify-center items-center h-64">
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-orders-page text-center py-16">
        <h2 className="text-2xl font-bold text-danger mb-4">Lỗi</h2>
        <p className="text-text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="my-orders-page" style={{ padding: '20px' }}>
      <div className="orders-header" style={{ marginBottom: '20px' }}>
        <h1 className="orders-title">Đơn hàng của tôi</h1>
      </div>
      
      {/* Status Filter Tabs */}
      <div className="order-status-tabs" style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px', 
        overflowX: 'auto',
        paddingBottom: '5px'
      }}>
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'pending', label: 'Đang xử lý' },
          { id: 'processing', label: 'Đang chuẩn bị' },
          { id: 'shipped', label: 'Đang giao' },
          { id: 'delivered', label: 'Hoàn thành' },
          { id: 'cancelled', label: 'Đã hủy' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: activeTab === tab.id ? 'none' : '1px solid #e5e5ea',
              background: activeTab === tab.id ? '#0071e3' : '#fff',
              color: activeTab === tab.id ? '#fff' : '#1d1d1f',
              fontWeight: activeTab === tab.id ? '600' : '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0, 113, 227, 0.3)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(() => {
        const filteredOrders = activeTab === 'all' 
          ? orders 
          : orders.filter(o => o.status?.toLowerCase() === activeTab);
          
        if (filteredOrders.length === 0) {
          return (
            <div className="empty-orders">
              <Package className="empty-icon mx-auto" size={64} style={{ color: '#8c8c8c' }} />
              <h2 className="text-xl font-semibold mb-2" style={{ marginTop: '15px' }}>Không tìm thấy đơn hàng nào</h2>
              <p className="text-text-muted mb-6">Bạn chưa có đơn hàng nào trong trạng thái này.</p>
              {activeTab !== 'all' && (
                <button 
                  onClick={() => setActiveTab('all')} 
                  className="cps-btn-primary"
                  style={{ background: '#f5f5f7', color: '#1d1d1f', border: 'none' }}
                >
                  Xem tất cả đơn hàng
                </button>
              )}
            </div>
          );
        }

        return (
          <div className="orders-list">
            {filteredOrders.map((order) => {
            const statusInfo = getStatusDisplay(order.status);
            return (
              <div key={order.id} className="order-card glass">
                <div className="order-header-row">
                  <div>
                    <div className="order-id">Đơn hàng DH-{order.id}</div>
                    <div className="order-date">
                      Đặt lúc: {new Date(order.orderDate).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <div className={`order-status-badge ${statusInfo.class} flex items-center gap-1`}>
                    {statusInfo.icon}
                    {statusInfo.text}
                  </div>
                </div>

                <div className="order-items">
                  {order.items && order.items.map((item) => (
                    <div key={item.id} className="order-item">
                      <Link to={`/product/${item.productId}`} className="shrink-0">
                        <img 
                          src={item.productImage || 'https://via.placeholder.com/60'} 
                          alt={item.productName} 
                          className="item-image"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/60' }}
                        />
                      </Link>
                      <div className="item-details">
                        <Link to={`/product/${item.productId}`} className="item-name block hover:text-primary" style={{ textDecoration: 'none', color: 'inherit' }}>
                          {item.productName}
                        </Link>
                        <div className="item-meta">
                          {[item.color, item.capacity].filter(Boolean).join(' - ')} x {item.quantity}
                        </div>
                      </div>
                      <div className="myorders-item-price">
                        {new Intl.NumberFormat('vi-VN').format(item.price)} đ
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <div className="text-sm text-text-muted flex flex-col gap-1">
                    <div>Thanh toán: {order.paymentMethod} - <strong className={order.paymentStatus === 'Paid' ? 'text-success' : 'text-warning'}>{order.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</strong></div>
                    <div>Giao đến: {order.shippingAddress || 'N/A'}</div>
                  </div>
                  <div className="text-right">
                    <div className="order-total-label">Tổng tiền</div>
                    <div className="myorders-total-amount">
                      {new Intl.NumberFormat('vi-VN').format(order.totalAmount)} đ
                    </div>
                    {order.status?.toLowerCase() === 'pending' && (
                      <button 
                        onClick={() => handleCancelOrder(order.id)}
                        style={{ 
                          marginTop: '10px', 
                          padding: '8px 16px', 
                          fontSize: '0.9rem', 
                          borderRadius: '8px', 
                          cursor: 'pointer', 
                          border: '1px solid #6b7280', 
                          background: 'transparent', 
                          color: '#4b5563', 
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#1f2937'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4b5563'; }}
                      >
                        Hủy đơn hàng
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        );
      })()}
    </div>
  );
}
