import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import api from '../../services/api';
import '../../styles/Cart.css';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shippingFee] = useState(30000); // Vẫn giữ fee ở giỏ hàng để nhẩm tính tổng
  
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/Cart');
      setCart(response.data);
      setError(null);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Lỗi khi lấy giỏ hàng:', err);
      setError('Không thể tải giỏ hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (id, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;

    try {
      // Optimistic update
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        ),
        totalPrice: prev.items.reduce((total, item) => {
          const itemQ = item.id === id ? newQuantity : item.quantity;
          return total + item.price * itemQ;
        }, 0)
      }));

      await api.put(`/Cart/items/${id}`, { quantity: newQuantity });
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Lỗi khi cập nhật số lượng:', err);
      // Revert on error by refetching
      fetchCart();
      alert('Không thể cập nhật số lượng. Vui lòng thử lại.');
    }
  };

  const handleRemoveItem = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) return;
    
    try {
      await api.delete(`/Cart/items/${id}`);
      fetchCart();
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm:', err);
      alert('Không thể xóa sản phẩm. Vui lòng thử lại.');
    }
  };



  if (loading) {
    return (
      <div className="container cart-page">
        <div className="loading-container">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container cart-page">
        <div className="empty-cart">
          <p className="empty-cart-text text-danger">{error}</p>
          <button className="cps-btn-primary" onClick={fetchCart}>Thử lại</button>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container cart-page">
        <div className="empty-cart">
          <ShoppingBag className="empty-cart-icon" size={64} />
          <h2 className="empty-cart-title">Giỏ hàng của bạn đang trống</h2>
          <p className="empty-cart-text">Hãy khám phá thêm các sản phẩm tuyệt vời của chúng tôi nhé!</p>
          <Link to="/" className="cps-btn-primary">Mua sắm ngay</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <div className="cart-header">
        <h1 className="cart-title">Giỏ hàng ({cart.items.length} sản phẩm)</h1>
      </div>

      <div className="cart-content">
        <div className="cart-items-container">
          {cart.items.map((item) => (
            <div key={item.id} className="cart-item glass">
              <img 
                src={item.productImage || 'https://via.placeholder.com/100'} 
                alt={item.productName} 
                className="cart-item-image"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/100' }}
              />
              
              <div className="cart-item-details">
                <h3 className="cart-item-name">{item.productName}</h3>
                <div className="cart-item-variants">
                  {item.color && <span>Màu: {item.color}</span>}
                  {item.size && <span style={{marginLeft: '10px'}}>Phân loại: {item.size}</span>}
                </div>
                <div className="cps-cart-price">
                  {new Intl.NumberFormat('vi-VN').format(item.price)} đ
                </div>
              </div>

              <div className="cart-item-actions">
                <div className="quantity-control">
                  <button 
                    className="quantity-btn"
                    onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="quantity-value">{item.quantity}</span>
                  <button 
                    className="quantity-btn"
                    onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <button 
                  className="remove-btn"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <Trash2 size={16} />
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2 className="summary-title">Tóm tắt đơn hàng</h2>
          
          <div className="cps-summary-row">
            <span>Tạm tính</span>
            <span>{new Intl.NumberFormat('vi-VN').format(cart.totalPrice)} đ</span>
          </div>
          
          <div className="cps-summary-row cps-shipping-fee-row" style={{ color: 'var(--cps-text-light)', fontSize: '0.9rem', marginTop: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Truck size={16} /> Phí vận chuyển</span>
            <span>{new Intl.NumberFormat('vi-VN').format(shippingFee)} đ</span>
          </div>

          <div className="cps-summary-total">
            <span>Tổng tiền</span>
            <span>{new Intl.NumberFormat('vi-VN').format(cart.totalPrice + shippingFee)} đ</span>
          </div>
          
          <button 
            className="cps-btn-primary checkout-btn"
            onClick={() => navigate('/checkout')}
            style={{ 
              width: '100%', 
              marginTop: '1rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'
            }}
          >
            Tiến hành thanh toán
            <ArrowRight size={18} />
          </button>
        </div>
      </div>


    </div>
  );
}
